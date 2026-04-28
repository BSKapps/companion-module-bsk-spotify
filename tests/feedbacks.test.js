const { getFeedbacks } = require('../src/feedbacks')

function makeInstance(stateOverrides = {}) {
	return {
		state: {
			playerState: 'Stopped',
			trackId: '',
			trackName: '',
			artistName: '',
			albumName: '',
			isShuffling: false,
			repeatMode: 'off',
			isRepeating: false,
			positionMs: 0,
			durationMs: 0,
			volume: 50,
			deviceId: '',
			deviceName: '',
			isLiked: false,
			...stateOverrides,
		},
		_albumArtCache: {},
	}
}

function fb(inst, id, options = {}) {
	let feedbacks = getFeedbacks.call(inst)
	return feedbacks[id].callback({ options })
}

// playbackState
test('playbackState matches Playing', () => {
	let inst = makeInstance({ playerState: 'Playing' })
	expect(fb(inst, 'playbackState', { state: 'Playing' })).toBe(true)
	expect(fb(inst, 'playbackState', { state: 'Paused' })).toBe(false)
})

test('playbackState matches Stopped', () => {
	let inst = makeInstance({ playerState: 'Stopped' })
	expect(fb(inst, 'playbackState', { state: 'Stopped' })).toBe(true)
})

// isPlaying
test('isPlaying true only when Playing', () => {
	expect(fb(makeInstance({ playerState: 'Playing' }), 'isPlaying')).toBe(true)
	expect(fb(makeInstance({ playerState: 'Paused' }), 'isPlaying')).toBe(false)
	expect(fb(makeInstance({ playerState: 'Stopped' }), 'isPlaying')).toBe(false)
})

// shuffling
test('shuffling feedback', () => {
	expect(fb(makeInstance({ isShuffling: true }), 'shuffling', { state: true })).toBe(true)
	expect(fb(makeInstance({ isShuffling: false }), 'shuffling', { state: true })).toBe(false)
})

// repeatMode
test('repeatMode feedback', () => {
	expect(fb(makeInstance({ repeatMode: 'track' }), 'repeatMode', { mode: 'track' })).toBe(true)
	expect(fb(makeInstance({ repeatMode: 'off' }), 'repeatMode', { mode: 'track' })).toBe(false)
})

// thisTrackPlaying
test('thisTrackPlaying matches URI', () => {
	let inst = makeInstance({ playerState: 'Playing', trackId: 'spotify:track:abc123' })
	expect(fb(inst, 'thisTrackPlaying', { track: 'spotify:track:abc123' })).toBe(true)
	expect(fb(inst, 'thisTrackPlaying', { track: 'spotify:track:other' })).toBe(false)
})

test('thisTrackPlaying false when paused', () => {
	let inst = makeInstance({ playerState: 'Paused', trackId: 'spotify:track:abc123' })
	expect(fb(inst, 'thisTrackPlaying', { track: 'spotify:track:abc123' })).toBe(false)
})

test('thisTrackPlaying accepts open.spotify.com URL', () => {
	let inst = makeInstance({ playerState: 'Playing', trackId: 'spotify:track:abc123' })
	expect(fb(inst, 'thisTrackPlaying', { track: 'https://open.spotify.com/track/abc123?si=xyz' })).toBe(true)
})

// thisTrackSelected
test('thisTrackSelected true when paused on track', () => {
	let inst = makeInstance({ playerState: 'Paused', trackId: 'spotify:track:abc123' })
	expect(fb(inst, 'thisTrackSelected', { track: 'spotify:track:abc123' })).toBe(true)
})

// volumeMuted
test('volumeMuted true at 0', () => {
	expect(fb(makeInstance({ volume: 0 }), 'volumeMuted')).toBe(true)
	expect(fb(makeInstance({ volume: 50 }), 'volumeMuted')).toBe(false)
})

// nearEnd
test('nearEnd true when remaining under threshold', () => {
	let inst = makeInstance({ positionMs: 175000, durationMs: 180000 }) // 5s left
	expect(fb(inst, 'nearEnd', { seconds: 10 })).toBe(true)
	expect(fb(inst, 'nearEnd', { seconds: 3 })).toBe(false)
})

test('nearEnd false when track ended', () => {
	let inst = makeInstance({ positionMs: 180000, durationMs: 180000 })
	expect(fb(inst, 'nearEnd', { seconds: 10 })).toBe(false)
})

// trackLiked
test('trackLiked feedback', () => {
	expect(fb(makeInstance({ isLiked: true }), 'trackLiked')).toBe(true)
	expect(fb(makeInstance({ isLiked: false }), 'trackLiked')).toBe(false)
})

// positionPast
test('positionPast M:SS format', () => {
	let inst = makeInstance({ positionMs: 35000 })
	expect(fb(inst, 'positionPast', { time: '0:30' })).toBe(true)
	expect(fb(inst, 'positionPast', { time: '1:00' })).toBe(false)
})

// hasActiveDevice
test('hasActiveDevice true when deviceId set', () => {
	expect(fb(makeInstance({ deviceId: 'abc' }), 'hasActiveDevice')).toBe(true)
	expect(fb(makeInstance({ deviceId: '' }), 'hasActiveDevice')).toBe(false)
})

// trackNameMatch
test('trackNameMatch case insensitive partial', () => {
	let inst = makeInstance({ trackName: 'Bohemian Rhapsody' })
	expect(fb(inst, 'trackNameMatch', { name: 'bohemian' })).toBe(true)
	expect(fb(inst, 'trackNameMatch', { name: 'Yesterday' })).toBe(false)
	expect(fb(inst, 'trackNameMatch', { name: '' })).toBe(false)
})
