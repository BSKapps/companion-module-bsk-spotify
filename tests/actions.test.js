const net = require('net')
const { simpleAction } = require('../src/actions')
const SpotifyClient = require('../src/spotify')

function makeSelf(opts = {}) {
	return {
		_useAppleScript: opts.useAppleScript || false,
		log: jest.fn(),
		enterAppleScriptFallback: jest.fn(() => {
			if (opts.fallbackAvailable === false) return false
			return true
		}),
	}
}

test('API success does not touch AppleScript', async () => {
	let self = makeSelf()
	let asFn = jest.fn(async () => {})
	let apiFn = jest.fn(async () => {})
	await simpleAction(self, 'Next track', asFn, apiFn)
	expect(apiFn).toHaveBeenCalledTimes(1)
	expect(asFn).not.toHaveBeenCalled()
	expect(self.enterAppleScriptFallback).not.toHaveBeenCalled()
	expect(self.log).not.toHaveBeenCalled()
})

test('network failure switches to fallback and replays the press via AppleScript', async () => {
	let self = makeSelf()
	let asFn = jest.fn(async () => {})
	let err = new Error('getaddrinfo ENOTFOUND api.spotify.com')
	err.isNetwork = true
	let apiFn = jest.fn(async () => { throw err })
	await simpleAction(self, 'Next track', asFn, apiFn)
	expect(self.enterAppleScriptFallback).toHaveBeenCalledWith('getaddrinfo ENOTFOUND api.spotify.com')
	expect(asFn).toHaveBeenCalledTimes(1)
	expect(self.log).not.toHaveBeenCalled()
})

test('network failure without a fallback platform logs the error and does not replay', async () => {
	let self = makeSelf({ fallbackAvailable: false })
	let asFn = jest.fn(async () => {})
	let err = new Error('Request timeout')
	err.isNetwork = true
	let apiFn = jest.fn(async () => { throw err })
	await simpleAction(self, 'Pause', asFn, apiFn)
	expect(asFn).not.toHaveBeenCalled()
	expect(self.log).toHaveBeenCalledWith('error', 'Pause failed: Request timeout')
})

test('API error that is not a network error never triggers fallback', async () => {
	let self = makeSelf()
	let asFn = jest.fn(async () => {})
	let err = new Error('Player command failed: Restriction violated')
	err.statusCode = 403
	let apiFn = jest.fn(async () => { throw err })
	await simpleAction(self, 'Shuffle on', asFn, apiFn)
	expect(self.enterAppleScriptFallback).not.toHaveBeenCalled()
	expect(asFn).not.toHaveBeenCalled()
	expect(self.log).toHaveBeenCalledWith('error', 'Shuffle on failed: Player command failed: Restriction violated')
})

test('replay failure is logged once with the AppleScript error', async () => {
	let self = makeSelf()
	let asFn = jest.fn(async () => { throw new Error('Spotify got an error: Connection is invalid. (-609)') })
	let err = new Error('read ECONNRESET')
	err.isNetwork = true
	let apiFn = jest.fn(async () => { throw err })
	await simpleAction(self, 'Previous track', asFn, apiFn)
	expect(self.log).toHaveBeenCalledTimes(1)
	expect(self.log).toHaveBeenCalledWith('error', 'Previous track failed: Spotify got an error: Connection is invalid. (-609)')
})

test('AppleScript mode never calls the API', async () => {
	let self = makeSelf({ useAppleScript: true })
	let asFn = jest.fn(async () => {})
	let apiFn = jest.fn(async () => {})
	await simpleAction(self, 'Play', asFn, apiFn)
	expect(apiFn).not.toHaveBeenCalled()
	expect(asFn).toHaveBeenCalledTimes(1)
})

test('_request tags a refused connection as a network error', async () => {
	let client = new SpotifyClient('id', 'secret', 'refresh', 'http://localhost/cb')
	let caught
	try {
		await client._request('GET', 'https://127.0.0.1:1/v1/me/player', null, {}, 2000)
	} catch (e) {
		caught = e
	}
	expect(caught).toBeDefined()
	expect(caught.isNetwork).toBe(true)
})

test('_request tags a timeout as a network error', async () => {
	let sockets = []
	let server = net.createServer((s) => sockets.push(s))
	await new Promise((r) => server.listen(0, '127.0.0.1', r))
	let port = server.address().port
	let client = new SpotifyClient('id', 'secret', 'refresh', 'http://localhost/cb')
	let caught
	try {
		await client._request('GET', `https://127.0.0.1:${port}/v1/me/player`, null, {}, 200)
	} catch (e) {
		caught = e
	}
	for (let s of sockets) s.destroy()
	await new Promise((r) => server.close(r))
	expect(caught).toBeDefined()
	expect(caught.message).toBe('Request timeout')
	expect(caught.isNetwork).toBe(true)
})
