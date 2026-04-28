const { combineRgb } = require('@companion-module/base')

function getFeedbacks() {
	let self = this
	const white = combineRgb(255, 255, 255)
	const red = combineRgb(255, 0, 0)
	const green = combineRgb(0, 150, 0)
	const blue = combineRgb(0, 100, 200)
	const orange = combineRgb(220, 120, 0)

	return {
		playbackState: {
			type: 'boolean',
			name: 'Playback State',
			description: 'True when the player is in the chosen state',
			defaultStyle: { color: white, bgcolor: red },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: 'Playing',
					choices: [
						{ id: 'Playing', label: 'Playing' },
						{ id: 'Paused', label: 'Paused' },
						{ id: 'Stopped', label: 'Stopped' },
					],
				},
			],
			callback: (event) => self.state.playerState === event.options.state,
		},

		isPlaying: {
			type: 'boolean',
			name: 'Is Playing (any track)',
			description: 'True when any track is currently playing',
			defaultStyle: { color: white, bgcolor: green },
			options: [],
			callback: () => self.state.playerState === 'Playing',
		},

		shuffling: {
			type: 'boolean',
			name: 'Shuffle State',
			description: 'True when shuffle matches the chosen state',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: true,
					choices: [
						{ id: false, label: 'Off' },
						{ id: true, label: 'On' },
					],
				},
			],
			callback: (event) => self.state.isShuffling === event.options.state,
		},

		repeating: {
			type: 'boolean',
			name: 'Repeat On (any mode)',
			description: 'True when repeat is on (track or playlist)',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'State',
					default: true,
					choices: [
						{ id: false, label: 'Off' },
						{ id: true, label: 'On' },
					],
				},
			],
			callback: (event) => self.state.isRepeating === event.options.state,
		},

		repeatMode: {
			type: 'boolean',
			name: 'Repeat Mode',
			description: 'True when repeat mode matches',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'off',
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'track', label: 'Track' },
						{ id: 'context', label: 'Playlist/Album' },
					],
				},
			],
			callback: (event) => self.state.repeatMode === event.options.mode,
		},

		thisTrackPlaying: {
			type: 'boolean',
			name: 'This Track Is Playing',
			description: 'True when the configured track is currently playing',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID, URI, or URL',
					default: 'spotify:track:',
				},
			],
			callback: (event) => {
				let raw = (event.options.track || '').trim()
				let trackId = raw.replace('spotify:track:', '').replace(/.*open\.spotify\.com\/track\//, '').split('?')[0]
				let current = (self.state.trackId || '').replace('spotify:track:', '')
				if (!trackId || !current) return false
				return trackId === current && self.state.playerState === 'Playing'
			},
		},

		thisTrackSelected: {
			type: 'boolean',
			name: 'This Track Is Loaded (playing or paused)',
			description: 'True when the configured track is loaded, regardless of play state',
			defaultStyle: { color: white, bgcolor: blue },
			options: [
				{
					type: 'textinput',
					id: 'track',
					label: 'Track ID, URI, or URL',
					default: 'spotify:track:',
				},
			],
			callback: (event) => {
				let raw = (event.options.track || '').trim()
				let trackId = raw.replace('spotify:track:', '').replace(/.*open\.spotify\.com\/track\//, '').split('?')[0]
				let current = (self.state.trackId || '').replace('spotify:track:', '')
				if (!trackId || !current) return false
				return trackId === current
			},
		},

		trackNameMatch: {
			type: 'boolean',
			name: 'Current Track Name Matches',
			description: 'True when current track name contains the given text (case insensitive)',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'name',
					label: 'Track Name (partial match)',
					default: '',
				},
			],
			callback: (event) => {
				let q = (event.options.name || '').trim().toLowerCase()
				if (!q) return false
				return (self.state.trackName || '').toLowerCase().includes(q)
			},
		},

		artistMatch: {
			type: 'boolean',
			name: 'Current Artist Matches',
			description: 'True when current artist name contains the given text (case insensitive)',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'artist',
					label: 'Artist Name (partial match)',
					default: '',
				},
			],
			callback: (event) => {
				let q = (event.options.artist || '').trim().toLowerCase()
				if (!q) return false
				return (self.state.artistName || '').toLowerCase().includes(q)
			},
		},

		albumMatch: {
			type: 'boolean',
			name: 'Current Album Matches',
			description: 'True when current album name contains the given text (case insensitive)',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'album',
					label: 'Album Name (partial match)',
					default: '',
				},
			],
			callback: (event) => {
				let q = (event.options.album || '').trim().toLowerCase()
				if (!q) return false
				return (self.state.albumName || '').toLowerCase().includes(q)
			},
		},

		volumeMuted: {
			type: 'boolean',
			name: 'Volume Muted (0%)',
			description: 'True when volume is 0',
			defaultStyle: { color: white, bgcolor: red },
			options: [],
			callback: () => (self.state.volume || 0) === 0,
		},

		volumeAtOrAbove: {
			type: 'boolean',
			name: 'Volume At Or Above Level',
			description: 'True when volume is at or above the given level',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'number',
					id: 'level',
					label: 'Volume Level',
					min: 0,
					max: 100,
					default: 50,
					step: 1,
					required: true,
				},
			],
			callback: (event) => (self.state.volume || 0) >= event.options.level,
		},

		volumeBelow: {
			type: 'boolean',
			name: 'Volume Below Level',
			description: 'True when volume is below the given level',
			defaultStyle: { color: white, bgcolor: orange },
			options: [
				{
					type: 'number',
					id: 'level',
					label: 'Volume Level',
					min: 0,
					max: 100,
					default: 50,
					step: 1,
					required: true,
				},
			],
			callback: (event) => (self.state.volume || 0) < event.options.level,
		},

		positionPast: {
			type: 'boolean',
			name: 'Position Past Time',
			description: 'True when playback is past the given time (M:SS)',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'time',
					label: 'Time (M:SS)',
					default: '0:30',
				},
			],
			callback: (event) => {
				let parts = (event.options.time || '').split(':')
				let ms = parts.length === 2 ? (parseInt(parts[0], 10) * 60 + parseFloat(parts[1])) * 1000 : parseFloat(parts[0]) * 1000
				return (self.state.positionMs || 0) >= ms
			},
		},

		positionBefore: {
			type: 'boolean',
			name: 'Position Before Time',
			description: 'True when playback is before the given time (M:SS)',
			defaultStyle: { color: white, bgcolor: orange },
			options: [
				{
					type: 'textinput',
					id: 'time',
					label: 'Time (M:SS)',
					default: '0:30',
				},
			],
			callback: (event) => {
				let parts = (event.options.time || '').split(':')
				let ms = parts.length === 2 ? (parseInt(parts[0], 10) * 60 + parseFloat(parts[1])) * 1000 : parseFloat(parts[0]) * 1000
				return (self.state.positionMs || 0) < ms
			},
		},

		nearEnd: {
			type: 'boolean',
			name: 'Near End Of Track',
			description: 'True when remaining time is below the given seconds',
			defaultStyle: { color: white, bgcolor: orange },
			options: [
				{
					type: 'number',
					id: 'seconds',
					label: 'Remaining Seconds',
					min: 1,
					max: 60,
					default: 10,
					step: 1,
					required: true,
				},
			],
			callback: (event) => {
				let remaining = (self.state.durationMs || 0) - (self.state.positionMs || 0)
				return remaining > 0 && remaining <= event.options.seconds * 1000
			},
		},

		deviceMatch: {
			type: 'boolean',
			name: 'Active Device Matches',
			description: 'True when the active device name matches (case insensitive)',
			defaultStyle: { color: white, bgcolor: blue },
			options: [
				{
					type: 'textinput',
					id: 'device',
					label: 'Device Name (partial match)',
					default: '',
				},
			],
			callback: (event) => {
				let q = (event.options.device || '').trim().toLowerCase()
				if (!q) return false
				return (self.state.deviceName || '').toLowerCase().includes(q)
			},
		},

		hasActiveDevice: {
			type: 'boolean',
			name: 'Has Active Device',
			description: 'True when there is an active Spotify device',
			defaultStyle: { color: white, bgcolor: green },
			options: [],
			callback: () => !!self.state.deviceId,
		},

		trackLiked: {
			type: 'boolean',
			name: 'Current Track Is Liked',
			description: 'True when the current track is saved to your library',
			defaultStyle: { color: combineRgb(255, 80, 80), bgcolor: combineRgb(60, 0, 0) },
			options: [],
			callback: () => self.state.isLiked === true,
		},

		progressBar: {
			type: 'boolean',
			name: 'Progress Bar Segment',
			description: 'True when playback has passed this segment threshold. Use on a row of buttons to create a visual progress bar.',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'number',
					id: 'threshold',
					label: 'Activate at % through track',
					default: 25,
					min: 1,
					max: 100,
					step: 1,
					required: true,
				},
			],
			callback: (event) => {
				let duration = self.state.durationMs || 0
				if (duration === 0) return false
				let pct = (self.state.positionMs / duration) * 100
				return pct >= event.options.threshold
			},
		},

		bookmarkExists: {
			type: 'boolean',
			name: 'Bookmark Saved',
			description: 'True when a bookmark is saved for the given slot. Use to flip a Save button into a Resume button.',
			defaultStyle: { color: white, bgcolor: green },
			options: [
				{
					type: 'textinput',
					id: 'slot',
					label: 'Bookmark Slot',
					default: 'main',
				},
			],
			callback: (event) => {
				let slot = event.options.slot || 'main'
				let bm = self.config && self.config.bookmarks && self.config.bookmarks[slot]
				return !!(bm && bm.trackUri)
			},
		},

		apiHealthy: {
			type: 'boolean',
			name: 'API Connection Healthy',
			description: 'True when the Spotify API is reachable and authenticated. Use the inverted style for warnings.',
			defaultStyle: { color: white, bgcolor: red },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'When',
					default: 'unhealthy',
					choices: [
						{ id: 'healthy', label: 'API healthy' },
						{ id: 'unhealthy', label: 'API failing' },
					],
				},
			],
			callback: (event) => {
				let healthy = self._apiHealthy !== false
				return event.options.state === 'healthy' ? healthy : !healthy
			},
		},

		albumArt: {
			type: 'advanced',
			name: 'Album Art',
			description: 'Shows current album artwork on the button. Choose grid size and which cell this button represents.',
			options: [
				{
					type: 'dropdown',
					id: 'grid',
					label: 'Grid Size',
					default: '1x1',
					choices: [
						{ id: '1x1', label: '1x1 (single button)' },
						{ id: '2x2_0_0', label: '2x2 - Top Left' },
						{ id: '2x2_0_1', label: '2x2 - Top Right' },
						{ id: '2x2_1_0', label: '2x2 - Bottom Left' },
						{ id: '2x2_1_1', label: '2x2 - Bottom Right' },
						{ id: '3x3_0_0', label: '3x3 - Row 1, Col 1' },
						{ id: '3x3_0_1', label: '3x3 - Row 1, Col 2' },
						{ id: '3x3_0_2', label: '3x3 - Row 1, Col 3' },
						{ id: '3x3_1_0', label: '3x3 - Row 2, Col 1' },
						{ id: '3x3_1_1', label: '3x3 - Row 2, Col 2' },
						{ id: '3x3_1_2', label: '3x3 - Row 2, Col 3' },
						{ id: '3x3_2_0', label: '3x3 - Row 3, Col 1' },
						{ id: '3x3_2_1', label: '3x3 - Row 3, Col 2' },
						{ id: '3x3_2_2', label: '3x3 - Row 3, Col 3' },
					],
				},
			],
			callback: (event) => {
				let url = self.state.albumArtUrl
				if (!url) return {}
				let cache = self._albumArtCache && self._albumArtCache[url]
				if (!cache) return {}
				let key = event.options.grid || '1x1'
				let b64 = cache[key]
				if (!b64) return {}
				// Strip data URI prefix if present
				let raw = b64.replace(/^data:image\/\w+;base64,/, '')
				return { png64: raw }
			},
		},
	}
}

module.exports = { getFeedbacks }
