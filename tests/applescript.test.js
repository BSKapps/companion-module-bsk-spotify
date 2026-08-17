const AppleScriptSpotify = require('../src/applescript')

describe('buildPlayUriScript', () => {
	let as = new AppleScriptSpotify()

	test('track only', () => {
		let s = as.buildPlayUriScript('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
		expect(s).toContain('play track "spotify:track:4uLU6hMCjMI75M1A2tKUQC"')
		expect(s).not.toContain('in context')
		expect(s).not.toContain('player position')
	})

	test('track in context', () => {
		let s = as.buildPlayUriScript('spotify:track:4uLU6hMCjMI75M1A2tKUQC', 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')
		expect(s).toContain('play track "spotify:track:4uLU6hMCjMI75M1A2tKUQC" in context "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"')
	})

	test('bare context uri as direct parameter', () => {
		let s = as.buildPlayUriScript('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')
		expect(s).toContain('play track "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"')
	})

	test('position seek appended after delay', () => {
		let s = as.buildPlayUriScript('spotify:track:4uLU6hMCjMI75M1A2tKUQC', null, 83456)
		expect(s).toContain('delay 0.5')
		expect(s).toContain('set player position to 83.456')
	})

	test('zero or missing position adds no seek', () => {
		expect(as.buildPlayUriScript('spotify:track:a1', null, 0)).not.toContain('player position')
		expect(as.buildPlayUriScript('spotify:track:a1', null, undefined)).not.toContain('player position')
		expect(as.buildPlayUriScript('spotify:track:a1', null, NaN)).not.toContain('player position')
	})

	test('rejects non-spotify uri', () => {
		expect(() => as.buildPlayUriScript('https://open.spotify.com/track/abc')).toThrow()
		expect(() => as.buildPlayUriScript('')).toThrow()
	})

	test('rejects script injection in uri', () => {
		expect(() => as.buildPlayUriScript('spotify:track:a" & (do shell script "id") & "')).toThrow()
		expect(() => as.buildPlayUriScript('spotify:track:abc', 'spotify:playlist:x"\ny')).toThrow()
	})
})
