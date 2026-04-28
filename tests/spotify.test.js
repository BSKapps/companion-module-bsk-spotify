const SpotifyClient = require('../src/spotify')

function makeClient() {
	let c = new SpotifyClient('id', 'secret', 'refresh', 'http://localhost/cb')
	c.accessToken = 'token'
	return c
}

// ====== Token refresh on 401 ======

test('retries request after 401 by refreshing token', async () => {
	let client = makeClient()
	let callCount = 0
	client._request = jest.fn(async (method, url, body, headers) => {
		callCount++
		if (callCount === 1) {
			let err = new Error('The access token expired')
			err.statusCode = 401
			throw err
		}
		return { is_playing: false }
	})
	client.refreshAccessToken = jest.fn(async () => { client.accessToken = 'newtoken' })

	let result = await client.getPlaybackState()
	expect(client.refreshAccessToken).toHaveBeenCalledTimes(1)
	expect(callCount).toBe(2)
	expect(result).toEqual({ is_playing: false })
})

test('does not retry on non-401 errors', async () => {
	let client = makeClient()
	client._request = jest.fn(async () => {
		let err = new Error('Not Found')
		err.statusCode = 404
		throw err
	})
	client.refreshAccessToken = jest.fn()
	await expect(client.getPlaybackState()).rejects.toThrow('Not Found')
	expect(client.refreshAccessToken).not.toHaveBeenCalled()
})

// ====== Volume clamping ======

test('setVolume called with value in range does not throw', async () => {
	let client = makeClient()
	client._request = jest.fn(async () => null)
	await expect(client.setVolume(50)).resolves.toBeNull()
})

// ====== Track URI normalisation ======

const { } = require('../src/actions') // just ensure it loads
const normaliseTrackUri = (() => {
	const src = require('fs').readFileSync(
		require('path').join(__dirname, '../src/actions.js'), 'utf8'
	)
	// Extract and eval the function (it's not exported)
	const match = src.match(/function normaliseTrackUri[\s\S]*?^}/m)
	if (!match) return null
	return eval(`(${match[0]})`)
})()

test('normaliseTrackUri handles spotify URI', () => {
	expect(normaliseTrackUri('spotify:track:abc123')).toBe('spotify:track:abc123')
})

test('normaliseTrackUri handles open.spotify.com URL', () => {
	expect(normaliseTrackUri('https://open.spotify.com/track/abc123?si=xyz')).toBe('spotify:track:abc123')
})

test('normaliseTrackUri handles bare ID', () => {
	expect(normaliseTrackUri('abc123defghijklmnopqr')).toBe('spotify:track:abc123defghijklmnopqr')
})

test('normaliseTrackUri returns empty for empty input', () => {
	expect(normaliseTrackUri('')).toBe('')
})
