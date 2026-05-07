const { spawn } = require('child_process')

function runScript(script) {
	return new Promise((resolve, reject) => {
		let proc = spawn('osascript', [])
		let out = ''
		let err = ''
		proc.stdout.on('data', d => { out += d })
		proc.stderr.on('data', d => { err += d })
		proc.on('error', reject)
		proc.on('close', code => {
			if (code !== 0) reject(new Error(err.trim() || `osascript exited ${code}`))
			else resolve(out.trim())
		})
		setTimeout(() => proc.kill(), 5000)
		proc.stdin.write(script)
		proc.stdin.end()
	})
}

class AppleScriptSpotify {
	async pollState() {
		// Returns 9 pipe-delimited fields:
		// playerState|positionSecs|volume|shuffling|repeating|trackName|artistName|albumName|durationSecs
		let script = [
			'if application "Spotify" is not running then',
			'\treturn "stopped|0|50|false|false||||0"',
			'end if',
			'tell application "Spotify"',
			'\tset ps to player state as string',
			'\tset sv to sound volume as integer',
			'\tset sh to shuffling as string',
			'\tset rp to repeating as string',
			'\tif ps is "stopped" then',
			'\t\treturn "stopped|0|" & sv & "|" & sh & "|" & rp & "||||0"',
			'\tend if',
			'\tset pp to player position as real',
			'\tset ct to current track',
			'\tset tn to name of ct',
			'\tset ta to artist of ct',
			'\tset tal to album of ct',
			'\tset td to duration of ct as real',
			'\treturn ps & "|" & pp & "|" & sv & "|" & sh & "|" & rp & "|" & tn & "|" & ta & "|" & tal & "|" & td',
			'end tell',
		].join('\n')

		let raw = await runScript(script)
		let p = raw.split('|')
		let ps = (p[0] || '').toLowerCase()
		return {
			playerState: ps === 'playing' ? 'Playing' : ps === 'paused' ? 'Paused' : 'Stopped',
			positionMs: Math.round((parseFloat(p[1]) || 0) * 1000),
			volume: parseInt(p[2], 10) || 0,
			isShuffling: p[3] === 'true',
			isRepeating: p[4] === 'true',
			trackName: p[5] || '',
			artistName: p[6] || '',
			albumName: p[7] || '',
			// duration is normally seconds, but some Spotify versions return ms — guard by threshold
			durationMs: (() => { let d = parseFloat(p[8]) || 0; return Math.round(d > 3600 ? d : d * 1000) })(),
		}
	}

	async play() {
		await runScript([
			'if application "Spotify" is not running then',
			'	tell application "Spotify" to activate',
			'	delay 2',
			'end if',
			'tell application "Spotify" to play',
		].join('\n'))
	}

	async pause() {
		await runScript('tell application "Spotify" to pause')
	}

	async playpause() {
		await runScript([
			'if application "Spotify" is not running then',
			'	tell application "Spotify" to activate',
			'	delay 2',
			'end if',
			'tell application "Spotify" to playpause',
		].join('\n'))
	}

	async next() {
		await runScript('tell application "Spotify" to next track')
	}

	async previous() {
		await runScript('tell application "Spotify" to previous track')
	}

	async seekTo(positionMs) {
		await runScript(`tell application "Spotify" to set player position to ${positionMs / 1000}`)
	}

	async setVolume(percent) {
		await runScript(`tell application "Spotify" to set sound volume to ${Math.round(percent)}`)
	}

	async setShuffle(state) {
		await runScript(`tell application "Spotify" to set shuffling to ${state ? 'true' : 'false'}`)
	}

	// AppleScript only has a boolean repeating property — 'track' and 'context' both map to true
	async setRepeat(state) {
		await runScript(`tell application "Spotify" to set repeating to ${state !== 'off' ? 'true' : 'false'}`)
	}
}

module.exports = AppleScriptSpotify
