const https = require('https')
const querystring = require('querystring')

class SpotifyClient {
	constructor(clientId, clientSecret, refreshToken, redirectUri) {
		this.clientId = (clientId || '').trim()
		this.clientSecret = (clientSecret || '').trim()
		this.refreshToken = (refreshToken || '').trim()
		this.redirectUri = redirectUri
		this.accessToken = null
		this.onRefreshTokenChanged = null
		this._refreshing = null
	}

	setAccessToken(token) {
		this.accessToken = token
	}

	async refreshAccessToken() {
		if (this._refreshing) return this._refreshing
		this._refreshing = this._doRefresh().finally(() => {
			this._refreshing = null
		})
		return this._refreshing
	}

	async _doRefresh() {
		let body = querystring.stringify({
			grant_type: 'refresh_token',
			refresh_token: this.refreshToken,
		})
		let data = await this._post('https://accounts.spotify.com/api/token', body, {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
		})
		this.accessToken = data.access_token
		if (data.refresh_token && data.refresh_token !== this.refreshToken) {
			this.refreshToken = data.refresh_token
			if (this.onRefreshTokenChanged) {
				try { this.onRefreshTokenChanged(data.refresh_token) } catch (e) {}
			}
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

	async playTrack(trackUri, positionMs, deviceId) {
		let body = { uris: [trackUri] }
		if (positionMs !== undefined && positionMs !== null) {
			body.position_ms = Math.round(positionMs)
		}
		let path = '/v1/me/player/play'
		if (deviceId) path += `?device_id=${encodeURIComponent(deviceId)}`
		return this._apiPut(path, body)
	}

	async playContext(contextUri, offsetIndex, positionMs, deviceId) {
		let body = { context_uri: contextUri }
		if (offsetIndex !== undefined && offsetIndex !== null) {
			body.offset = { position: offsetIndex }
		}
		if (positionMs !== undefined && positionMs !== null) {
			body.position_ms = Math.round(positionMs)
		}
		let path = '/v1/me/player/play'
		if (deviceId) path += `?device_id=${encodeURIComponent(deviceId)}`
		return this._apiPut(path, body)
	}

	async playContextAtTrackUri(contextUri, trackUri, positionMs, deviceId) {
		let body = { context_uri: contextUri, offset: { uri: trackUri } }
		if (positionMs !== undefined && positionMs !== null) {
			body.position_ms = Math.round(positionMs)
		}
		let path = '/v1/me/player/play'
		if (deviceId) path += `?device_id=${encodeURIComponent(deviceId)}`
		return this._apiPut(path, body)
	}

	async getDevices() {
		return this._apiGet('/v1/me/player/devices')
	}

	async getPlaylist(playlistId) {
		return this._apiGet(`/v1/playlists/${encodeURIComponent(playlistId)}?fields=name`)
	}

	async transferPlayback(deviceId, play) {
		return this._apiPut('/v1/me/player', { device_ids: [deviceId], play: !!play })
	}

	async getQueue() {
		return this._apiGet('/v1/me/player/queue')
	}

	async addToQueue(trackUri, deviceId) {
		let path = `/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`
		if (deviceId) path += `&device_id=${encodeURIComponent(deviceId)}`
		return this._apiPost(path, {})
	}

	async checkTrackSaved(trackId) {
		let data = await this._apiGet(`/v1/me/tracks/contains?ids=${encodeURIComponent(trackId)}`)
		return Array.isArray(data) ? data[0] : false
	}

	async saveTrack(trackId) {
		return this._apiPut(`/v1/me/tracks?ids=${encodeURIComponent(trackId)}`, {})
	}

	async removeTrack(trackId) {
		return this._apiDelete(`/v1/me/tracks?ids=${encodeURIComponent(trackId)}`)
	}

	async _apiDelete(path) {
		return this._apiCall('DELETE', path, JSON.stringify({}))
	}

	async seekTo(positionMs) {
		return this._apiPut(`/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, {})
	}

	async setVolume(percent) {
		return this._apiPut(`/v1/me/player/volume?volume_percent=${Math.round(percent)}`, {})
	}

	async setShuffle(state, deviceId) {
		let path = `/v1/me/player/shuffle?state=${state ? 'true' : 'false'}`
		if (deviceId) path += `&device_id=${encodeURIComponent(deviceId)}`
		return this._apiPut(path, {})
	}

	async setRepeat(state) {
		return this._apiPut(`/v1/me/player/repeat?state=${state}`, {})
	}

	async _apiGet(path) {
		return this._apiCall('GET', path, null)
	}

	async _apiPut(path, body) {
		return this._apiCall('PUT', path, JSON.stringify(body))
	}

	async _apiPost(path, body) {
		return this._apiCall('POST', path, JSON.stringify(body))
	}

	async _apiCall(method, path, bodyStr) {
		let headers = {
			Authorization: `Bearer ${this.accessToken}`,
		}
		if (bodyStr !== null) {
			headers['Content-Type'] = 'application/json'
		}
		try {
			return await this._request(method, `https://api.spotify.com${path}`, bodyStr, headers)
		} catch (e) {
			if (e.statusCode === 401 || /^HTTP 401/.test(e.message) || /token expired|No token|Unauthorized/i.test(e.message)) {
				await this.refreshAccessToken()
				headers.Authorization = `Bearer ${this.accessToken}`
				return await this._request(method, `https://api.spotify.com${path}`, bodyStr, headers)
			}
			if (e.statusCode === 429) {
				let seconds = parseInt(e.retryAfter || '5', 10)
				if (!Number.isFinite(seconds) || seconds < 0) seconds = 5
				let retryAfter = Math.min(seconds, 30) * 1000
				await new Promise((r) => setTimeout(r, retryAfter))
				return await this._request(method, `https://api.spotify.com${path}`, bodyStr, headers)
			}
			if (e.statusCode === 502 || e.statusCode === 503) {
				await new Promise((r) => setTimeout(r, 1000))
				return await this._request(method, `https://api.spotify.com${path}`, bodyStr, headers)
			}
			throw e
		}
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
				timeout: 10000,
			}
			if (body) {
				options.headers['Content-Length'] = Buffer.byteLength(body)
			}
			let req = https.request(options, (res) => {
				let chunks = []
				res.on('data', (d) => chunks.push(d))
				res.on('end', () => {
					let raw = Buffer.concat(chunks).toString()
					if (res.statusCode >= 400) {
						let msg = `HTTP ${res.statusCode}`
						try {
							let data = JSON.parse(raw)
							if (typeof data.error === 'string') {
								msg = data.error_description || data.error
							} else if (data.error && data.error.message) {
								msg = data.error.message
							}
						} catch (parseErr) {
							if (raw.length > 0) msg = `HTTP ${res.statusCode}: ${raw}`
						}
						let err = new Error(msg)
						err.statusCode = res.statusCode
						err.retryAfter = res.headers['retry-after']
						reject(err)
						return
					}
					if (res.statusCode === 204 || raw.length === 0) {
						resolve(null)
						return
					}
					try {
						resolve(JSON.parse(raw))
					} catch (e) {
						resolve(null)
					}
				})
			})
			req.on('error', reject)
			req.on('timeout', () => {
				req.destroy(new Error('Request timeout'))
			})
			if (body) req.write(body)
			req.end()
		})
	}
}

module.exports = SpotifyClient
