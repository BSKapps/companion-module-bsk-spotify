function getVariables() {
	return [
		{ variableId: 'track', name: 'Current Track Name' },
		{ variableId: 'artist', name: 'Current Artist' },
		{ variableId: 'album', name: 'Current Album' },
		{ variableId: 'state', name: 'Player State (Playing/Paused/Stopped)' },
		{ variableId: 'volume', name: 'Volume (0-100)' },
		{ variableId: 'shuffle', name: 'Shuffle State (On/Off)' },
		{ variableId: 'repeat', name: 'Repeat Mode (off/track/context)' },
		{ variableId: 'position_ms', name: 'Position (ms)' },
		{ variableId: 'position_hms', name: 'Position (M:SS)' },
		{ variableId: 'duration_ms', name: 'Duration (ms)' },
		{ variableId: 'duration_hms', name: 'Duration (M:SS)' },
		{ variableId: 'remaining_ms', name: 'Time Remaining (ms)' },
		{ variableId: 'remaining_hms', name: 'Time Remaining (M:SS)' },
		{ variableId: 'track_id', name: 'Current Track URI' },
		{ variableId: 'device_name', name: 'Active Device Name' },
		{ variableId: 'device_type', name: 'Active Device Type' },
		{ variableId: 'context_uri', name: 'Current Context URI (playlist/album)' },
		{ variableId: 'context_type', name: 'Current Context Type' },
		{ variableId: 'playlist_name', name: 'Current Playlist Name (empty if not playing a playlist)' },
		{ variableId: 'display_all', name: 'Cycling Display (Track / Artist / Album)' },
		{ variableId: 'display_track_artist', name: 'Cycling Display (Track / Artist)' },
		{ variableId: 'display_track_playlist', name: 'Cycling Display (Track / Playlist Name)' },
		{ variableId: 'position_mss', name: 'Position (M:SS:ms)' },
		{ variableId: 'duration_mss', name: 'Duration (M:SS:ms)' },
		{ variableId: 'remaining_mss', name: 'Time Remaining (M:SS:ms)' },
		{ variableId: 'next_track', name: 'Next Track Name' },
		{ variableId: 'next_artist', name: 'Next Track Artist' },
		{ variableId: 'is_liked', name: 'Current Track Liked (true/false)' },
		{ variableId: 'api_status', name: 'API Status (OK/Error)' },
	]
}

function msToHMS(ms) {
	let total = Math.floor(ms / 1000)
	let mins = Math.floor(total / 60)
	let secs = total % 60
	return `${mins}:${secs.toString().padStart(2, '0')}`
}

function msToMSSms(ms) {
	let totalMs = Math.round(ms)
	let mins = Math.floor(totalMs / 60000)
	let secs = Math.floor((totalMs % 60000) / 1000)
	let millis = totalMs % 1000
	return `${mins}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`
}

function updateVariables() {
	let remaining = Math.max(0, (this.state.durationMs || 0) - (this.state.positionMs || 0))
	let trackArtistAlbum = [
		this.state.trackName || '',
		this.state.artistName || '',
		this.state.albumName || '',
	].filter(Boolean)
	let trackArtist = [
		this.state.trackName || '',
		this.state.artistName || '',
	].filter(Boolean)
	let trackPlaylist = [
		this.state.trackName || '',
		this.state.playlistName || '',
	].filter(Boolean)
	let cycleSecs = (this.config && this.config.displayCycleSeconds) || 2
	let now = Date.now()
	if (!this._displayCycleAt) this._displayCycleAt = now
	if (now - this._displayCycleAt >= cycleSecs * 1000) {
		this._displayCycleIndex = (this._displayCycleIndex || 0) + 1
		this._displayCycleAt = now
	}
	let cycleIdx = this._displayCycleIndex || 0
	let displayValue = trackArtistAlbum.length > 0 ? trackArtistAlbum[cycleIdx % trackArtistAlbum.length] : ''
	let displayTrackArtist = trackArtist.length > 0 ? trackArtist[cycleIdx % trackArtist.length] : ''
	let displayTrackPlaylist = trackPlaylist.length > 0 ? trackPlaylist[cycleIdx % trackPlaylist.length] : ''
	this.setVariableValues({
		track: this.state.trackName || '',
		artist: this.state.artistName || '',
		album: this.state.albumName || '',
		state: this.state.playerState || 'Stopped',
		volume: this.state.volume !== undefined ? String(this.state.volume) : '',
		shuffle: this.state.isShuffling ? 'On' : 'Off',
		repeat: this.state.repeatMode || 'off',
		position_ms: String(this.state.positionMs || 0),
		position_hms: msToHMS(this.state.positionMs || 0),
		duration_ms: String(this.state.durationMs || 0),
		duration_hms: msToHMS(this.state.durationMs || 0),
		remaining_ms: String(remaining),
		remaining_hms: msToHMS(remaining),
		track_id: this.state.trackId || '',
		device_name: this.state.deviceName || '',
		device_type: this.state.deviceType || '',
		context_uri: this.state.contextUri || '',
		context_type: this.state.contextType || '',
		playlist_name: this.state.playlistName || '',
		display_all: displayValue,
		display_track_artist: displayTrackArtist,
		display_track_playlist: displayTrackPlaylist,
		position_mss: msToMSSms(this.state.positionMs || 0),
		duration_mss: msToMSSms(this.state.durationMs || 0),
		remaining_mss: msToMSSms(remaining),
		next_track: this.state.nextTrackName || '',
		next_artist: this.state.nextTrackArtist || '',
		is_liked: this.state.isLiked ? 'true' : 'false',
		api_status: this._apiHealthy === false ? 'Error' : 'OK',
	})
}

module.exports = { getVariables, updateVariables }
