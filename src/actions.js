const { updateVariables } = require('./variables')

function clampMs(ms) {
	if (!Number.isFinite(ms) || ms < 0) return 0
	return ms
}

function parsePositionToMs(str) {
	let parts = (str || '').trim().split(':')
	if (parts.length === 3) {
		let minutes = parseInt(parts[0], 10) || 0
		let seconds = parseInt(parts[1], 10) || 0
		let ms = parseInt(parts[2], 10) || 0
		return clampMs(minutes * 60000 + seconds * 1000 + ms)
	}
	if (parts.length === 2) {
		let minutes = parseInt(parts[0], 10) || 0
		let seconds = parseFloat(parts[1]) || 0
		return clampMs(Math.round((minutes * 60 + seconds) * 1000))
	}
	return clampMs(Math.round((parseFloat(str) || 0) * 1000))
}

function normaliseTrackUri(input) {
	let s = (input || '').trim()
	if (!s) return ''
	if (s.startsWith('spotify:track:')) return s
	let m = s.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/)
	if (m) return `spotify:track:${m[1]}`
	if (/^[a-zA-Z0-9]{20,}$/.test(s)) return `spotify:track:${s}`
	return s
}

function normaliseContextUri(input) {
	let s = (input || '').trim()
	if (!s) return ''
	if (/^spotify:(playlist|album|artist|show):/.test(s)) return s
	let m = s.match(/open\.spotify\.com\/(playlist|album|artist|show)\/([a-zA-Z0-9]+)/)
	if (m) return `spotify:${m[1]}:${m[2]}`
	return s
}


async function simpleAction(self, label, asFn, apiFn) {
	if (self._useAppleScript) {
		try { await asFn() } catch (e) { self.log('error', `${label} failed: ${e.message}`) }
		return
	}
	try { await apiFn() } catch (e) { self.log('error', `${label} failed: ${e.message}`) }
}

function getActions() {
	let self = this

	return {

		play: {
			name: 'Play',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.play() } catch (e) { self.log('error', `Play failed: ${e.message}`) }
					return
				}
				try {
					try {
						await self.spotify.play()
					} catch (e) {
						if (/no active device|device.*not.*found/i.test(e.message)) {
							let pick = await self.ensureActiveDevice()
							if (!pick) throw new Error('No Spotify devices available')
							self.log('info', `Retrying on device: ${pick.name}`)
							await self.spotify.play(pick.id)
						} else {
							throw e
						}
					}
				} catch (e) {
					self.log('error', `Play failed: ${e.message}`)
				}
			},
		},

		pause: {
			name: 'Pause',
			options: [],
			callback: () => simpleAction(self, 'Pause', () => self._as.pause(), () => self.spotify.pause()),
		},

		playToggle: {
			name: 'Play/Pause Toggle',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try {
						let s = await self._as.pollState()
						if (s.playerState === 'Playing') {
							await self._as.pause()
						} else {
							await self._as.play()
						}
					} catch (e) { self.log('error', `Play/pause failed: ${e.message}`) }
					return
				}
				const isPlaying = self.state.playerState === 'Playing'
				try {
					if (isPlaying) {
						await self.spotify.pause()
					} else {
						try {
							await self.spotify.play()
						} catch (e) {
							if (/no active device|device.*not.*found/i.test(e.message)) {
								let pick = await self.ensureActiveDevice()
								if (!pick) throw new Error('No Spotify devices available')
								await self.spotify.play(pick.id)
							} else {
								throw e
							}
						}
					}
				} catch (e) {
					self.log('error', `Play/pause failed: ${e.message}`)
				}
			},
		},

		next: {
			name: 'Next Track',
			options: [],
			callback: () => simpleAction(self, 'Next track', () => self._as.next(), () => self.spotify.next()),
		},

		previous: {
			name: 'Previous Track',
			options: [],
			callback: () => simpleAction(self, 'Previous track', () => self._as.previous(), () => self.spotify.previous()),
		},

		playTrack: {
			name: 'Play Track By ID',
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID, URI, or Share URL',
					default: 'spotify:track:',
					useVariables: true,
					tooltip: 'Accepts spotify:track:ID, https://open.spotify.com/track/..., or just the bare ID',
				},
				{
					type: 'textinput',
					id: 'position',
					label: 'Start Position (M:SS, optional)',
					default: '',
					tooltip: 'Leave blank to start from beginning. Use M:SS (e.g. 1:23), M:SS:ms (e.g. 1:23:456), or decimal seconds.',
				},
			],
			callback: async (action) => {
				if (self._useAppleScript) {
					self.log('warn', 'Play Track By ID requires internet - unavailable in offline fallback mode')
					return
				}
				let raw = await self.parseVariablesInString(action.options.track)
				let track = normaliseTrackUri(raw)
				if (!track || track === 'spotify:track:') {
					self.log('error', 'Play Track: no track set - edit the button and paste a track URI')
					return
				}
				let positionRaw = (action.options.position || '').trim()
				let positionMs = positionRaw !== '' ? parsePositionToMs(positionRaw) : undefined
				try {
					await self.spotify.playTrack(track, positionMs)
				} catch (e) {
					if (/no active device|device.*not.*found/i.test(e.message)) {
						try {
							let pick = await self.ensureActiveDevice()
							if (!pick) { self.log('error', 'No Spotify devices available - could not launch Spotify'); return }
							self.log('info', `Retrying on device: ${pick.name}`)
							await self.spotify.playTrack(track, positionMs, pick.id)
						} catch (e2) { self.log('error', `Play failed after device handoff: ${e2.message}`) }
					} else {
						self.log('error', `Play failed: ${e.message}`)
					}
				}
				setTimeout(() => self.poll(), 500)
			},
		},

		playPlaylist: {
			name: 'Play Playlist / Album / Context',
			options: [
				{
					type: 'textinput',
					id: 'context',
					label: 'Playlist / Album / Artist URI or URL',
					default: 'spotify:playlist:',
					useVariables: true,
					tooltip: 'Accepts spotify:playlist:ID, spotify:album:ID, spotify:artist:ID, or open.spotify.com URLs',
				},
				{
					type: 'number',
					id: 'offset',
					label: 'Start at Track # (1 = first)',
					default: 1,
					min: 1,
					max: 999,
					step: 1,
					required: true,
				},
				{
					type: 'textinput',
					id: 'position',
					label: 'Start Position (M:SS, optional)',
					default: '',
					tooltip: 'Leave blank to start from beginning. Use M:SS (e.g. 1:23), M:SS:ms (e.g. 1:47:500), or decimal seconds.',
				},
				{
					type: 'checkbox',
					id: 'shuffle',
					label: 'Enable Shuffle',
					default: false,
				},
			],
			callback: async (action) => {
				if (self._useAppleScript) {
					self.log('warn', 'Play Playlist requires internet - unavailable in offline fallback mode')
					return
				}
				let raw = await self.parseVariablesInString(action.options.context)
				let context = normaliseContextUri(raw)
				if (!context || context === 'spotify:playlist:' || context === 'spotify:album:' || context === 'spotify:artist:') {
					self.log('error', 'Play Playlist: no context URI set - edit the button and paste your playlist/album URI')
					return
				}
				if (/^spotify:artist:/.test(context)) {
					self.log('error', 'Play Playlist: artist URIs are not supported by the Spotify API - use a playlist or album URI instead')
					return
				}
				let wantShuffle = !!action.options.shuffle
				let offsetIndex = wantShuffle ? undefined : Math.max(0, (parseInt(action.options.offset, 10) || 1) - 1)
				let positionRaw = (action.options.position || '').trim()
				let positionMs = positionRaw !== '' ? parsePositionToMs(positionRaw) : undefined

				self.log('info', `Play context: ${context} shuffle=${wantShuffle} offset=${offsetIndex}`)

				let attemptPlay = async (deviceId) => {
					await self.spotify.playContext(context, offsetIndex, positionMs, deviceId)
					try { await self.spotify.setShuffle(wantShuffle, deviceId) } catch (e) {}
					let currentRepeat = self.state.repeatMode || 'off'
					try { await self.spotify.setRepeat(currentRepeat) } catch (e) {}
				}

				try {
					await attemptPlay()
				} catch (e) {
					if (/no active device|device.*not.*found/i.test(e.message)) {
						try {
							let pick = await self.ensureActiveDevice()
							if (!pick) { self.log('error', 'No Spotify devices available - could not launch Spotify'); return }
							self.log('info', `Retrying on device: ${pick.name}`)
							await attemptPlay(pick.id)
						} catch (e2) { self.log('error', `Playlist play failed after device handoff: ${e2.message}`) }
					} else {
						self.log('error', `Playlist play failed: ${e.message}`)
					}
				}
				setTimeout(() => self.poll(), 500)
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
				let positionMs = parsePositionToMs(action.options.position)
				let max = self.state.durationMs || positionMs
				positionMs = Math.max(0, Math.min(positionMs, max))
				if (self._useAppleScript) {
					try { await self._as.seekTo(positionMs) } catch (e) { self.log('error', `Seek failed: ${e.message}`) }
					return
				}
				try { await self.spotify.seekTo(positionMs) } catch (e) { self.log('error', `Seek failed: ${e.message}`) }
			},
		},

		skipForward: {
			name: 'Skip Forward',
			options: [
				{
					type: 'number',
					id: 'seconds',
					label: 'Seconds',
					default: 10,
					min: 1,
					max: 300,
					step: 1,
					required: true,
					range: false,
				},
			],
			callback: async (action) => {
				let positionMs = self.state.positionMs + action.options.seconds * 1000
				let max = self.state.durationMs || positionMs
				positionMs = Math.min(positionMs, max)
				if (self._useAppleScript) {
					try { await self._as.seekTo(positionMs) } catch (e) { self.log('error', `Skip forward failed: ${e.message}`) }
					return
				}
				try { await self.spotify.seekTo(positionMs) } catch (e) { self.log('error', `Skip forward failed: ${e.message}`) }
			},
		},

		skipBack: {
			name: 'Skip Back',
			options: [
				{
					type: 'number',
					id: 'seconds',
					label: 'Seconds',
					default: 10,
					min: 1,
					max: 300,
					step: 1,
					required: true,
					range: false,
				},
			],
			callback: async (action) => {
				let positionMs = Math.max(0, self.state.positionMs - action.options.seconds * 1000)
				if (self._useAppleScript) {
					try { await self._as.seekTo(positionMs) } catch (e) { self.log('error', `Skip back failed: ${e.message}`) }
					return
				}
				try { await self.spotify.seekTo(positionMs) } catch (e) { self.log('error', `Skip back failed: ${e.message}`) }
			},
		},

		movePosition: {
			name: 'Move Playback Position',
			options: [
				{
					type: 'number',
					id: 'seconds',
					label: 'Seconds (negative = rewind)',
					default: 10,
					min: -300,
					max: 300,
					step: 1,
					required: true,
					range: false,
				},
			],
			callback: async (action) => {
				let positionMs = Math.max(0, self.state.positionMs + action.options.seconds * 1000)
				if (self._useAppleScript) {
					try { await self._as.seekTo(positionMs) } catch (e) { self.log('error', `Move position failed: ${e.message}`) }
					return
				}
				try { await self.spotify.seekTo(positionMs) } catch (e) { self.log('error', `Move position failed: ${e.message}`) }
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
				if (self._useAppleScript) {
					try { await self._as.setVolume(action.options.volume) } catch (e) { self.log('warn', `Set volume (AppleScript) failed: ${e.message}`) }
					self.state.volume = action.options.volume
					self._volumeSetAt = Date.now()
					updateVariables.call(self)
					return
				}
				try { await self.spotify.setVolume(action.options.volume) } catch (e) { self.log('error', `Set volume failed: ${e.message}`) }
				self.state.volume = action.options.volume
				self._volumeSetAt = Date.now()
				updateVariables.call(self)
			},
		},

		mute: {
			name: 'Mute',
			options: [],
			callback: async () => {
				self._premuteVolume = self.state.volume || 50
				if (self._useAppleScript) {
					try { await self._as.setVolume(0) } catch (e) { self.log('warn', `Mute (AppleScript) failed: ${e.message}`) }
				} else {
					try { await self.spotify.setVolume(0) } catch (e) { self.log('error', `Mute failed: ${e.message}`) }
				}
				self.state.volume = 0
				updateVariables.call(self)
			},
		},

		unmute: {
			name: 'Unmute',
			options: [],
			callback: async () => {
				let restore = (self._premuteVolume > 0) ? self._premuteVolume : 50
				if (self._useAppleScript) {
					try { await self._as.setVolume(restore) } catch (e) { self.log('warn', `Unmute (AppleScript) failed: ${e.message}`) }
				} else {
					try { await self.spotify.setVolume(restore) } catch (e) { self.log('error', `Unmute failed: ${e.message}`) }
				}
				self.state.volume = restore
				updateVariables.call(self)
			},
		},

		muteToggle: {
			name: 'Mute / Unmute Toggle',
			options: [],
			callback: async () => {
				if (self.state.volume === 0) {
					let restore = (self._premuteVolume > 0) ? self._premuteVolume : 50
					if (self._useAppleScript) {
						try { await self._as.setVolume(restore) } catch (e) { self.log('warn', `Unmute (AppleScript) failed: ${e.message}`) }
					} else {
						try { await self.spotify.setVolume(restore) } catch (e) { self.log('error', `Unmute failed: ${e.message}`) }
					}
					self.state.volume = restore
				} else {
					self._premuteVolume = self.state.volume
					if (self._useAppleScript) {
						try { await self._as.setVolume(0) } catch (e) { self.log('warn', `Mute (AppleScript) failed: ${e.message}`) }
					} else {
						try { await self.spotify.setVolume(0) } catch (e) { self.log('error', `Mute failed: ${e.message}`) }
					}
					self.state.volume = 0
				}
			},
		},

		volumeUp: {
			name: 'Volume Up',
			options: [
				{
					type: 'number',
					id: 'amount',
					label: 'Amount',
					default: 10,
					min: 1,
					max: 50,
					step: 1,
					required: true,
					range: false,
				},
			],
			callback: async (action) => {
				let v = Math.min(100, (self.state.volume || 0) + action.options.amount)
				self.state.volume = v
				self._volumeSetAt = Date.now()
				if (self._useAppleScript) {
					try { await self._as.setVolume(v) } catch (e) { self.log('warn', `Volume up (AppleScript) failed: ${e.message}`) }
				} else {
					try { await self.spotify.setVolume(v) } catch (e) { self.log('error', `Volume up failed: ${e.message}`) }
				}
			},
		},

		volumeDown: {
			name: 'Volume Down',
			options: [
				{
					type: 'number',
					id: 'amount',
					label: 'Amount',
					default: 10,
					min: 1,
					max: 50,
					step: 1,
					required: true,
					range: false,
				},
			],
			callback: async (action) => {
				let v = Math.max(0, (self.state.volume || 0) - action.options.amount)
				self.state.volume = v
				self._volumeSetAt = Date.now()
				if (self._useAppleScript) {
					try { await self._as.setVolume(v) } catch (e) { self.log('warn', `Volume down (AppleScript) failed: ${e.message}`) }
				} else {
					try { await self.spotify.setVolume(v) } catch (e) { self.log('error', `Volume down failed: ${e.message}`) }
				}
			},
		},

		shuffleOn: {
			name: 'Shuffle On',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setShuffle(true) } catch (e) { self.log('error', `Shuffle on failed: ${e.message}`) }
					return
				}
				try {
					await self.spotify.setShuffle(true)
					if (self._smartShuffleWarned) await self.spotify.setShuffle(true)
				} catch (e) {
					self.log('error', `Shuffle on failed: ${e.message}`)
				}
			},
		},

		shuffleOff: {
			name: 'Shuffle Off',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setShuffle(false) } catch (e) { self.log('error', `Shuffle off failed: ${e.message}`) }
					return
				}
				try {
					await self.spotify.setShuffle(false)
					if (self._smartShuffleWarned) await self.spotify.setShuffle(false)
				} catch (e) {
					self.log('error', `Shuffle off failed: ${e.message}`)
				}
			},
		},

		shuffleToggle: {
			name: 'Shuffle Toggle',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setShuffle(!self.state.isShuffling) } catch (e) { self.log('error', `Shuffle toggle failed: ${e.message}`) }
					return
				}
				const next = !self.state.isShuffling
				try {
					await self.spotify.setShuffle(next)
					if (self._smartShuffleWarned) await self.spotify.setShuffle(next)
				} catch (e) {
					self.log('error', `Shuffle toggle failed: ${e.message}`)
				}
			},
		},

		repeatOff: {
			name: 'Repeat Off',
			options: [],
			callback: () => simpleAction(self, 'Repeat off', () => self._as.setRepeat('off'), () => self.spotify.setRepeat('off')),
		},

		repeatTrack: {
			name: 'Repeat Track',
			options: [],
			callback: () => simpleAction(self, 'Repeat track', () => self._as.setRepeat('track'), () => self.spotify.setRepeat('track')),
		},

		repeatContext: {
			name: 'Repeat Playlist/Album',
			options: [],
			callback: () => simpleAction(self, 'Repeat context', () => self._as.setRepeat('context'), () => self.spotify.setRepeat('context')),
		},

		repeatToggleAll: {
			name: 'Repeat Toggle (Off > Track > Playlist > Off)',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setRepeat(self.state.repeatMode === 'off' ? 'context' : 'off') } catch (e) { self.log('error', `Repeat toggle failed: ${e.message}`) }
					return
				}
				let next = 'off'
				if (self.state.repeatMode === 'off') next = 'track'
				else if (self.state.repeatMode === 'track') next = 'context'
				try {
					await self.spotify.setRepeat(next)
				} catch (e) {
					self.log('error', `Repeat toggle failed: ${e.message}`)
				}
			},
		},

		repeatToggleOffAll: {
			name: 'Repeat Toggle (Off / Playlist)',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setRepeat(self.state.repeatMode === 'off' ? 'context' : 'off') } catch (e) { self.log('error', `Repeat toggle failed: ${e.message}`) }
					return
				}
				const next = self.state.repeatMode === 'off' ? 'context' : 'off'
				try {
					await self.spotify.setRepeat(next)
				} catch (e) {
					self.log('error', `Repeat toggle failed: ${e.message}`)
				}
			},
		},

		repeatToggleOffTrack: {
			name: 'Repeat Toggle (Off / Track)',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					try { await self._as.setRepeat(self.state.repeatMode === 'off' ? 'context' : 'off') } catch (e) { self.log('error', `Repeat toggle failed: ${e.message}`) }
					return
				}
				const next = self.state.repeatMode === 'off' ? 'track' : 'off'
				try {
					await self.spotify.setRepeat(next)
				} catch (e) {
					self.log('error', `Repeat toggle failed: ${e.message}`)
				}
			},
		},

		volumeFade: {
			name: 'Volume Fade',
			options: [
				{
					type: 'number',
					id: 'target',
					label: 'Target Volume (0-100)',
					default: 0,
					min: 0,
					max: 100,
					step: 1,
					required: true,
					range: true,
				},
				{
					type: 'number',
					id: 'duration',
					label: 'Duration (seconds)',
					default: 3,
					min: 0.5,
					max: 30,
					step: 0.5,
					required: true,
				},
			],
			callback: async (action) => {
				let target = action.options.target
				let duration = action.options.duration * 1000
				let start = self.state.volume || 0
				let steps = Math.max(1, Math.round(duration / 250))
				let stepMs = duration / steps
				let stepVol = (target - start) / steps
				if (self._fadeTimer) clearInterval(self._fadeTimer)
				let current = 0
				let busy = false
				let timer = setInterval(async () => {
					if (self._fadeTimer !== timer) {
						clearInterval(timer)
						return
					}
					if (busy) return
					busy = true
					current++
					let vol = Math.round(Math.min(100, Math.max(0, start + stepVol * current)))
					try {
						if (self._useAppleScript) {
							await self._as.setVolume(vol)
						} else {
							await self.spotify.setVolume(vol)
						}
						if (self._fadeTimer === timer) {
							self.state.volume = vol
							self._volumeSetAt = Date.now()
						}
					} catch (e) {}
					busy = false
					if (current >= steps) {
						clearInterval(timer)
						if (self._fadeTimer !== timer) return
						self._fadeTimer = null
						let settleAt = Date.now()
						try {
							if (self._useAppleScript) {
								await self._as.setVolume(target)
							} else {
								await self.spotify.setVolume(target)
							}
							if (self._fadeTimer === null && (self._volumeSetAt || 0) <= settleAt) {
								self.state.volume = target
								self._volumeSetAt = Date.now()
								updateVariables.call(self)
							}
						} catch (e) {}
					}
				}, stepMs)
				self._fadeTimer = timer
			},
		},

		playFadeIn: {
			name: 'Play with Fade In',
			options: [
				{
					type: 'number',
					id: 'duration',
					label: 'Fade Duration (seconds)',
					default: 5,
					min: 0.5,
					max: 30,
					step: 0.5,
					required: true,
				},
				{
					type: 'number',
					id: 'target',
					label: 'Target Volume (0-100)',
					default: 100,
					min: 1,
					max: 100,
					step: 1,
					required: true,
					range: true,
				},
			],
			callback: async (action) => {
				let target = action.options.target
				let duration = action.options.duration * 1000
				if (self._fadeTimer) {
					clearInterval(self._fadeTimer)
					self._fadeTimer = null
				}
				let preZeroFailed = false
				if (self._useAppleScript) {
					try { await self._as.setVolume(0) } catch (e) {
						preZeroFailed = true
						self.log('warn', `Play+Fade: could not zero volume first: ${e.message}`)
					}
					self.state.volume = 0
					updateVariables.call(self)
					try { await self._as.play() } catch (e) {
						self.log('error', `Play+Fade play failed: ${e.message}`)
						return
					}
					if (preZeroFailed) {
						try { await self._as.setVolume(0) } catch (e) { self.log('warn', 'Play+Fade: playback may have started at full volume') }
					}
				} else {
					try { await self.spotify.setVolume(0) } catch (e) {
						preZeroFailed = true
						self.log('warn', `Play+Fade: could not zero volume first: ${e.message}`)
					}
					self.state.volume = 0
					updateVariables.call(self)
					try {
						await self.spotify.play()
					} catch (e) {
						if (/no active device|device.*not.*found/i.test(e.message)) {
							try {
								let pick = await self.ensureActiveDevice()
								if (!pick) { self.log('error', 'Play+Fade: no devices'); return }
								await self.spotify.play(pick.id)
							} catch (e2) { self.log('error', `Play+Fade play failed: ${e2.message}`); return }
						} else {
							self.log('error', `Play+Fade play failed: ${e.message}`); return
						}
					}
					if (preZeroFailed) {
						try { await self.spotify.setVolume(0) } catch (e) { self.log('warn', 'Play+Fade: playback may have started at full volume') }
					}
				}
				if (self._destroyed) return
				self.state.playerState = 'Playing'
				self.checkFeedbacks()
				let steps = Math.max(1, Math.round(duration / 250))
				let stepMs = duration / steps
				let stepVol = target / steps
				if (self._fadeTimer) {
					clearInterval(self._fadeTimer)
					self._fadeTimer = null
				}
				let current = 0
				let busy = false
				let timer = setInterval(async () => {
					if (self._fadeTimer !== timer) {
						clearInterval(timer)
						return
					}
					if (busy) return
					busy = true
					current++
					let vol = Math.round(Math.min(target, Math.max(0, stepVol * current)))
					try {
						if (self._useAppleScript) {
							await self._as.setVolume(vol)
						} else {
							await self.spotify.setVolume(vol)
						}
						if (self._fadeTimer === timer) {
							self.state.volume = vol
							self._volumeSetAt = Date.now()
							updateVariables.call(self)
						}
					} catch (e) {}
					busy = false
					if (current >= steps) {
						clearInterval(timer)
						if (self._fadeTimer !== timer) return
						self._fadeTimer = null
						let settleAt = Date.now()
						try {
							if (self._useAppleScript) {
								await self._as.setVolume(target)
							} else {
								await self.spotify.setVolume(target)
							}
							if (self._fadeTimer === null && (self._volumeSetAt || 0) <= settleAt) {
								self.state.volume = target
								self._volumeSetAt = Date.now()
								updateVariables.call(self)
							}
						} catch (e) {}
					}
				}, stepMs)
				self._fadeTimer = timer
			},
		},

		addToQueue: {
			name: 'Add Track to Queue',
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID, URI, or Share URL',
					default: 'spotify:track:',
					useVariables: true,
					tooltip: 'Accepts spotify:track:ID, open.spotify.com URL, or bare ID',
				},
			],
			callback: async (action) => {
				if (self._useAppleScript) {
					self.log('warn', 'Add to Queue requires internet - unavailable in offline fallback mode')
					return
				}
				let raw = await self.parseVariablesInString(action.options.track)
				let track = normaliseTrackUri(raw)
				if (!track || track === 'spotify:track:') {
					self.log('error', 'Add to Queue: no track set - edit the button and paste a track URI')
					return
				}
				try {
					await self.spotify.addToQueue(track)
					self.log('info', `Queued: ${track}`)
				} catch (e) {
					self.log('error', `Add to queue failed: ${e.message}`)
				}
			},
		},

		saveTrack: {
			name: 'Save / Like Current Track',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					self.log('warn', 'Save Track requires internet - unavailable in offline fallback mode')
					return
				}
				let uri = self.state.trackId || ''
				if (!uri.startsWith('spotify:track:')) {
					if (uri) self.log('warn', 'Save Track only works for music tracks')
					return
				}
				let id = uri.replace('spotify:track:', '')
				if (!id) return
				try {
					await self.spotify.saveTrack(id)
					self.state.isLiked = true
					self.checkFeedbacks('trackLiked')
				} catch (e) {
					self.log('error', `Save track failed: ${e.message}`)
				}
			},
		},

		removeTrack: {
			name: 'Remove / Unlike Current Track',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					self.log('warn', 'Remove Track requires internet - unavailable in offline fallback mode')
					return
				}
				let uri = self.state.trackId || ''
				if (!uri.startsWith('spotify:track:')) {
					if (uri) self.log('warn', 'Remove Track only works for music tracks')
					return
				}
				let id = uri.replace('spotify:track:', '')
				if (!id) return
				try {
					await self.spotify.removeTrack(id)
					self.state.isLiked = false
					self.checkFeedbacks('trackLiked')
				} catch (e) {
					self.log('error', `Remove track failed: ${e.message}`)
				}
			},
		},

		likeToggle: {
			name: 'Toggle Like / Unlike Current Track',
			options: [],
			callback: async () => {
				if (self._useAppleScript) {
					self.log('warn', 'Like/Unlike requires internet - unavailable in offline fallback mode')
					return
				}
				let uri = self.state.trackId || ''
				if (!uri.startsWith('spotify:track:')) {
					if (uri) self.log('warn', 'Like/Unlike only works for music tracks')
					return
				}
				let id = uri.replace('spotify:track:', '')
				if (!id) return
				try {
					if (self.state.isLiked) {
						await self.spotify.removeTrack(id)
					} else {
						await self.spotify.saveTrack(id)
					}
				} catch (e) {
					self.log('error', `Like toggle failed: ${e.message}`)
				}
			},
		},

		bookmarkSave: {
			name: 'Save Playback Position (Bookmark)',
			options: [
				{
					type: 'textinput',
					id: 'slot',
					label: 'Bookmark Name (slot)',
					default: 'main',
					tooltip: 'Use any name. Saving the same name overwrites the previous bookmark.',
				},
			],
			callback: async (action) => {
				let slot = (action.options.slot || 'main').trim() || 'main'
				if (slot === '__proto__' || slot === 'constructor' || slot === 'prototype') {
					self.log('error', `Bookmark name "${slot}" is not allowed - pick another name`)
					return
				}
				if (!self.state.trackId) {
					self.log('warn', `Bookmark save ignored - no track playing`)
					return
				}
				if (!self.config.bookmarks) self.config.bookmarks = {}
				self.config.bookmarks[slot] = {
					contextUri: self.state.contextUri || '',
					trackUri: self.state.trackId,
					positionMs: self.state.positionMs || 0,
					trackName: self.state.trackName || '',
					savedAt: new Date().toISOString(),
				}
				self.saveConfig(self.config)
				self.checkFeedbacks('bookmarkExists')
				self.log('info', `Saved bookmark "${slot}": ${self.state.trackName} @ ${Math.floor((self.state.positionMs || 0) / 1000)}s`)
			},
		},

		bookmarkResume: {
			name: 'Resume Saved Position (Bookmark)',
			options: [
				{
					type: 'textinput',
					id: 'slot',
					label: 'Bookmark Name (slot)',
					default: 'main',
					tooltip: 'Resumes the saved track at the saved position. If the track was in a playlist or album, playback continues in that context so next/prev work correctly. Note: Spotify briefly plays from the start before seeking to the saved position - this is a Spotify API limitation. The Spotify app UI may not visually update to show the playlist.',
				},
			],
			callback: async (action) => {
				if (self._useAppleScript) {
					self.log('warn', 'Bookmark Resume requires internet - unavailable in offline fallback mode')
					return
				}
				let slot = (action.options.slot || 'main').trim() || 'main'
				let bm = self.config.bookmarks && self.config.bookmarks[slot]
				if (!bm || !bm.trackUri) {
					self.log('warn', `Bookmark resume: no bookmark saved for "${slot}"`)
					return
				}

				self.log('info', `Bookmark resume "${slot}": ${bm.trackName || bm.trackUri} @ ${Math.round((bm.positionMs || 0) / 1000)}s context=${bm.contextUri || 'none'}`)

				let contextSupported = bm.contextUri && /^spotify:(playlist|album):/.test(bm.contextUri)

				let attempt = async (deviceId) => {
					if (contextSupported) {
						self.log('info', `Bookmark: playing context ${bm.contextUri} at track ${bm.trackUri} @ ${bm.positionMs}ms`)
						await self.spotify.playContextAtTrackUri(bm.contextUri, bm.trackUri, 0, deviceId)
						try { await self.spotify.setShuffle(self.state.isShuffling, deviceId) } catch (e) {}
						try { await self.spotify.setRepeat(self.state.repeatMode || 'off') } catch (e) {}
						if (bm.positionMs > 0) {
							await new Promise((r) => setTimeout(r, 1000))
							await self.spotify.seekTo(bm.positionMs)
						}
					} else {
						self.log('info', `Bookmark: playing track directly at ${bm.positionMs}ms`)
						await self.spotify.playTrack(bm.trackUri, bm.positionMs, deviceId)
					}
				}

				try {
					await attempt()
				} catch (e) {
					if (/no active device|device.*not.*found/i.test(e.message)) {
						try {
							let pick = await self.ensureActiveDevice()
							if (!pick) { self.log('error', 'No Spotify devices available - could not launch Spotify'); return }
							self.log('info', `Retrying bookmark resume on device: ${pick.name}`)
							await attempt(pick.id)
						} catch (e2) { self.log('error', `Bookmark resume failed: ${e2.message}`) }
					} else {
						self.log('error', `Bookmark resume failed: ${e.message}`)
					}
				}
				setTimeout(() => self.poll(), 500)
			},
		},

		bookmarkToggle: {
			name: 'Save/Resume Position Toggle (Bookmark)',
			description: 'If no bookmark saved, saves current position. If bookmark exists, resumes it. Press again after resuming to save a new position (clears existing).',
			options: [
				{
					type: 'textinput',
					id: 'slot',
					label: 'Bookmark Name (slot)',
					default: 'main',
				},
			],
			callback: async (action) => {
				let slot = (action.options.slot || 'main').trim() || 'main'
				if (slot === '__proto__' || slot === 'constructor' || slot === 'prototype') {
					self.log('error', `Bookmark name "${slot}" is not allowed - pick another name`)
					return
				}
				if (!self.config.bookmarks) self.config.bookmarks = {}
				let bm = self.config.bookmarks[slot]

				if (!bm || !bm.trackUri) {
					if (!self.state.trackId) {
						self.log('warn', `Bookmark save ignored - no track playing`)
						return
					}
					self.config.bookmarks[slot] = {
						trackUri: self.state.trackId || '',
						contextUri: self.state.contextUri || '',
						positionMs: self.state.positionMs || 0,
						trackName: self.state.trackName || '',
					}
					self.saveConfig(self.config)
					self.checkFeedbacks('bookmarkExists')
					self.log('info', `SAVED "${slot}": ${self.state.trackName} @ ${Math.floor((self.state.positionMs || 0) / 1000)}s`)
				} else {
					if (self._useAppleScript) {
						self.log('warn', 'Bookmark Resume requires internet - unavailable in offline fallback mode')
						return
					}
					let contextSupportsOffset = bm.contextUri && /^spotify:(playlist|album):/.test(bm.contextUri)
					try {
						if (contextSupportsOffset) {
							await self.spotify.playContextAtTrackUri(bm.contextUri, bm.trackUri, 0)
							try { await self.spotify.setShuffle(self.state.isShuffling) } catch (e) {}
							try { await self.spotify.setRepeat(self.state.repeatMode || 'off') } catch (e) {}
							if (bm.positionMs > 0) {
								await new Promise((r) => setTimeout(r, 1500))
								await self.spotify.seekTo(bm.positionMs)
							}
						} else {
							await self.spotify.playTrack(bm.trackUri, bm.positionMs)
						}
						delete self.config.bookmarks[slot]
						self.saveConfig(self.config)
						self.checkFeedbacks('bookmarkExists')
						self.log('info', `RESUMED "${slot}" - ready to save again`)
					} catch (e) {
						self.log('error', `Resume failed: ${e.message}`)
					}
					setTimeout(() => self.poll(), 500)
				}
			},
		},

		bookmarkClear: {
			name: 'Clear Saved Position (Bookmark)',
			options: [
				{
					type: 'textinput',
					id: 'slot',
					label: 'Bookmark Name (slot, blank = clear all)',
					default: '',
				},
			],
			callback: async (action) => {
				let slot = (action.options.slot || '').trim()
				if (!self.config.bookmarks) self.config.bookmarks = {}
				if (slot === '') {
					self.config.bookmarks = {}
					self.log('info', 'Cleared all bookmarks')
				} else {
					delete self.config.bookmarks[slot]
					self.log('info', `Cleared bookmark "${slot}"`)
				}
				self.saveConfig(self.config)
			},
		},
	}
}

module.exports = { getActions }
