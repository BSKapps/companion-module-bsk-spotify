const { InstanceBase, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const http = require('http')
const https = require('https')
const crypto = require('crypto')
const { exec } = require('child_process')
const { getActions } = require('./actions')
const { getFeedbacks } = require('./feedbacks')
const { getPresets } = require('./presets')
const { getVariables, updateVariables } = require('./variables')
const SpotifyClient = require('./spotify')
const AppleScriptSpotify = require('./applescript')
const { processAlbumArt } = require('./albumart')
const UpgradeScripts = require('./upgrades')

const POLL_INTERVAL_MS = 2000
const TICK_INTERVAL_MS = 500
const OAUTH_PORT = 4115
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/callback`


class SpotifyInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.spotify = null
		this.pollTimer = null
		this.oauthServer = null
		this.state = {
			playerState: 'Stopped',
			trackId: '',
			trackName: '',
			artistName: '',
			albumName: '',
			albumArtUrl: '',
			positionMs: 0,
			durationMs: 0,
			volume: 0,
			isShuffling: false,
			isRepeating: false,
			repeatMode: 'off',
			deviceName: '',
			deviceType: '',
			deviceId: '',
			contextUri: '',
			contextType: '',
			nextTrackName: '',
			nextTrackArtist: '',
			nextTrackId: '',
			isLiked: false,
			availableDevices: [],
		}
		this._albumArtCache = {}
		this._displayCycleIndex = 0
		this._pollCount = 0
		this._premuteVolume = 50
		this._fadeTimer = null
		this._lastTrackId = ''
		this._isPolling = false
		this._apiHealthy = true
		this._consecutivePollErrors = 0
		this._smartShuffleWarned = false
		this._tickTimer = null
		this._lastPollAt = 0
		this._lastPolledPositionMs = 0
		this._useAppleScript = false
		this._asPollCount = 0
		this._as = new AppleScriptSpotify()
		this._statusOk = false
		this._probeInFlight = false
		this._lastApiSuccessAt = 0
		this._destroyed = false
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Disconnected)
		this.setVariableDefinitions(getVariables())
		this.setActionDefinitions(getActions.call(this))
		this.setFeedbackDefinitions(getFeedbacks.call(this))
		this.setPresetDefinitions(getPresets.call(this))
		updateVariables.call(this)
		await this.applyConfig(config)
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		if (this._fadeTimer) {
			clearInterval(this._fadeTimer)
			this._fadeTimer = null
		}
		this._consecutivePollErrors = 0
		this._apiHealthy = true
		this._statusOk = false
		this._useAppleScript = false
		this._asPollCount = 0
		await this.applyConfig(config)
	}

	_wireRefreshTokenPersistence() {
		this.spotify.onRefreshTokenChanged = (token) => {
			this.config.refreshToken = token
			this.saveConfig(this.config)
			this.log('info', 'Spotify rotated the refresh token - saved the new one')
		}
	}

	async applyConfig(config) {
		let clientId = (config.clientId || '').trim()
		let clientSecret = (config.clientSecret || '').trim()
		let refreshToken = (config.refreshToken || '').trim()
		if (clientId && clientSecret) {
			this.startOAuthServer(clientId, clientSecret)
		}
		if (clientId && clientSecret && refreshToken) {
			this.spotify = new SpotifyClient(clientId, clientSecret, refreshToken, REDIRECT_URI)
			this._wireRefreshTokenPersistence()
			try {
				await this.spotify.refreshAccessToken()
				this.updateStatus(InstanceStatus.Ok)
				this._statusOk = true
				this.startPolling()
			} catch (e) {
				this.log('error', `Auth failed: ${e.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed - check credentials, network, or re-authenticate')
				this._statusOk = false
				this.startPolling()
			}
		} else if (clientId && clientSecret) {
			this.updateStatus(InstanceStatus.BadConfig, 'Open http://127.0.0.1:4115/auth in your browser to authenticate')
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter Client ID and Client Secret')
		}
	}

	startOAuthServer(clientId, clientSecret) {
		if (this.oauthServer) {
			try { this.oauthServer.close() } catch (e) {}
		}
		let self = this
		let state = crypto.randomBytes(16).toString('hex')
		this._oauthState = state

		let scopes = [
			'user-read-playback-state',
			'user-modify-playback-state',
			'user-read-currently-playing',
			'user-library-read',
			'user-library-modify',
		].join(' ')

		let authUrl =
			'https://accounts.spotify.com/authorize' +
			`?client_id=${encodeURIComponent(clientId)}` +
			`&response_type=code` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&scope=${encodeURIComponent(scopes)}` +
			`&state=${state}`

		this.oauthServer = http.createServer(async (req, res) => {
			let url = new URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`)
			if (url.pathname === '/auth') {
				res.writeHead(302, { Location: authUrl })
				res.end()
				return
			}
			if (url.pathname !== '/callback') {
				res.writeHead(404)
				res.end('Not found')
				return
			}
			let code = url.searchParams.get('code')
			let returnedState = url.searchParams.get('state')
			let error = url.searchParams.get('error')

			if (error || returnedState !== self._oauthState) {
				self.log('warn', `OAuth callback rejected: ${error || 'state mismatch'}`)
				res.writeHead(400, { 'Content-Type': 'text/html' })
				res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>Auth failed</h2><p>Open the auth link from the Companion connection settings and try again.</p></body></html>')
				return
			}

			try {
				let tokens = await SpotifyClient.exchangeCode(code, clientId, clientSecret, REDIRECT_URI)
				self.config.refreshToken = tokens.refresh_token
				self.saveConfig(self.config)
				self.spotify = new SpotifyClient(clientId, clientSecret, tokens.refresh_token, REDIRECT_URI)
				self._wireRefreshTokenPersistence()
				self.spotify.setAccessToken(tokens.access_token)
				self.updateStatus(InstanceStatus.Ok)
				self._statusOk = true
				self.startPolling()
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Authenticated!</h2><p>You can close this window and return to Companion.</p></body></html>')
				try { self.oauthServer.close() } catch (e) {}
			} catch (e) {
				self.log('error', `Token exchange failed: ${e.message}`)
				res.writeHead(500, { 'Content-Type': 'text/html' })
				res.end('<html><body style="font-family:sans-serif;padding:40px"><h2>Token exchange failed</h2><p>Check the Companion log, then open the auth link and try again.</p></body></html>')
			}
		})

		this.oauthServer.on('error', (e) => {
			this.log('error', `OAuth server error: ${e.message}`)
		})
		this.oauthServer.listen(OAUTH_PORT, '127.0.0.1', () => {
			this.log('info', `OAuth server listening on port ${OAUTH_PORT}`)
		})

		return authUrl
	}

	launchSpotify() {
		let cmd
		if (process.platform === 'darwin') cmd = 'open -a Spotify'
		else if (process.platform === 'win32') cmd = 'start spotify:'
		else cmd = 'xdg-open spotify:'
		this.log('info', `No active Spotify device - launching Spotify (${process.platform})`)
		exec(cmd, (err) => {
			if (err) this.log('warn', `Could not launch Spotify: ${err.message}`)
		})
	}

	async ensureActiveDevice() {
		let dev = await this.spotify.getDevices()
		let list = ((dev && dev.devices) || []).filter((d) => d.id)
		if (list.length > 0) return list.find((d) => d.is_active) || list[0]
		this.launchSpotify()
		await new Promise((r) => setTimeout(r, 3000))
		dev = await this.spotify.getDevices()
		list = ((dev && dev.devices) || []).filter((d) => d.id)
		return list.find((d) => d.is_active) || list[0] || null
	}

	startPolling() {
		this.stopPolling()
		this._lastApiSuccessAt = Date.now()
		this.poll()
		this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS)
		this._tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS)
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
		if (this._tickTimer) {
			clearInterval(this._tickTimer)
			this._tickTimer = null
		}
	}

	async appleScriptPoll() {
		try {
			let s = await this._as.pollState()
			this.state.playerState = s.playerState
			this.state.trackName = s.trackName
			this.state.artistName = s.artistName
			this.state.albumName = s.albumName
			this.state.positionMs = s.positionMs
			this.state.durationMs = s.durationMs
			this.state.volume = s.volume
			this.state.isShuffling = s.isShuffling
			this.state.isRepeating = s.isRepeating
			this.state.repeatMode = s.isRepeating ? 'context' : 'off'
			if (s.trackId !== this.state.trackId) {
				this.state.trackId = s.trackId
				this._lastTrackId = s.trackId
				this.state.contextUri = ''
				this.state.contextType = ''
				this.state.playlistName = ''
				this.state.albumArtUrl = ''
				this.state.nextTrackName = ''
				this.state.nextTrackArtist = ''
				this.state.nextTrackId = ''
				this.checkFeedbacks('albumArt')
			}
			this._lastPollAt = Date.now()
			this._lastPolledPositionMs = s.positionMs
			updateVariables.call(this)
			this.checkFeedbacks()
		} catch (e) {
			this.log('warn', `AppleScript poll error: ${e.message}`)
		}
	}

	probeApiRecovery() {
		if (this._probeInFlight) return
		this._probeInFlight = true
		this.spotify.getPlaybackState().then(() => {
			this._useAppleScript = false
			this._asPollCount = 0
			this._consecutivePollErrors = 0
			this._lastApiSuccessAt = Date.now()
			this.log('info', 'Internet connectivity restored - switched back to Spotify Web API')
			if (!this._apiHealthy || !this._statusOk) {
				this._apiHealthy = true
				this._statusOk = true
				this.updateStatus(InstanceStatus.Ok)
				this.checkFeedbacks('apiHealthy')
			}
		}).catch(() => {}).finally(() => {
			this._probeInFlight = false
		})
	}

	tick() {
		if (this.state.playerState !== 'Playing') return
		if (!this.state.durationMs) return
		let elapsed = Date.now() - this._lastPollAt
		if (elapsed <= 0 || elapsed > POLL_INTERVAL_MS * 2) return
		let estimated = this._lastPolledPositionMs + elapsed
		if (estimated >= this.state.durationMs) estimated = this.state.durationMs
		this.state.positionMs = estimated
		updateVariables.call(this)
		this.checkFeedbacks('nearEnd', 'positionPast', 'positionBefore', 'progressBar')
	}

	async poll() {
		if (this._destroyed || !this.spotify) return
		if (this._isPolling) return
		this._isPolling = true
		try {
			if (this._useAppleScript) {
				this._asPollCount++
				if (this._asPollCount % 10 === 0) {
					this.probeApiRecovery()
				}
				await this.appleScriptPoll()
				return
			}
			let data = await this.spotify.getPlaybackState()
			if (!data || !data.item) {
				this.state.playerState = 'Stopped'
				this.state.trackId = ''
				this.state.trackName = ''
				this.state.artistName = ''
				this.state.albumName = ''
				this.state.positionMs = 0
				this.state.durationMs = 0
				this.state.deviceId = ''
				this.state.deviceName = ''
				this.state.deviceType = ''
				this.state.albumArtUrl = ''
				this.state.contextUri = ''
				this.state.contextType = ''
				this.state.playlistName = ''
				this.state.nextTrackName = ''
				this.state.nextTrackArtist = ''
				this.state.nextTrackId = ''
				this.state.isLiked = false
				this.state.isShuffling = false
				this.state.repeatMode = 'off'
				this.state.isRepeating = false
			} else {
				let isEpisode = data.currently_playing_type === 'episode'
				this.state.playerState = data.is_playing ? 'Playing' : 'Paused'
				this.state.trackId = data.item.uri || ''
				this.state.trackName = data.item.name || ''
				this.state.artistName = isEpisode
					? (data.item.show && data.item.show.name) || ''
					: (data.item.artists || []).map((a) => a.name).join(', ')
				this.state.albumName = isEpisode
					? (data.item.show && data.item.show.name) || ''
					: (data.item.album && data.item.album.name) || ''
				let artImages = isEpisode
					? (data.item.images || [])
					: (data.item.album && data.item.album.images) || []
				let artUrl = (artImages[0] && artImages[0].url) || ''
				if (artUrl !== this.state.albumArtUrl) {
					this.state.albumArtUrl = artUrl
					this._albumArtCache = {}
					if (artUrl) {
						processAlbumArt(artUrl).then((slices) => {
							this._albumArtCache[artUrl] = slices
							this.checkFeedbacks('albumArt')
						}).catch(() => {})
					}
				}
				this.state.positionMs = data.progress_ms || 0
				this.state.durationMs = data.item.duration_ms || 0
				if (!this._volumeSetAt || Date.now() - this._volumeSetAt > 2000) {
					this.state.volume = data.device && data.device.volume_percent != null ? data.device.volume_percent : this.state.volume
				}
				this.state.deviceName = data.device ? data.device.name : ''
				this.state.deviceType = data.device ? data.device.type : ''
				this.state.deviceId = data.device ? data.device.id : ''
				let newContextUri = data.context ? data.context.uri : ''
				let contextChanged = newContextUri !== this.state.contextUri
				this.state.contextUri = newContextUri
				this.state.contextType = data.context ? data.context.type : ''
				if (contextChanged) {
					if (this.state.contextType === 'playlist' && newContextUri) {
						let id = newContextUri.replace('spotify:playlist:', '')
						this.spotify.getPlaylist(id).then((p) => {
							this.state.playlistName = (p && p.name) || ''
							updateVariables.call(this)
						}).catch(() => { this.state.playlistName = '' })
					} else {
						this.state.playlistName = ''
					}
				}
				this.state.isShuffling = data.shuffle_state || false
				this.state.repeatMode = data.repeat_state || 'off'
				this.state.isRepeating = this.state.repeatMode !== 'off'
				if (data.smart_shuffle && !this._smartShuffleWarned) {
					this._smartShuffleWarned = true
					this.log('warn', 'Smart Shuffle is active in Spotify. The shuffle toggle may not work reliably until Smart Shuffle is turned off in the Spotify app.')
				} else if (!data.smart_shuffle) {
					this._smartShuffleWarned = false
				}
			}
			this._lastPollAt = Date.now()
			this._lastPolledPositionMs = this.state.positionMs
			updateVariables.call(this)
			this.checkFeedbacks()

			this._pollCount++
			let trackChanged = this.state.trackId !== this._lastTrackId
			if (trackChanged) {
				this._lastTrackId = this.state.trackId
			}

			if ((trackChanged || this._pollCount % 5 === 0) && this.state.trackId) {
				if (this.state.trackId.startsWith('spotify:track:')) {
					let trackId = this.state.trackId.replace('spotify:track:', '')
					this.spotify.checkTrackSaved(trackId).then((liked) => {
						if (this.state.isLiked !== liked) {
							this.state.isLiked = liked
							updateVariables.call(this)
							this.checkFeedbacks('trackLiked')
						}
					}).catch(() => {})
				} else if (this.state.isLiked) {
					this.state.isLiked = false
					updateVariables.call(this)
					this.checkFeedbacks('trackLiked')
				}

				this.spotify.getQueue().then((q) => {
					let next = q && q.queue && q.queue[0]
					let nextName = (next && next.name) || ''
					let nextArtist = next ? (next.artists || []).map((a) => a.name).join(', ') : ''
					let nextId = (next && next.uri) || ''
					if (this.state.nextTrackName !== nextName || this.state.nextTrackArtist !== nextArtist) {
						this.state.nextTrackName = nextName
						this.state.nextTrackArtist = nextArtist
						this.state.nextTrackId = nextId
						updateVariables.call(this)
					}
				}).catch(() => {})

				this.spotify.getDevices().then((d) => {
					this.state.availableDevices = ((d && d.devices) || []).filter((dev) => dev.id)
				}).catch(() => {})
			}

			this._consecutivePollErrors = 0
			this._lastApiSuccessAt = Date.now()
			if (!this._apiHealthy || !this._statusOk) {
				this._apiHealthy = true
				this._statusOk = true
				this.updateStatus(InstanceStatus.Ok)
				this.checkFeedbacks('apiHealthy')
			}
		} catch (e) {
			this._consecutivePollErrors++
			this.log('warn', `Poll error: ${e.message}`)
			let offlineTooLong = this._lastApiSuccessAt > 0 && Date.now() - this._lastApiSuccessAt > 15000
			if ((this._consecutivePollErrors >= 3 || offlineTooLong) && this._apiHealthy) {
				this._apiHealthy = false
				this._statusOk = false
				if (process.platform === 'darwin') {
					this._useAppleScript = true
					this._asPollCount = 0
					this.log('warn', 'Web API unreachable - switching to AppleScript fallback (macOS only)')
					this.updateStatus(InstanceStatus.Warning, 'Offline - using AppleScript fallback (macOS only)')
				} else {
					this.updateStatus(InstanceStatus.ConnectionFailure, `API error: ${e.message}`)
				}
				this.checkFeedbacks('apiHealthy')
			}
			if (this._useAppleScript) {
				try { await this.appleScriptPoll() } catch (asErr) {
					this.log('warn', `AppleScript fallback poll failed: ${asErr.message}`)
				}
			}
		} finally {
			this._isPolling = false
		}
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'Setup Instructions',
				value:
					'Create an app at <a href="https://developer.spotify.com/dashboard" target="_blank">developer.spotify.com/dashboard</a> with the Redirect URI <code>http://127.0.0.1:4115/callback</code>, ' +
					'copy its Client ID and Client Secret below, save, then open the auth link below in your browser. ' +
					'Full walkthrough with screenshots: <a href="https://bskapps.com/resources/companion/" target="_blank">bskapps.com/resources/companion</a>',
				width: 12,
			},
			{
				type: 'textinput',
				id: 'clientId',
				label: 'Client ID',
				width: 6,
				default: '',
			},
			{
				type: 'textinput',
				id: 'clientSecret',
				label: 'Client Secret',
				width: 6,
				default: '',
			},
			{
				type: 'static-text',
				id: 'authUrl',
				label: 'Authenticate',
				value: 'After saving the Client ID and Secret, open <a href="http://127.0.0.1:4115/auth" target="_blank">http://127.0.0.1:4115/auth</a> in your browser.',
				width: 12,
			},
			{
				type: 'textinput',
				id: 'refreshToken',
				label: 'Refresh Token (auto-filled after authentication)',
				width: 12,
				default: '',
			},
			{
				type: 'number',
				id: 'displayCycleSeconds',
				label: 'Cycling Display Speed (seconds)',
				width: 6,
				default: 2,
				min: 1,
				max: 30,
				step: 1,
				tooltip: 'How fast the cycling display variables rotate between Track / Artist / Album. Shared by every button that uses them.',
			},
			{
				type: 'static-text',
				id: 'tips',
				label: 'Tips',
				value:
					'If nothing works, make sure Spotify is open and has played at least once on your target device. ' +
					'Re-authenticate if you change your Spotify password. ' +
					'See the help page (question mark, top right) for bookmarks and the macOS offline fallback.',
				width: 12,
			},
		]
	}

	async destroy() {
		this._destroyed = true
		this.stopPolling()
		if (this._fadeTimer) {
			clearInterval(this._fadeTimer)
			this._fadeTimer = null
		}
		if (this.oauthServer) {
			try { this.oauthServer.close() } catch (e) {}
		}
	}
}

runEntrypoint(SpotifyInstance, UpgradeScripts)
