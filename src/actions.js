const { updateVariables } = require('./variables')

function parsePositionToMs(str) {
	let parts = (str || '').trim().split(':')
	if (parts.length === 3) {
		// M:SS:ms  e.g. 1:23:456 = 1 min 23 sec 456ms
		let minutes = parseInt(parts[0], 10) || 0
		let seconds = parseInt(parts[1], 10) || 0
		let ms = parseInt(parts[2], 10) || 0
		return minutes * 60000 + seconds * 1000 + ms
	}
	if (parts.length === 2) {
		// M:SS  e.g. 1:23 or 1:23.5
		let minutes = parseInt(parts[0], 10) || 0
		let seconds = parseFloat(parts[1]) || 0
		return Math.round((minutes * 60 + seconds) * 1000)
	}
	return Math.round((parseFloat(str) || 0) * 1000)
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


function getActions() {
	let self = this

	return {

		play: {
			name: 'Play',
			options: [],
			callback: async () => {
				try {
					await self.spotify.play()
				} catch (e) {
					if (/no active device|device.*not.*found/i.test(e.message)) {
						try {
							let pick = await self.ensureActiveDevice()
							if (!pick) { self.log('error', 'No Spotify devices available — could not launch Spotify'); return }
							self.log('info', `Retrying on device: ${pick.name}`)
							await self.spotify.play(pick.id)
						} catch (e2) { self.log('error', `Play failed: ${e2.message}`); return }
					} else {
						self.log('error', `Play failed: ${e.message}`)
						return
					}
				}
				self.state.playerState = 'Playing'
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		pause: {
			name: 'Pause',
			options: [],
			callback: async () => {
				await self.spotify.pause()
				self.state.playerState = 'Paused'
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		playToggle: {
			name: 'Play/Pause Toggle',
			options: [],
			callback: async () => {
				if (self.state.playerState === 'Playing') {
					await self.spotify.pause()
					self.state.playerState = 'Paused'
				} else {
					try {
						await self.spotify.play()
					} catch (e) {
						if (/no active device|device.*not.*found/i.test(e.message)) {
							try {
								let pick = await self.ensureActiveDevice()
								if (!pick) { self.log('error', 'No Spotify devices available — could not launch Spotify'); return }
								await self.spotify.play(pick.id)
							} catch (e2) { self.log('error', `Play failed: ${e2.message}`); return }
						} else {
							self.log('error', `Play failed: ${e.message}`)
							return
						}
					}
					self.state.playerState = 'Playing'
				}
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		next: {
			name: 'Next Track',
			options: [],
			callback: async () => { await self.spotify.next() },
		},

		previous: {
			name: 'Previous Track',
			options: [],
			callback: async () => { await self.spotify.previous() },
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
				let raw = await self.parseVariablesInString(action.options.track)
				let track = normaliseTrackUri(raw)
				let positionRaw = (action.options.position || '').trim()
				let positionMs = positionRaw !== '' ? parsePositionToMs(positionRaw) : undefined
				try {
					await self.spotify.playTrack(track, positionMs)
				} catch (e) {
					if (/no active device|device.*not.*found/i.test(e.message)) {
						try {
							let pick = await self.ensureActiveDevice()
							if (!pick) { self.log('error', 'No Spotify devices available — could not launch Spotify'); return }
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
				let raw = await self.parseVariablesInString(action.options.context)
				let context = normaliseContextUri(raw)
				if (!context || context === 'spotify:playlist:' || context === 'spotify:album:' || context === 'spotify:artist:') {
					self.log('error', 'Play Playlist: no context URI set — edit the button and paste your playlist/album URI')
					return
				}
				if (/^spotify:artist:/.test(context)) {
					self.log('error', 'Play Playlist: artist URIs are not supported by the Spotify API — use a playlist or album URI instead')
					return
				}
				let wantShuffle = !!action.options.shuffle
				// Don't send offset when shuffle is on — let Spotify pick randomly
				let offsetIndex = wantShuffle ? undefined : Math.max(0, (parseInt(action.options.offset, 10) || 1) - 1)
				let positionRaw = (action.options.position || '').trim()
				let positionMs = positionRaw !== '' ? parsePositionToMs(positionRaw) : undefined

				self.log('info', `Play context: ${context} shuffle=${wantShuffle} offset=${offsetIndex}`)

				let attemptPlay = async (deviceId) => {
					await self.spotify.playContext(context, offsetIndex, positionMs, deviceId)
					// Context play resets shuffle and repeat — re-issue both after play
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
							if (!pick) { self.log('error', 'No Spotify devices available — could not launch Spotify'); return }
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
				await self.spotify.seekTo(positionMs)
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
				await self.spotify.seekTo(positionMs)
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
				await self.spotify.seekTo(positionMs)
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
				self.state.volume = action.options.volume
				updateVariables.call(self)
			},
		},

		mute: {
			name: 'Mute',
			options: [],
			callback: async () => {
				self._premuteVolume = self.state.volume || 50
				await self.spotify.setVolume(0)
				self.state.volume = 0
			},
		},

		unmute: {
			name: 'Unmute',
			options: [],
			callback: async () => {
				let restore = (self._premuteVolume > 0) ? self._premuteVolume : 50
				await self.spotify.setVolume(restore)
				self.state.volume = restore
			},
		},

		muteToggle: {
			name: 'Mute / Unmute Toggle',
			options: [],
			callback: async () => {
				if (self.state.volume === 0) {
					let restore = (self._premuteVolume > 0) ? self._premuteVolume : 50
					await self.spotify.setVolume(restore)
					self.state.volume = restore
				} else {
					self._premuteVolume = self.state.volume
					await self.spotify.setVolume(0)
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
				await self.spotify.setVolume(v)
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
				await self.spotify.setVolume(v)
			},
		},

		shuffleOn: {
			name: 'Shuffle On',
			options: [],
			callback: async () => {
				await self.spotify.setShuffle(true)
				// Call twice to break out of Smart Shuffle if active
				if (self._smartShuffleWarned) await self.spotify.setShuffle(true)
				self.state.isShuffling = true
				self._smartShuffleWarned = false
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		shuffleOff: {
			name: 'Shuffle Off',
			options: [],
			callback: async () => {
				await self.spotify.setShuffle(false)
				// Call twice to break out of Smart Shuffle if active
				if (self._smartShuffleWarned) await self.spotify.setShuffle(false)
				self.state.isShuffling = false
				self._smartShuffleWarned = false
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		shuffleToggle: {
			name: 'Shuffle Toggle',
			options: [],
			callback: async () => {
				let next = !self.state.isShuffling
				await self.spotify.setShuffle(next)
				// Call twice to break out of Smart Shuffle if active
				if (self._smartShuffleWarned) await self.spotify.setShuffle(next)
				self.state.isShuffling = next
				self._smartShuffleWarned = false
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatOff: {
			name: 'Repeat Off',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('off')
				self.state.repeatMode = 'off'
				self.state.isRepeating = false
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatTrack: {
			name: 'Repeat Track',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('track')
				self.state.repeatMode = 'track'
				self.state.isRepeating = true
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatContext: {
			name: 'Repeat Playlist/Album',
			options: [],
			callback: async () => {
				await self.spotify.setRepeat('context')
				self.state.repeatMode = 'context'
				self.state.isRepeating = true
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatToggleAll: {
			name: 'Repeat Toggle (Off → Track → Playlist → Off)',
			options: [],
			callback: async () => {
				let next = 'off'
				if (self.state.repeatMode === 'off') next = 'track'
				else if (self.state.repeatMode === 'track') next = 'context'
				else next = 'off'
				await self.spotify.setRepeat(next)
				self.state.repeatMode = next
				self.state.isRepeating = next !== 'off'
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatToggleOffAll: {
			name: 'Repeat Toggle (Off ↔ Playlist)',
			options: [],
			callback: async () => {
				let next = self.state.repeatMode === 'off' ? 'context' : 'off'
				await self.spotify.setRepeat(next)
				self.state.repeatMode = next
				self.state.isRepeating = next !== 'off'
				self.checkFeedbacks()
				updateVariables.call(self)
			},
		},

		repeatToggleOffTrack: {
			name: 'Repeat Toggle (Off ↔ Track)',
			options: [],
			callback: async () => {
				let next = self.state.repeatMode === 'off' ? 'track' : 'off'
				await self.spotify.setRepeat(next)
				self.state.repeatMode = next
				self.state.isRepeating = next !== 'off'
				self.checkFeedbacks()
				updateVariables.call(self)
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
				let steps = Math.max(1, Math.round(duration / 100))
				let stepMs = duration / steps
				let stepVol = (target - start) / steps
				if (self._fadeTimer) clearInterval(self._fadeTimer)
				let current = 0
				self._fadeTimer = setInterval(async () => {
					current++
					let vol = Math.round(Math.min(100, Math.max(0, start + stepVol * current)))
					try {
						await self.spotify.setVolume(vol)
						self.state.volume = vol
					} catch (e) {}
					if (current >= steps) {
						clearInterval(self._fadeTimer)
						self._fadeTimer = null
					}
				}, stepMs)
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
				try { await self.spotify.setVolume(0) } catch (e) {}
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
				self.state.playerState = 'Playing'
				self.checkFeedbacks()
				let steps = Math.max(1, Math.round(duration / 250))
				let stepMs = duration / steps
				let stepVol = target / steps
				if (self._fadeTimer) clearInterval(self._fadeTimer)
				let current = 0
				self._fadeTimer = setInterval(async () => {
					current++
					let vol = Math.round(Math.min(target, Math.max(0, stepVol * current)))
					try {
						await self.spotify.setVolume(vol)
						self.state.volume = vol
						updateVariables.call(self)
					} catch (e) {}
					if (current >= steps) {
						clearInterval(self._fadeTimer)
						self._fadeTimer = null
					}
				}, stepMs)
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
				let raw = await self.parseVariablesInString(action.options.track)
				let track = normaliseTrackUri(raw)
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
				let id = (self.state.trackId || '').replace('spotify:track:', '')
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
				let id = (self.state.trackId || '').replace('spotify:track:', '')
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
				let id = (self.state.trackId || '').replace('spotify:track:', '')
				if (!id) return
				try {
					if (self.state.isLiked) {
						await self.spotify.removeTrack(id)
						self.state.isLiked = false
					} else {
						await self.spotify.saveTrack(id)
						self.state.isLiked = true
					}
					self.checkFeedbacks('trackLiked')
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
				let slot = (action.options.slot || 'main').trim()
				if (!self.state.trackId) {
					self.log('warn', `Bookmark save ignored — no track playing`)
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
				let slot = (action.options.slot || 'main').trim()
				let bm = self.config.bookmarks && self.config.bookmarks[slot]
				if (!bm || !bm.trackUri) {
					self.log('warn', `Bookmark resume: no bookmark saved for "${slot}"`)
					return
				}

				self.log('info', `Bookmark resume "${slot}": ${bm.trackName || bm.trackUri} @ ${Math.round((bm.positionMs || 0) / 1000)}s context=${bm.contextUri || 'none'}`)

				// Only use context play for playlist/album — artist and show contexts don't support track offsets
				let contextSupported = bm.contextUri && /^spotify:(playlist|album):/.test(bm.contextUri)

				let attempt = async (deviceId) => {
					if (contextSupported) {
						self.log('info', `Bookmark: playing context ${bm.contextUri} at track ${bm.trackUri} @ ${bm.positionMs}ms`)
						await self.spotify.playContextAtTrackUri(bm.contextUri, bm.trackUri, 0, deviceId)
						// Re-issue shuffle/repeat — context play resets both
						try { await self.spotify.setShuffle(self.state.isShuffling, deviceId) } catch (e) {}
						try { await self.spotify.setRepeat(self.state.repeatMode || 'off') } catch (e) {}
						// Spotify ignores position_ms on context plays — must seek after track loads (1s delay)
						if (bm.positionMs > 0) {
							await new Promise((r) => setTimeout(r, 1000))
							await self.spotify.seekTo(bm.positionMs)
						}
					} else {
						// Artist radio, show, or no context — play track directly
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
							if (!pick) { self.log('error', 'No Spotify devices available — could not launch Spotify'); return }
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
				let slot = action.options.slot || 'main'
				if (!self.config.bookmarks) self.config.bookmarks = {}
				let bm = self.config.bookmarks[slot]

				if (!bm || !bm.trackUri) {
					// No bookmark saved → save current position
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
					// Bookmark exists → resume it, then clear so next press saves again
					let contextSupportsOffset = bm.contextUri && /^spotify:(playlist|album):/.test(bm.contextUri)
					try {
						if (contextSupportsOffset) {
							await self.spotify.playContextAtTrackUri(bm.contextUri, bm.trackUri, 0)
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
						self.log('info', `RESUMED "${slot}" — ready to save again`)
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
