/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 367
(module) {

function parsePosition(str) {
	let parts = (str || '').trim().split(':')
	if (parts.length === 2) {
		let minutes = parseInt(parts[0], 10) || 0
		let seconds = parseFloat(parts[1]) || 0
		return (minutes * 60 + seconds) * 1000
	}
	return (parseFloat(str) || 0) * 1000
}

function getActions() {
	let self = this
	return {
		play: {
			name: 'Play',
			options: [],
			callback: async () => {
				await self.spotify.play()
			},
		},

		pause: {
			name: 'Pause',
			options: [],
			callback: async () => {
				await self.spotify.pause()
			},
		},

		playToggle: {
			name: 'Play/Pause Toggle',
			options: [],
			callback: async () => {
				if (self.state.playerState === 'Playing') {
					await self.spotify.pause()
				} else {
					await self.spotify.play()
				}
			},
		},

		next: {
			name: 'Next Track',
			options: [],
			callback: async () => {
				await self.spotify.next()
			},
		},

		previous: {
			name: 'Previous Track',
			options: [],
			callback: async () => {
				await self.spotify.previous()
			},
		},

		playTrack: {
			name: 'Play Track By ID',
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID (spotify:track:...)',
					default: 'spotify:track:',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'position',
					label: 'Start Position (M:SS, optional)',
					default: '',
					tooltip: 'Leave blank to play from the beginning. Enter a time like 0:30 or 1:23.',
				},
			],
			callback: async (action) => {
				let track = await self.parseVariablesInString(action.options.track)
				let positionRaw = (action.options.position || '').trim()
				let positionMs = positionRaw !== '' ? parsePosition(positionRaw) : undefined
				await self.spotify.playTrack(track, positionMs)
				await self.poll()
			},
		},

		seekTo: {
			name: 'Seek To Position',
			options: [
				{
					type: 'textinput',
					id: 'position',
					label: 'Position (M:SS)',
					default: '0:00',
				},
			],
			callback: async (action) => {
				let positionMs = parsePosition(action.options.position)
				await self.spotify.seekTo(positionMs)
			},
		},

		setVolume: {
			name: 'Set Volume',
			options: [
				{
					type: 'number',
					id: 'volume',
					label: 'Volume (0-100)',
					min: 0,
					max: 100,
					default: 50,
					step: 1,
					required: true,
					range: true,
				},
			],
			callback: async (action) => {
				await self.spotify.setVolume(action.options.volume)
			},
		},

		shuffleOn: {
			name: 'Shuffle On',
			options: [],
			callback: async () => {
				await self.spotify.setShuffle(true)
			},
		},

		shuffleOff: {
			name: 'Shuffle Off',
			options: [],
			callback: async () => {
				await self.spotify.setShuffle(false)
			},
		},

		repeatOff: {
			name: 'Repeat Off',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('off')
			},
		},

		repeatTrack: {
			name: 'Repeat Track',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('track')
			},
		},

		repeatContext: {
			name: 'Repeat Playlist/Album',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('context')
			},
		},
	}
}

module.exports = { getActions }


/***/ },

/***/ 404
(module, __unused_webpack_exports, __webpack_require__) {

const { combineRgb } = __webpack_require__(253)

function getFeedbacks() {
	let self = this
	const white = combineRgb(255, 255, 255)
	const red = combineRgb(255, 0, 0)
	const green = combineRgb(0, 150, 0)

	return {
		playbackState: {
			type: 'boolean',
			name: 'Playback State',
			description: 'Indicate if playback is in a given state',
			defaultStyle: { color: white, bgcolor: red },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: 'Playing',
					choices: [
						{ id: 'Playing', label: 'Playing' },
						{ id: 'Paused', label: 'Paused' },
						{ id: 'Stopped', label: 'Stopped' },
					],
				},
			],
			callback: (event) => {
				return self.state.playerState === event.options.state
			},
		},

		shuffling: {
			type: 'boolean',
			name: 'Shuffle State',
			description: 'Indicate if shuffle is on or off',
			defaultStyle: { color: white, bgcolor: red },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: true,
					choices: [
						{ id: false, label: 'Off' },
						{ id: true, label: 'On' },
					],
				},
			],
			callback: (event) => {
				return self.state.isShuffling === event.options.state
			},
		},

		repeating: {
			type: 'boolean',
			name: 'Repeat State',
			description: 'Indicate if repeat is on or off',
			defaultStyle: { color: white, bgcolor: red },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: true,
					choices: [
						{ id: false, label: 'Off' },
						{ id: true, label: 'On' },
					],
				},
			],
			callback: (event) => {
				return self.state.isRepeating === event.options.state
			},
		},

		thisTrackPlaying: {
			type: 'boolean',
			name: 'This Track Is Playing',
			description: 'Highlight when the configured track is currently playing',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID (spotify:track:...)',
					default: 'spotify:track:',
				},
			],
			callback: (event) => {
				let raw = (event.options.track || '').trim()
				let trackId = raw.replace('spotify:track:', '')
				let current = (self.state.trackId || '').replace('spotify:track:', '')
				if (!trackId || !current) return false
				return trackId === current && self.state.playerState === 'Playing'
			},
		},
	}
}

module.exports = { getFeedbacks }


/***/ },

/***/ 632
(module, __unused_webpack_exports, __webpack_require__) {

const { combineRgb } = __webpack_require__(253)

function getPresets() {
	const white = combineRgb(255, 255, 255)
	const black = combineRgb(0, 0, 0)
	const red = combineRgb(255, 0, 0)
	const darkGreen = combineRgb(0, 100, 0)

	return [
		{
			type: 'button',
			category: 'Playback',
			name: 'Play',
			style: { text: 'PLAY', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'play', options: {} }], up: [] }],
			feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Playing' }, style: { color: white, bgcolor: red } }],
		},
		{
			type: 'button',
			category: 'Playback',
			name: 'Pause',
			style: { text: 'PAUSE', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'pause', options: {} }], up: [] }],
			feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Paused' }, style: { color: white, bgcolor: red } }],
		},
		{
			type: 'button',
			category: 'Playback',
			name: 'Play/Pause Toggle',
			style: { text: 'PLAY/\nPAUSE', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Playback',
			name: 'Next Track',
			style: { text: 'NEXT', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'next', options: {} }], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Playback',
			name: 'Previous Track',
			style: { text: 'PREV', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'previous', options: {} }], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Playback',
			name: 'Position Display',
			style: { text: '$(bsk-spotify:position_hms)', size: '18', color: white, bgcolor: black },
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Track Info',
			name: 'Track Name',
			style: { text: '$(bsk-spotify:track)', size: '14', color: white, bgcolor: black },
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Track Info',
			name: 'Artist Name',
			style: { text: '$(bsk-spotify:artist)', size: '14', color: white, bgcolor: black },
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Volume',
			name: 'Volume Up',
			style: { text: 'VOL +', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'setVolume', options: { volume: 70 } }], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Volume',
			name: 'Volume Down',
			style: { text: 'VOL -', size: '18', color: white, bgcolor: black },
			steps: [{ down: [{ actionId: 'setVolume', options: { volume: 30 } }], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Volume',
			name: 'Volume Level',
			style: { text: 'VOL:\n$(bsk-spotify:volume)', size: '18', color: white, bgcolor: black },
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		},
		{
			type: 'button',
			category: 'Timestamp Cue',
			name: 'Play Track From Timestamp',
			style: { text: 'Track Name\n0:00', size: '14', color: white, bgcolor: darkGreen },
			steps: [
				{
					down: [
						{ actionId: 'shuffleOff', options: {} },
						{ actionId: 'playTrack', options: { track: 'spotify:track:', position: '0:00' } },
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'thisTrackPlaying',
					options: { track: 'spotify:track:' },
					style: { color: white, bgcolor: combineRgb(0, 200, 0) },
				},
			],
		},
	]
}

module.exports = { getPresets }


/***/ },

/***/ 282
(module, __unused_webpack_exports, __webpack_require__) {

const https = __webpack_require__(692)
const querystring = __webpack_require__(480)

class SpotifyClient {
	constructor(clientId, clientSecret, refreshToken, redirectUri) {
		this.clientId = clientId
		this.clientSecret = clientSecret
		this.refreshToken = refreshToken
		this.redirectUri = redirectUri
		this.accessToken = null
	}

	setAccessToken(token) {
		this.accessToken = token
	}

	async refreshAccessToken() {
		let body = querystring.stringify({
			grant_type: 'refresh_token',
			refresh_token: this.refreshToken,
		})
		let data = await this._post('https://accounts.spotify.com/api/token', body, {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
		})
		this.accessToken = data.access_token
		if (data.refresh_token) {
			this.refreshToken = data.refresh_token
		}
		return data
	}

	static async exchangeCode(code, clientId, clientSecret, redirectUri) {
		let body = querystring.stringify({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri,
		})
		let client = new SpotifyClient(clientId, clientSecret, null, redirectUri)
		return client._post('https://accounts.spotify.com/api/token', body, {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
		})
	}

	async getPlaybackState() {
		return this._apiGet('/v1/me/player')
	}

	async play(deviceId) {
		let path = '/v1/me/player/play'
		if (deviceId) path += `?device_id=${encodeURIComponent(deviceId)}`
		return this._apiPut(path, {})
	}

	async pause() {
		return this._apiPut('/v1/me/player/pause', {})
	}

	async next() {
		return this._apiPost('/v1/me/player/next', {})
	}

	async previous() {
		return this._apiPost('/v1/me/player/previous', {})
	}

	async playTrack(trackUri, positionMs) {
		let body = { uris: [trackUri] }
		if (positionMs !== undefined && positionMs !== null) {
			body.position_ms = Math.round(positionMs)
		}
		return this._apiPut('/v1/me/player/play', body)
	}

	async seekTo(positionMs) {
		return this._apiPut(`/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, {})
	}

	async setVolume(percent) {
		return this._apiPut(`/v1/me/player/volume?volume_percent=${Math.round(percent)}`, {})
	}

	async setShuffle(state) {
		return this._apiPut(`/v1/me/player/shuffle?state=${state ? 'true' : 'false'}`, {})
	}

	async setRepeat(state) {
		// state: 'track', 'context', 'off'
		return this._apiPut(`/v1/me/player/repeat?state=${state}`, {})
	}

	async _apiGet(path) {
		return this._request('GET', `https://api.spotify.com${path}`, null, {
			Authorization: `Bearer ${this.accessToken}`,
		})
	}

	async _apiPut(path, body) {
		return this._request('PUT', `https://api.spotify.com${path}`, JSON.stringify(body), {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
		})
	}

	async _apiPost(path, body) {
		return this._request('POST', `https://api.spotify.com${path}`, JSON.stringify(body), {
			Authorization: `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
		})
	}

	async _post(url, body, headers) {
		return this._request('POST', url, body, headers)
	}

	_request(method, url, body, headers) {
		return new Promise((resolve, reject) => {
			let parsed = new URL(url)
			let options = {
				hostname: parsed.hostname,
				path: parsed.pathname + parsed.search,
				method,
				headers: Object.assign({}, headers),
			}
			if (body) {
				options.headers['Content-Length'] = Buffer.byteLength(body)
			}
			let req = https.request(options, (res) => {
				let chunks = []
				res.on('data', (d) => chunks.push(d))
				res.on('end', () => {
					let raw = Buffer.concat(chunks).toString()
					if (res.statusCode === 204 || raw.length === 0) {
						resolve(null)
						return
					}
					try {
						let data = JSON.parse(raw)
						if (res.statusCode >= 400) {
							reject(new Error(data.error ? data.error.message : `HTTP ${res.statusCode}`))
						} else {
							resolve(data)
						}
					} catch (e) {
						if (res.statusCode >= 400) {
							reject(new Error(`HTTP ${res.statusCode}: ${raw}`))
						} else {
							resolve(null)
						}
					}
				})
			})
			req.on('error', reject)
			if (body) req.write(body)
			req.end()
		})
	}
}

module.exports = SpotifyClient


/***/ },

/***/ 969
(module) {

function getVariables() {
	return [
		{ variableId: 'track', name: 'Current Track Name' },
		{ variableId: 'artist', name: 'Current Artist' },
		{ variableId: 'album', name: 'Current Album' },
		{ variableId: 'state', name: 'Player State' },
		{ variableId: 'volume', name: 'Volume' },
		{ variableId: 'shuffle', name: 'Shuffle State' },
		{ variableId: 'repeat', name: 'Repeat State' },
		{ variableId: 'position_ms', name: 'Position (ms)' },
		{ variableId: 'position_hms', name: 'Position (M:SS)' },
		{ variableId: 'duration_hms', name: 'Duration (M:SS)' },
	]
}

function msToHMS(ms) {
	let total = Math.floor(ms / 1000)
	let mins = Math.floor(total / 60)
	let secs = total % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

function updateVariables() {
	this.setVariableValues({
		track: this.state.trackName || '',
		artist: this.state.artistName || '',
		album: this.state.albumName || '',
		state: this.state.playerState || 'Stopped',
		volume: this.state.volume !== undefined ? String(this.state.volume) : '',
		shuffle: this.state.isShuffling ? 'On' : 'Off',
		repeat: this.state.isRepeating ? 'On' : 'Off',
		position_ms: String(this.state.positionMs || 0),
		position_hms: msToHMS(this.state.positionMs || 0),
		duration_hms: msToHMS(this.state.durationMs || 0),
	})
}

module.exports = { getVariables, updateVariables }


/***/ },

/***/ 253
(module) {

"use strict";
module.exports = require("@companion-module/base");

/***/ },

/***/ 692
(module) {

"use strict";
module.exports = require("https");

/***/ },

/***/ 480
(module) {

"use strict";
module.exports = require("querystring");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const { InstanceBase, runEntrypoint, InstanceStatus } = __webpack_require__(253)
const { getActions } = __webpack_require__(367)
const { getFeedbacks } = __webpack_require__(404)
const { getPresets } = __webpack_require__(632)
const { getVariables, updateVariables } = __webpack_require__(969)
const SpotifyClient = __webpack_require__(282)

const POLL_INTERVAL_MS = 2000
const REDIRECT_URI = 'http://127.0.0.1:4115/callback'

class SpotifyInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.spotify = null
		this.pollTimer = null
		this.state = {
			playerState: 'Stopped',
			trackId: '',
			trackName: '',
			artistName: '',
			albumName: '',
			positionMs: 0,
			durationMs: 0,
			volume: 0,
			isShuffling: false,
			isRepeating: false,
		}
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Disconnected)
		this.setVariableDefinitions(getVariables())
		this.setActionDefinitions(getActions.call(this))
		this.setFeedbackDefinitions(getFeedbacks.call(this))
		this.setPresetDefinitions(getPresets.call(this))
		updateVariables.call(this)

		if (config.clientId && config.clientSecret && config.refreshToken) {
			this.spotify = new SpotifyClient(config.clientId, config.clientSecret, config.refreshToken, REDIRECT_URI)
			await this.connectAndPoll()
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter Client ID, Client Secret, and authenticate')
		}
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		if (config.clientId && config.clientSecret && config.refreshToken) {
			this.spotify = new SpotifyClient(config.clientId, config.clientSecret, config.refreshToken, REDIRECT_URI)
			await this.connectAndPoll()
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Enter Client ID, Client Secret, and authenticate')
		}
	}

	async connectAndPoll() {
		try {
			await this.spotify.refreshAccessToken()
			this.updateStatus(InstanceStatus.Ok)
			this.startPolling()
		} catch (e) {
			this.log('error', `Auth failed: ${e.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed - check credentials')
		}
	}

	startPolling() {
		this.stopPolling()
		this.poll()
		this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS)
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
	}

	async poll() {
		if (!this.spotify) return
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
			} else {
				this.state.playerState = data.is_playing ? 'Playing' : 'Paused'
				this.state.trackId = data.item.uri || ''
				this.state.trackName = data.item.name || ''
				this.state.artistName = (data.item.artists || []).map((a) => a.name).join(', ')
				this.state.albumName = (data.item.album && data.item.album.name) || ''
				this.state.positionMs = data.progress_ms || 0
				this.state.durationMs = data.item.duration_ms || 0
				this.state.volume = data.device ? data.device.volume_percent : this.state.volume
				this.state.isShuffling = data.shuffle_state || false
				this.state.isRepeating = data.repeat_state !== 'off'
			}
			updateVariables.call(this)
			this.checkFeedbacks()
		} catch (e) {
			this.log('warn', `Poll error: ${e.message}`)
		}
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'Setup',
				value:
					'1. Go to <a href="https://developer.spotify.com/dashboard" target="_blank">developer.spotify.com/dashboard</a><br>' +
					'2. Create an app, add <b>http://127.0.0.1:4115/callback</b> as a Redirect URI<br>' +
					'3. Copy your Client ID and Client Secret below<br>' +
					'4. Click <b>Authenticate with Spotify</b> to connect',
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
				id: 'authInfo',
				label: 'Authentication',
				value: 'After entering your Client ID and Secret, save the config then click the button below.',
				width: 12,
			},
			{
				type: 'button',
				id: 'auth',
				label: 'Authenticate with Spotify',
				width: 4,
				default: '',
			},
			{
				type: 'textinput',
				id: 'refreshToken',
				label: 'Refresh Token (auto-filled after authentication)',
				width: 12,
				default: '',
			},
		]
	}

	async handleHttpRequest(request) {
		if (request.path === '/auth/start') {
			if (!this.config.clientId || !this.config.clientSecret) {
				return { status: 400, body: 'Enter Client ID and Secret first' }
			}
			let scopes = [
				'user-read-playback-state',
				'user-modify-playback-state',
				'user-read-currently-playing',
			].join(' ')
			let state = Math.random().toString(36).substring(2)
			this._oauthState = state
			let url =
				'https://accounts.spotify.com/authorize' +
				`?client_id=${encodeURIComponent(this.config.clientId)}` +
				`&response_type=code` +
				`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
				`&scope=${encodeURIComponent(scopes)}` +
				`&state=${state}`
			return {
				status: 302,
				headers: { Location: url },
				body: '',
			}
		}

		if (request.path === '/auth/callback') {
			let params = request.query || {}
			if (params.error) {
				return { status: 400, body: `Spotify auth error: ${params.error}` }
			}
			if (params.state !== this._oauthState) {
				return { status: 400, body: 'State mismatch - try again' }
			}
			try {
				let tokens = await SpotifyClient.exchangeCode(
					params.code,
					this.config.clientId,
					this.config.clientSecret,
					REDIRECT_URI
				)
				// Save refresh token to config
				this.config.refreshToken = tokens.refresh_token
				this.saveConfig(this.config)
				this.spotify = new SpotifyClient(
					this.config.clientId,
					this.config.clientSecret,
					tokens.refresh_token,
					REDIRECT_URI
				)
				this.spotify.setAccessToken(tokens.access_token)
				this.updateStatus(InstanceStatus.Ok)
				this.startPolling()
				return {
					status: 200,
					body: '<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Authenticated successfully!</h2><p>You can close this window and return to Companion.</p></body></html>',
				}
			} catch (e) {
				return { status: 500, body: `Token exchange failed: ${e.message}` }
			}
		}

		return { status: 404, body: 'Not found' }
	}

	async destroy() {
		this.stopPolling()
	}
}

runEntrypoint(SpotifyInstance, [])

module.exports = __webpack_exports__;
/******/ })()
;