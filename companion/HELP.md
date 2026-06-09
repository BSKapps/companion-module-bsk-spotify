# BSK Apps: Spotify Control

Controls Spotify playback through the Spotify Web API. Requires Spotify Premium and a free Spotify Developer app.

## Setup

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app (any name).
2. In the app settings, add `http://127.0.0.1:4115/callback` as a Redirect URI. Click Add, then Save.
3. Copy the Client ID and Client Secret into the module config and save.
4. Open `http://127.0.0.1:4115/auth` in your browser and complete the Spotify login.

The Refresh Token field fills in automatically. You should only need to do this once. A walkthrough with screenshots is at [bskapps.com/resources/companion](https://bskapps.com/resources/companion/).

## Actions

| Action | Notes |
|---|---|
| Play / Pause / Play-Pause Toggle | Launches Spotify if no device is active |
| Next Track / Previous Track | |
| Seek To Position | M:SS |
| Skip Forward / Skip Back | By N seconds |
| Move Playback Position | Signed offset, negative rewinds |
| Set Volume / Volume Up / Volume Down | 0-100 |
| Mute / Unmute / Mute Toggle | Remembers the pre-mute level |
| Volume Fade | Fade to a target volume over a duration |
| Play with Fade In | Sets volume to 0, plays, fades up |
| Shuffle On / Off / Toggle | |
| Repeat Off / Track / Playlist-Album | |
| Repeat Toggle | Three variants: full cycle, off/playlist, off/track |
| Play Track By ID | Accepts URI, share URL, or bare ID, with optional start position |
| Play Playlist / Album / Context | Optional start track, start position, shuffle |
| Add Track to Queue | |
| Save / Remove / Toggle Like | Current track |
| Save Bookmark | Stores track, position, and playlist/album context |
| Resume Bookmark | Returns to the saved track and position |
| Save/Resume Bookmark Toggle | Saves when empty, resumes and clears when set |
| Clear Bookmark | One slot, or all when blank |

## Variables

| Variable | Description |
|---|---|
| `track`, `artist`, `album` | Current track info |
| `state` | Playing / Paused / Stopped |
| `volume` | 0-100 |
| `shuffle` | On / Off |
| `repeat` | off / track / context |
| `position_ms`, `duration_ms`, `remaining_ms` | Milliseconds |
| `position_hms`, `duration_hms`, `remaining_hms` | M:SS |
| `position_mss`, `duration_mss`, `remaining_mss` | M:SS:ms |
| `track_id` | Current track URI |
| `device_name`, `device_type` | Active device |
| `context_uri`, `context_type` | Current playlist/album context |
| `playlist_name` | Name of the current playlist, empty otherwise |
| `next_track`, `next_artist` | Next track in the queue |
| `is_liked` | true / false |
| `api_status` | OK / Error |
| `display_all` | Cycles Track / Artist / Album |
| `display_track_artist` | Cycles Track / Artist |
| `display_track_playlist` | Cycles Track / Playlist |
| `display_next_track_artist` | Cycles next Track / Artist |

The cycling speed is set in the module config and is shared by all display variables.

## Feedbacks

Playback state, is playing, shuffle state, repeat on, repeat mode, this track playing, this track loaded, track/artist/album name match, volume muted, volume at-or-above, volume below, position past/before time, near end of track, device match, has active device, track liked, progress bar segment, bookmark saved, API healthy, and album art (1x1, 2x2, or 3x3 grids).

## Bookmarks

Save Bookmark captures the current track, position, and playlist/album context. Resume returns to that track and position; if it was in a playlist or album, next/previous continue from there. Spotify ignores the position on context plays, so playback briefly starts from the beginning before seeking. This is a Spotify API limitation.

## Offline fallback (macOS only)

If the Web API becomes unreachable, the module switches to controlling the local Spotify app via AppleScript after about 6 seconds. Play, pause, next, previous, seek, volume, shuffle, and repeat keep working, and track info still updates. Actions that need the internet (play by ID, play playlist, queue, like, bookmark resume) log a warning and do nothing. The module retries the Web API every 20 seconds or so and switches back automatically.

## Tips

- If nothing works, make sure Spotify is open and has played at least once on the target device. Devices that have never played report "no active device".
- If buttons stop responding mid-show, the Spotify app may have gone idle. Press play in Spotify once and the module reconnects within 2 seconds.
- Re-authenticate if you change your Spotify password or the connection error does not clear on its own.
