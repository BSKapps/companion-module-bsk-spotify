const { getVariables, updateVariables } = require('../src/variables')

function makeInstance(stateOverrides = {}) {
	let vars = {}
	return {
		state: {
			playerState: 'Stopped',
			trackName: '',
			artistName: '',
			albumName: '',
			volume: 50,
			isShuffling: false,
			repeatMode: 'off',
			isRepeating: false,
			positionMs: 0,
			durationMs: 0,
			trackId: '',
			deviceName: '',
			deviceType: '',
			contextUri: '',
			contextType: '',
			nextTrackName: '',
			nextTrackArtist: '',
			isLiked: false,
			...stateOverrides,
		},
		_displayCycleIndex: 0,
		setVariableValues(v) { Object.assign(vars, v) },
		_vars: vars,
	}
}

test('getVariables returns array with required IDs', () => {
	let defs = getVariables()
	let ids = defs.map(d => d.variableId)
	expect(ids).toContain('track')
	expect(ids).toContain('artist')
	expect(ids).toContain('position_hms')
	expect(ids).toContain('remaining_hms')
	expect(ids).toContain('next_track')
	expect(ids).toContain('is_liked')
})

test('updateVariables sets state=Stopped when stopped', () => {
	let inst = makeInstance({ playerState: 'Stopped' })
	updateVariables.call(inst)
	expect(inst._vars.state).toBe('Stopped')
})

test('updateVariables formats position M:SS correctly', () => {
	let inst = makeInstance({ positionMs: 90500, durationMs: 240000 })
	updateVariables.call(inst)
	expect(inst._vars.position_hms).toBe('1:30')
})

test('updateVariables formats remaining correctly', () => {
	let inst = makeInstance({ positionMs: 60000, durationMs: 180000 })
	updateVariables.call(inst)
	expect(inst._vars.remaining_hms).toBe('2:00')
})

test('updateVariables remaining never goes negative', () => {
	let inst = makeInstance({ positionMs: 200000, durationMs: 180000 })
	updateVariables.call(inst)
	expect(inst._vars.remaining_ms).toBe('0')
})

test('updateVariables shuffle On/Off', () => {
	let inst = makeInstance({ isShuffling: true })
	updateVariables.call(inst)
	expect(inst._vars.shuffle).toBe('On')

	let inst2 = makeInstance({ isShuffling: false })
	updateVariables.call(inst2)
	expect(inst2._vars.shuffle).toBe('Off')
})

test('updateVariables is_liked true/false', () => {
	let inst = makeInstance({ isLiked: true })
	updateVariables.call(inst)
	expect(inst._vars.is_liked).toBe('true')

	let inst2 = makeInstance({ isLiked: false })
	updateVariables.call(inst2)
	expect(inst2._vars.is_liked).toBe('false')
})

test('position_mss format M:SS:ms', () => {
	let inst = makeInstance({ positionMs: 107456 })
	updateVariables.call(inst)
	expect(inst._vars.position_mss).toBe('1:47:456')
})
