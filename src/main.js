const { InstanceBase, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const http = require('http')
const https = require('https')
const { exec } = require('child_process')
const { getActions } = require('./actions')
const { getFeedbacks } = require('./feedbacks')
const { getPresets } = require('./presets')
const { getVariables, updateVariables } = require('./variables')
const SpotifyClient = require('./spotify')
const { processAlbumArt } = require('./albumart')

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
		await this.applyConfig(config)
	}

	async applyConfig(config) {
		if (config.clientId && config.clientSecret) {
			// Always start OAuth server so /auth and /callback are available
			this.startOAuthServer(config.clientId, config.clientSecret)
		}
		if (config.clientId && config.clientSecret && config.refreshToken) {
			this.spotify = new SpotifyClient(config.clientId, config.clientSecret, config.refreshToken, REDIRECT_URI)
			try {
				await this.spotify.refreshAccessToken()
				this.updateStatus(InstanceStatus.Ok)
				this.startPolling()
			} catch (e) {
				this.log('error', `Auth failed: ${e.message}`)
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed - check credentials or re-authenticate')
			}
		} else if (config.clientId && config.clientSecret) {
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
		let state = Math.random().toString(36).substring(2)
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
				res.writeHead(400)
				res.end(`<html><body style="font-family:sans-serif;padding:40px"><h2>Auth failed</h2><p>${error || 'State mismatch'}</p></body></html>`)
				try { self.oauthServer.close() } catch (e) {}
				return
			}

			try {
				let tokens = await SpotifyClient.exchangeCode(code, clientId, clientSecret, REDIRECT_URI)
				self.config.refreshToken = tokens.refresh_token
				self.saveConfig(self.config)
				self.spotify = new SpotifyClient(clientId, clientSecret, tokens.refresh_token, REDIRECT_URI)
				self.spotify.setAccessToken(tokens.access_token)
				self.updateStatus(InstanceStatus.Ok)
				self.startPolling()
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Authenticated!</h2><p>You can close this window and return to Companion.</p></body></html>')
			} catch (e) {
				res.writeHead(500)
				res.end(`<html><body style="font-family:sans-serif;padding:40px"><h2>Token exchange failed</h2><p>${e.message}</p></body></html>`)
			}
			try { self.oauthServer.close() } catch (e) {}
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
		this.log('info', `No active Spotify device — launching Spotify (${process.platform})`)
		exec(cmd, (err) => {
			if (err) this.log('warn', `Could not launch Spotify: ${err.message}`)
		})
	}

	async ensureActiveDevice() {
		let dev = await this.spotify.getDevices()
		let list = ((dev && dev.devices) || []).filter((d) => d.id)
		if (list.length > 0) return list.find((d) => d.is_active) || list[0]
		// No devices — try launching Spotify and wait
		this.launchSpotify()
		await new Promise((r) => setTimeout(r, 3000))
		dev = await this.spotify.getDevices()
		list = ((dev && dev.devices) || []).filter((d) => d.id)
		return list.find((d) => d.is_active) || list[0] || null
	}

	startPolling() {
		this.stopPolling()
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

	tick() {
		// Local interpolation between polls — bumps positionMs and updates variables
		// without hitting the API. Capped at durationMs.
		if (this.state.playerState !== 'Playing') return
		if (!this.state.durationMs) return
		let elapsed = Date.now() - this._lastPollAt
		if (elapsed <= 0 || elapsed > POLL_INTERVAL_MS * 2) return
		let estimated = this._lastPolledPositionMs + elapsed
		if (estimated >= this.state.durationMs) estimated = this.state.durationMs
		this.state.positionMs = estimated
		updateVariables.call(this)
		this.checkFeedbacks('nearEnd')
	}

	async poll() {
		if (!this.spotify) return
		if (this._isPolling) return
		this._isPolling = true
		try {
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
			} else {
				let isEpisode = data.currently_playing_type === 'episode'
				this.state.playerState = data.is_playing ? 'Playing' : 'Paused'
				this.state.trackId = data.item.uri || ''
				this.state.trackName = data.item.name || ''
				// Episodes have show name instead of artists/album
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
					this.state.volume = data.device ? data.device.volume_percent : this.state.volume
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

			// Fetch queue immediately on track change, otherwise every 5th poll (~10s)
			if ((trackChanged || this._pollCount % 5 === 0) && this.state.trackId) {
				let trackId = this.state.trackId.replace('spotify:track:', '')
				this.spotify.checkTrackSaved(trackId).then((liked) => {
					if (this.state.isLiked !== liked) {
						this.state.isLiked = liked
						updateVariables.call(this)
						this.checkFeedbacks('trackLiked')
					}
				}).catch(() => {})

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

			// Healthy poll
			this._consecutivePollErrors = 0
			if (!this._apiHealthy) {
				this._apiHealthy = true
				this.updateStatus(InstanceStatus.Ok)
				this.checkFeedbacks('apiHealthy')
			}
		} catch (e) {
			this._consecutivePollErrors++
			this.log('warn', `Poll error: ${e.message}`)
			// Mark unhealthy after 3 consecutive failures (~6s)
			if (this._consecutivePollErrors >= 3 && this._apiHealthy) {
				this._apiHealthy = false
				this.updateStatus(InstanceStatus.ConnectionFailure, `API error: ${e.message}`)
				this.checkFeedbacks('apiHealthy')
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
					'<b>Step 1:</b> Go to <a href="https://developer.spotify.com/dashboard" target="_blank">developer.spotify.com/dashboard</a>, log in, and click Create App. Give it any name.<br>' +
					'<b>Step 2:</b> Set the Redirect URI to <code>http://127.0.0.1:4115/callback</code> and save.<br>' +
					'<b>Step 3:</b> Open your new app\'s Settings and copy the Client ID and Client Secret into the fields below.<br>' +
					'<b>Step 4:</b> Save this config.<br>' +
					'<b>Step 5:</b> Open the Authenticate URL shown below in your browser.',
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
				value: 'After saving Client ID and Secret, click: <a href="javascript:void(0)" onclick="(function(){var u=\'http://127.0.0.1:4115/auth\';window.open(u,\'_blank\');})()">Open Auth URL</a><br><small>Or manually visit: http://127.0.0.1:4115/auth</small>',
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
				label: 'Cycling Display Speed (seconds) — global',
				width: 6,
				default: 2,
				min: 1,
				max: 30,
				step: 1,
				tooltip: 'Global setting for the $(bsk-spotify:display) variable, which rotates Track / Artist / Album. This is shared across the whole module — every button using $(bsk-spotify:display) will cycle at the same speed. Cannot be set per-button.',
			},
			{
				type: 'static-text',
				id: 'tips',
				label: 'Tips',
				value:
					'<b>Nothing working?</b> Make sure Spotify is open and has played something on your target device at least once — devices that have never played return "no active device" errors.<br>' +
					'<b>Buttons stop mid-show?</b> The Spotify app may have gone idle. Hit play manually once and Companion will reconnect within 2 seconds.<br>' +
					'<b>Re-authenticate if:</b> you changed your Spotify password, or the module shows a red connection error that does not clear automatically.<br>' +
					'<b>Bookmarks:</b> Save Bookmark captures the current track, position, and playlist/album context. Resume Bookmark returns to that track and position — if it was in a playlist or album, next/prev will continue from there. Due to a Spotify API limitation, playback briefly starts from the beginning of the track before jumping to the saved position. The Spotify app UI may not update to show the playlist view.',
				width: 12,
			},
		]
	}

	async destroy() {
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

runEntrypoint(SpotifyInstance, [])
