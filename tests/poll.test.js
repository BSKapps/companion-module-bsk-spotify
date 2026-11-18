const { EventEmitter } = require('events')
const https = require('https')

let captured = null
jest.mock('@companion-module/base', () => ({
	InstanceBase: class {},
	InstanceStatus: { Ok: 'ok', Warning: 'warning', ConnectionFailure: 'connection_failure' },
	runEntrypoint: (cls) => { captured = cls },
}))
jest.mock('../src/albumart', () => ({ processAlbumArt: jest.fn(async () => ({})) }))

require('../src/main')
const SpotifyClient = require('../src/spotify')

afterEach(() => {
	jest.restoreAllMocks()
})

function makeInstance(spotify) {
	let inst = Object.create(captured.prototype)
	Object.assign(inst, {
		_destroyed: false,
		_isPolling: false,
		_useAppleScript: false,
		_apiHealthy: true,
		_statusOk: true,
		_pollCount: 0,
		_lastTrackId: 'spotify:track:abc',
		_consecutivePollErrors: 0,
		_albumArtCache: {},
		config: {},
		state: { contextUri: '', albumArtUrl: '', positionMs: 0, durationMs: 0 },
		spotify,
		log: jest.fn(),
		updateStatus: jest.fn(),
		checkFeedbacks: jest.fn(),
		setVariableValues: jest.fn(),
	})
	return inst
}

function playback(progressMs, startedAt) {
	let data = {
		is_playing: true,
		progress_ms: progressMs,
		currently_playing_type: 'track',
		item: { uri: 'spotify:track:abc', name: 'Song', artists: [], album: { name: 'A', images: [] }, duration_ms: 200000 },
		device: { id: 'd', name: 'Mac', type: 'Computer', volume_percent: 50 },
		context: null,
	}
	Object.defineProperty(data, 'requestStartedAt', { value: startedAt })
	return data
}

test('a slow poll reply is timed from the middle of the request, not from when it arrived', async () => {
	let now = 1000000
	jest.spyOn(Date, 'now').mockImplementation(() => now)
	let spotify = { getPlaybackState: jest.fn(async () => playback(190000, now - 4000)) }
	let inst = makeInstance(spotify)
	await inst.poll()
	expect(inst._lastPollAt).toBe(now - 2000)
	expect(inst._lastPolledPositionMs).toBe(190000)
	expect(inst.state.positionMs).toBe(192000)
	now += 500
	inst.tick()
	expect(inst.state.positionMs).toBe(192500)
})

test('after a slow reply the countdown keeps running until the next reply is due', async () => {
	let now = 1000000
	jest.spyOn(Date, 'now').mockImplementation(() => now)
	let inst = makeInstance({ getPlaybackState: jest.fn(async () => playback(190000, now - 3500)) })
	await inst.poll()
	now += 3900
	inst.tick()
	expect(inst.state.positionMs).toBe(190000 + 1750 + 3900)
	now += 200
	inst.tick()
	expect(inst.state.positionMs).toBe(190000 + 1750 + 3900)
})

test('a paused poll reply is not advanced by the request time', async () => {
	let now = 1000000
	jest.spyOn(Date, 'now').mockImplementation(() => now)
	let data = playback(190000, now - 4000)
	data.is_playing = false
	let inst = makeInstance({ getPlaybackState: jest.fn(async () => data) })
	await inst.poll()
	expect(inst.state.positionMs).toBe(190000)
})

test('the advanced position never passes the track length', async () => {
	let now = 1000000
	jest.spyOn(Date, 'now').mockImplementation(() => now)
	let inst = makeInstance({ getPlaybackState: jest.fn(async () => playback(199500, now - 4000)) })
	await inst.poll()
	expect(inst.state.positionMs).toBe(200000)
})

test('_request records when the request that produced the reply was sent', async () => {
	let now = 5000
	jest.spyOn(Date, 'now').mockImplementation(() => now)
	jest.spyOn(https, 'request').mockImplementation((opts, cb) => {
		let req = new EventEmitter()
		req.write = () => {}
		req.destroy = () => {}
		req.end = () => {
			now += 3000
			let res = new EventEmitter()
			res.statusCode = 200
			res.headers = {}
			cb(res)
			res.emit('data', Buffer.from(JSON.stringify({ progress_ms: 1 })))
			res.emit('end')
		}
		return req
	})
	let client = new SpotifyClient('id', 'secret', 'refresh', 'http://localhost/cb')
	let data = await client._request('GET', 'https://api.spotify.com/v1/me/player', null, {}, 5000)
	expect(data.requestStartedAt).toBe(5000)
	expect(Object.keys(data)).toEqual(['progress_ms'])
})
