const { combineRgb } = require('@companion-module/base')
const { ICON_PLAY, ICON_PAUSE, ICON_NEXT, ICON_PREVIOUS, ICON_SHUFFLE_ACTIVE, ICON_SHUFFLE_INACTIVE, ICON_LOOP_ACTIVE, ICON_LOOP_INACTIVE, ICON_LOOP_ONE_ACTIVE, ICON_LOOP_ONE_INACTIVE, ICON_VOLUME_UP, ICON_VOLUME_DOWN, ICON_VOLUME_MUTE, ICON_VOLUME_UNMUTE, ICON_BACKWARD_SEEK, ICON_FORWARD_SEEK } = require('./icons')

function getPresets() {
	let self = this
	const white = combineRgb(255, 255, 255)
	const black = combineRgb(0, 0, 0)
	const red = combineRgb(255, 0, 0)
	const green = combineRgb(0, 180, 0)
	const darkGreen = combineRgb(0, 100, 0)
	const limeGreen = combineRgb(0, 255, 0)
	const blue = combineRgb(0, 100, 200)
	const yellow = combineRgb(255, 200, 0)
	const amber = combineRgb(180, 80, 0)
	const orange = combineRgb(220, 120, 0)
	const grey = combineRgb(60, 60, 60)

	let presets = []

	// ====== PLAYBACK ======
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Play',
		style: { text: 'PLAY', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'play', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Playing' }, style: { color: white, bgcolor: red } }],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Pause',
		style: { text: 'PAUSE', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'pause', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Paused' }, style: { color: white, bgcolor: red } }],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Play/Pause Toggle',
		style: { text: 'PLAY/\\nPAUSE', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Playing' }, style: { color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Next Track',
		style: { text: '>>|', size: '24', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'next', options: {} }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Previous Track',
		style: { text: '|<<', size: '24', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'previous', options: {} }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Skip Forward 10s',
		style: { text: '+10s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'skipForward', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Skip Back 10s',
		style: { text: '-10s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'skipBack', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Skip Forward 30s',
		style: { text: '+30s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'skipForward', options: { seconds: 30 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Skip Back 30s',
		style: { text: '-30s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'skipBack', options: { seconds: 30 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Move Position +10s',
		style: { text: '+10s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'movePosition', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playback',
		name: 'Move Position -10s',
		style: { text: '-10s', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'movePosition', options: { seconds: -10 } }], up: [] }],
		feedbacks: [],
	})

	// ====== TIME DISPLAYS ======
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Position',
		style: { text: '$(bsk-spotify:position_hms)', size: '18', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Duration',
		style: { text: '$(bsk-spotify:duration_hms)', size: '18', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Time Remaining',
		style: { text: '-$(bsk-spotify:remaining_hms)', size: '18', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Position / Duration',
		style: { text: '$(bsk-spotify:position_hms)\\n/\\n$(bsk-spotify:duration_hms)', size: '14', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})

	// ====== TRACK INFO ======
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Album Name',
		style: { text: '$(bsk-spotify:album)', size: '14', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Track + Artist',
		style: { text: '$(bsk-spotify:track)\\n$(bsk-spotify:artist)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Track + Position',
		style: { text: '$(bsk-spotify:track)\\n$(bsk-spotify:position_hms)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Track + Time Remaining',
		style: { text: '$(bsk-spotify:track)\\n-$(bsk-spotify:remaining_hms)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Now Playing (Track + Position/Duration)',
		style: { text: '$(bsk-spotify:track)\\n$(bsk-spotify:position_hms) / $(bsk-spotify:duration_hms)', size: '10', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})

	// ====== VOLUME ======
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume Down (-10)',
		style: { text: 'VOL -', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'volumeDown', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume Up (+10)',
		style: { text: 'VOL +', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'volumeUp', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume 0%',
		style: { text: 'VOL\\n0%', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'setVolume', options: { volume: 0 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume 25%',
		style: { text: 'VOL\\n25%', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'setVolume', options: { volume: 25 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume 50%',
		style: { text: 'VOL\\n50%', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'setVolume', options: { volume: 50 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume 75%',
		style: { text: 'VOL\\n75%', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'setVolume', options: { volume: 75 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume 100%',
		style: { text: 'VOL\\n100%', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'setVolume', options: { volume: 100 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Volume Display',
		style: { text: 'VOL\\n$(bsk-spotify:volume)', size: '14', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Mute',
		style: { text: 'MUTE', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'mute', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'volumeMuted', options: {}, style: { color: white, bgcolor: red } }],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Unmute',
		style: { text: 'UNMUTE', size: '18', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'unmute', options: {} }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Mute / Unmute Toggle (state-aware)',
		style: { text: '🔊\\nUNMUTED', size: '12', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'muteToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'volumeMuted', options: {}, style: { text: '🔇\\nMUTED', color: white, bgcolor: red } }],
	})

	// ====== SHUFFLE ======
	presets.push({
		type: 'button',
		category: 'Shuffle',
		name: 'Shuffle On',
		style: { text: 'SHUFFLE\\nON', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'shuffleOn', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'shuffling', options: { state: true }, style: { color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Shuffle',
		name: 'Shuffle Off',
		style: { text: 'SHUFFLE\\nOFF', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'shuffleOff', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'shuffling', options: { state: false }, style: { color: white, bgcolor: red } }],
	})

	presets.push({
		type: 'button',
		category: 'Shuffle',
		name: 'Shuffle Toggle (state-aware)',
		style: { text: 'SHUFFLE\\nOFF', size: '14', color: combineRgb(120, 120, 120), bgcolor: black },
		steps: [{ down: [{ actionId: 'shuffleToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'shuffling', options: { state: true }, style: { text: 'SHUFFLE\\nON', color: white, bgcolor: green } }],
	})

	// ====== REPEAT ======
	presets.push({
		type: 'button',
		category: 'Repeat',
		name: 'Repeat Off',
		style: { text: 'REPEAT\\nOFF', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'repeatOff', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'repeatMode', options: { mode: 'off' }, style: { color: white, bgcolor: red } }],
	})
	presets.push({
		type: 'button',
		category: 'Repeat',
		name: 'Repeat Track',
		style: { text: 'REPEAT\\nTRACK', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'repeatTrack', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'repeatMode', options: { mode: 'track' }, style: { color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Repeat',
		name: 'Repeat Playlist/Album',
		style: { text: 'REPEAT\\nALL', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'repeatContext', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'repeatMode', options: { mode: 'context' }, style: { color: white, bgcolor: green } }],
	})

	// ====== PLAYLIST / CONTEXT ======
	presets.push({
		type: 'button',
		category: 'Playlist',
		name: 'Play Playlist',
		style: { text: 'Playlist\\nPLAY', size: '14', color: white, bgcolor: blue },
		steps: [
			{
				down: [{ actionId: 'playPlaylist', options: { context: 'spotify:playlist:', offset: 1, position: '', shuffle: false } }],
				up: [],
			},
		],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Playlist',
		name: 'Play Album',
		style: { text: 'Album\\nPLAY', size: '14', color: white, bgcolor: blue },
		steps: [
			{
				down: [{ actionId: 'playPlaylist', options: { context: 'spotify:album:', offset: 1, position: '', shuffle: false } }],
				up: [],
			},
		],
		feedbacks: [],
	})

	// ====== DEVICE ======
	presets.push({
		type: 'button',
		category: 'Device',
		name: 'Active Device',
		style: { text: '$(bsk-spotify:device_name)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [{ feedbackId: 'hasActiveDevice', options: {}, style: { color: white, bgcolor: green } }],
	})

	// ====== TRANSPORT ICONS (Spotify green icon images) ======
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Play',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'play', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Pause',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PAUSE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'pause', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'playbackState', options: { state: 'Paused' }, style: { bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Play/Pause Toggle (state-aware)',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Previous',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PREVIOUS, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'previous', options: {} }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Next',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_NEXT, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'next', options: {} }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Skip Back 10s',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_BACKWARD_SEEK, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'skipBack', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Skip Forward 10s',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_FORWARD_SEEK, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'skipForward', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Volume Down',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_VOLUME_DOWN, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'volumeDown', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Volume Up',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_VOLUME_UP, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'volumeUp', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Previous + Hold: Skip Back 10s',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PREVIOUS, pngalignment: 'center:center' },
		steps: [
			{
				up: [{ actionId: 'previous', options: {} }],
				down: [],
				600: [{ actionId: 'movePosition', options: { seconds: -10 } }],
				options: { runWhileHeld: [600] },
			},
		],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Transport Icons',
		name: 'Next + Hold: Skip Fwd 10s',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_NEXT, pngalignment: 'center:center' },
		steps: [
			{
				up: [{ actionId: 'next', options: {} }],
				down: [],
				600: [{ actionId: 'movePosition', options: { seconds: 10 } }],
				options: { runWhileHeld: [600] },
			},
		],
		feedbacks: [],
	})
	// ====== TOGGLES ======
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Play/Pause Toggle',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Shuffle Toggle',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_SHUFFLE_INACTIVE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'shuffleToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'shuffling', options: { state: true }, style: { png64: ICON_SHUFFLE_ACTIVE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Repeat Toggle (Off/All)',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_LOOP_INACTIVE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'repeatToggleOffAll', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'repeatMode', options: { mode: 'context' }, style: { png64: ICON_LOOP_ACTIVE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Repeat Toggle (Off/1)',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_LOOP_ONE_INACTIVE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'repeatToggleOffTrack', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'repeatMode', options: { mode: 'track' }, style: { png64: ICON_LOOP_ONE_ACTIVE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Repeat Cycle (Off/1/All)',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_LOOP_INACTIVE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'repeatToggleAll', options: {} }], up: [] }],
		feedbacks: [
			{ feedbackId: 'repeatMode', options: { mode: 'track' }, style: { png64: ICON_LOOP_ONE_ACTIVE, bgcolor: darkGreen } },
			{ feedbackId: 'repeatMode', options: { mode: 'context' }, style: { png64: ICON_LOOP_ACTIVE, bgcolor: darkGreen } },
		],
	})
	presets.push({
		type: 'button',
		category: 'Toggles',
		name: 'Mute/Unmute Toggle',
		style: { text: '', size: '18', color: white, bgcolor: black, png64: ICON_VOLUME_UNMUTE, pngalignment: 'center:center' },
		steps: [{ down: [{ actionId: 'muteToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'volumeMuted', options: {}, style: { png64: ICON_VOLUME_MUTE, bgcolor: red } }],
	})
	// Tech-useful: time remaining with end-of-track warning
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Remaining (warns near end)',
		style: { text: '-$(bsk-spotify:remaining_hms)', size: '18', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{ feedbackId: 'nearEnd', options: { seconds: 10 }, style: { color: black, bgcolor: orange } },
			{ feedbackId: 'nearEnd', options: { seconds: 3 }, style: { color: white, bgcolor: red } },
		],
	})

	// Tech-useful: active device indicator (which speaker/PC is playing)
	presets.push({
		type: 'button',
		category: 'Device',
		name: 'Active Device Name',
		style: { text: '$(bsk-spotify:device_name)', size: '14', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [{ feedbackId: 'hasActiveDevice', options: {}, style: { color: white, bgcolor: darkGreen } }],
	})

	// ====== COMBO BUTTONS ======
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Previous / Hold: Skip Back 10s',
		style: { text: '', color: white, bgcolor: black, png64: ICON_PREVIOUS, pngalignment: 'center:center' },
		steps: [{ up: [{ actionId: 'previous', options: {} }], down: [], 600: [{ actionId: 'movePosition', options: { seconds: -10 } }], options: { runWhileHeld: [600] } }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Next / Hold: Skip Forward 10s',
		style: { text: '', color: white, bgcolor: black, png64: ICON_NEXT, pngalignment: 'center:center' },
		steps: [{ up: [{ actionId: 'next', options: {} }], down: [], 600: [{ actionId: 'movePosition', options: { seconds: 10 } }], options: { runWhileHeld: [600] } }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Next + Next Up / Hold: Skip Fwd 10s',
		style: { text: '$(bsk-spotify:next_track)\\n$(bsk-spotify:next_artist)', size: '12', color: white, bgcolor: black, png64: ICON_NEXT, pngalignment: 'center:top' },
		steps: [{ up: [{ actionId: 'next', options: {} }], down: [], 600: [{ actionId: 'movePosition', options: { seconds: 10 } }], options: { runWhileHeld: [600] } }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Play/Pause + Track & Artist',
		style: { text: '$(bsk-spotify:track)\\n$(bsk-spotify:artist)', size: '12', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:top' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Play/Pause + Time Remaining',
		style: { text: '-$(bsk-spotify:remaining_hms)', size: '11', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:top' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Play/Pause + Position / Remaining',
		style: { text: '$(bsk-spotify:position_hms)\\n-$(bsk-spotify:remaining_hms)', size: '10', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:top' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Time Display (Position / Duration / Remaining)',
		style: { text: '+ $(bsk-spotify:position_hms)\\n   $(bsk-spotify:duration_hms)\\n– $(bsk-spotify:remaining_hms)', size: '18', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [{ feedbackId: 'nearEnd', options: { seconds: 20 }, style: { color: yellow, bgcolor: amber } }],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Volume Down + Level',
		style: { text: '$(bsk-spotify:volume)%', size: '12', color: white, bgcolor: black, png64: ICON_VOLUME_DOWN, pngalignment: 'center:top' },
		steps: [{ down: [{ actionId: 'volumeDown', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Volume Up + Level',
		style: { text: '$(bsk-spotify:volume)%', size: '12', color: white, bgcolor: black, png64: ICON_VOLUME_UP, pngalignment: 'center:top' },
		steps: [{ down: [{ actionId: 'volumeUp', options: { amount: 10 } }], up: [] }],
		feedbacks: [],
	})

	// ====== BOOKMARK / SAVE-RESUME ======
	presets.push({
		type: 'button',
		category: 'Bookmark',
		name: 'Save Position (main)',
		style: { text: 'SAVE\\nPOS', size: '14', color: white, bgcolor: orange },
		steps: [{ down: [{ actionId: 'bookmarkSave', options: { slot: 'main' } }], up: [] }],
		feedbacks: [{ feedbackId: 'bookmarkExists', options: { slot: 'main' }, style: { text: 'SAVED\\n✓', color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Bookmark',
		name: 'Resume Position (main)',
		style: { text: 'RESUME\\nPOS', size: '14', color: grey, bgcolor: black },
		steps: [{ down: [{ actionId: 'bookmarkResume', options: { slot: 'main' } }], up: [] }],
		feedbacks: [{ feedbackId: 'bookmarkExists', options: { slot: 'main' }, style: { color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Bookmark',
		name: 'Save / Resume Toggle (main)',
		style: { text: 'SAVE\\nPOS', size: '14', color: white, bgcolor: orange },
		steps: [{ down: [{ actionId: 'bookmarkToggle', options: { slot: 'main' } }], up: [] }],
		feedbacks: [{ feedbackId: 'bookmarkExists', options: { slot: 'main' }, style: { text: 'RESUME\\nPOS', color: white, bgcolor: green } }],
	})
	presets.push({
		type: 'button',
		category: 'Bookmark',
		name: 'Clear Bookmark (main)',
		style: { text: 'CLEAR\\nPOS', size: '14', color: combineRgb(120, 120, 120), bgcolor: black },
		steps: [{ down: [{ actionId: 'bookmarkClear', options: { slot: 'main' } }], up: [] }],
		feedbacks: [{ feedbackId: 'bookmarkExists', options: { slot: 'main' }, style: { color: white, bgcolor: red } }],
	})

	// ====== TIMESTAMP CUE (Soundboard) ======
	presets.push({
		type: 'button',
		category: 'Timestamp Cue',
		name: 'Play Track From Timestamp',
		style: { text: 'Track Name\\n0:00', size: '14', color: white, bgcolor: darkGreen },
		steps: [
			{
				down: [
					{ actionId: 'shuffleOff', options: {} },
					{ actionId: 'playTrack', options: { track: 'spotify:track:', position: '0:00' } },
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'thisTrackPlaying',
				options: { track: 'spotify:track:' },
				style: { color: white, bgcolor: green },
			},
		],
	})

	// ====== NEXT TRACK ======
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Next Track Name',
		style: { text: 'NEXT:\\n$(bsk-spotify:next_track)', size: '11', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Track Info',
		name: 'Next Track + Artist',
		style: { text: '$(bsk-spotify:next_track)\\n$(bsk-spotify:next_artist)', size: '11', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})


	// ====== VOLUME FADE ======
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Fade In (5s)',
		style: { text: 'FADE\\nIN 5s', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'volumeFade', options: { target: 100, duration: 5 } }], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Fade Out (5s)',
		style: { text: 'FADE\\nOUT 5s', size: '14', color: white, bgcolor: black },
		steps: [{ down: [{ actionId: 'volumeFade', options: { target: 0, duration: 5 } }], up: [] }],
		feedbacks: [],
	})
	// Combo: Fade Out then Pause (pause fires after fade completes)
	// Combo: Play then Fade In (sets vol to 0, plays, fades up)
	presets.push({
		type: 'button',
		category: 'Volume',
		name: 'Play + Fade In (5s)',
		style: { text: 'PLAY +\\nFADE IN', size: '12', color: white, bgcolor: black },
		steps: [{
			down: [{ actionId: 'playFadeIn', options: { duration: 5, target: 100 } }],
			up: [],
		}],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { color: white, bgcolor: darkGreen } }],
	})

	// ====== ALBUM ART ======
	presets.push({
		type: 'button',
		category: 'Album Art',
		name: 'Album Art (1x1)',
		style: { text: '', size: '14', color: combineRgb(100, 100, 100), bgcolor: black },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'albumArt', options: { grid: '1x1' } }],
	})
	let twoLabels = [['TL','TR'],['BL','BR']]
	for (let r = 0; r < 2; r++) {
		for (let c = 0; c < 2; c++) {
			presets.push({
				type: 'button',
				category: 'Album Art',
				name: `Album Art 2x2 - ${twoLabels[r][c]}`,
				style: { text: '', size: '14', color: combineRgb(100, 100, 100), bgcolor: black },
				steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
				feedbacks: [{ feedbackId: 'albumArt', options: { grid: `2x2_${r}_${c}` } }],
			})
		}
	}
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 3; c++) {
			presets.push({
				type: 'button',
				category: 'Album Art',
				name: `Album Art 3x3 - R${r + 1}C${c + 1}`,
				style: { text: '', size: '14', color: combineRgb(100, 100, 100), bgcolor: black },
				steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
				feedbacks: [{ feedbackId: 'albumArt', options: { grid: `3x3_${r}_${c}` } }],
			})
		}
	}

	// ====== DISPLAY / CYCLING ======
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Cycling Display (Track / Artist / Album)',
		style: { text: '$(bsk-spotify:display_all)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Cycling Display (Track / Artist)',
		style: { text: '$(bsk-spotify:display_track_artist)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Cycling Display (Track / Playlist Name)',
		style: { text: '$(bsk-spotify:display_track_playlist)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Display',
		name: 'Playlist Name',
		style: { text: '$(bsk-spotify:playlist_name)', size: '12', color: white, bgcolor: black },
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	})
	presets.push({
		type: 'button',
		category: 'Combo',
		name: 'Play/Pause + Position',
		style: { text: '$(bsk-spotify:position_hms)\\n$(bsk-spotify:track)', size: '11', color: white, bgcolor: black, png64: ICON_PLAY, pngalignment: 'center:bottom' },
		steps: [{ down: [{ actionId: 'playToggle', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'isPlaying', options: {}, style: { png64: ICON_PAUSE, bgcolor: darkGreen } }],
	})

	// ====== HEALTH ======
	presets.push({
		type: 'button',
		category: 'Health',
		name: 'API Status',
		style: { text: 'API\\n$(bsk-spotify:api_status)', size: '14', color: white, bgcolor: darkGreen },
		steps: [{ down: [], up: [] }],
		feedbacks: [{ feedbackId: 'apiHealthy', options: { state: 'unhealthy' }, style: { color: white, bgcolor: red } }],
	})
	presets.push({
		type: 'button',
		category: 'Health',
		name: 'Status Indicator (OK / Idle / Err)',
		style: { text: 'OK', size: '18', color: white, bgcolor: darkGreen },
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{ feedbackId: 'hasActiveDevice', options: {}, isInverted: true, style: { text: 'IDLE', color: white, bgcolor: combineRgb(0, 0, 153) } },
			{ feedbackId: 'apiHealthy', options: { state: 'unhealthy' }, style: { text: 'ERR', color: white, bgcolor: red } },
		],
	})

	return presets
}

module.exports = { getPresets }
