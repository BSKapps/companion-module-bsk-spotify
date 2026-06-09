# BSK Spotify Web API

Full-featured Spotify controller built for live show use. Requires Spotify Premium.

---

## Setup

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app (any name).
2. In your app settings, add `http://127.0.0.1:4115/callback` as a Redirect URI. Click Add, then Save.
3. Copy the **Client ID** and **Client Secret** into the module config.
4. Click **Save** in Companion.
5. Open `http://127.0.0.1:4115/auth` in your browser and complete the Spotify login.

The Refresh Token field will auto-fill. You should only need to do this once.

---

## Actions

| Action | Description |
|---|---|
| Play | Resume playback |
| Pause | Pause playback |
| Play/Pause Toggle | Toggle play/pause |
| Next Track | Skip to next |
| Previous Track | Skip to previous |
| Skip Forward/Back | Skip by N seconds |
| Set Volume | Set volume 0-100 |
| Volume Up / Down | Adjust by step |
| Play Fade In | Set volume to 0, play, then fade up |
| Fade Out | Fade volume to 0 |
| Shuffle On / Off / Toggle | Control shuffle state |
| Repeat Off / Track / Context / Cycle | Control repeat mode |
| Play Track by URI | Play a specific Spotify URI |
| Play Track at Timestamp | Play from exact position (M:SS or M:SS.mmm) |
| Play Playlist | Play a playlist by URI |
| Play Playlist Track | Play track N in a playlist |
| Transfer to Device | Move playback to a named device |
| Add to Queue | Add a track URI to the queue |
| Like Current Track | Save to Liked Songs |
| Unlike Current Track | Remove from Liked Songs |
| Save Bookmark | Save current track, position, and context |
| Resume Bookmark | Return to saved track and position |
| Toggle Bookmark | Save if empty, resume if set |
| Clear Bookmark | Clear a saved bookmark slot |
| Album Art 1x1 | Show album art on one button |
| Album Art 2x2 | Spread album art across a 2x2 grid |
| Album Art 3x3 | Spread album art across a 3x3 grid |

---

## Variables

| Variable | Description |
|---|---|
| `track_name` | Currently playing track name |
| `artist_name` | Artist name |
| `album_name` | Album name |
| `playlist_name` | Current playlist name (if in a playlist) |
| `position_ms` | Playback position in milliseconds |
| `duration_ms` | Track duration in milliseconds |
| `position_hms` | Position as HH:MM:SS |
| `duration_hms` | Duration as HH:MM:SS |
| `time_remaining_hms` | Time remaining as HH:MM:SS |
| `position_s` | Position in seconds |
| `duration_s` | Duration in seconds |
| `volume` | Current volume 0-100 |
| `shuffle_state` | true / false |
| `repeat_mode` | off / track / context |
| `device_name` | Active device name |
| `device_type` | Active device type |
| `is_liked` | true if current track is liked |
| `next_track_name` | Next track in queue |
| `next_track_artist` | Next track artist |
| `api_status` | ok / warning / error |
| `display_all` | Cycling display: track / artist / album |
| `display_track_artist` | Cycling display: track / artist |
| `display_track_playlist` | Cycling display: track / playlist |

---

## Feedbacks

| Feedback | Description |
|---|---|
| Playback State | True when player is in chosen state (Playing/Paused/Stopped) |
| Is Playing | True when any track is playing |
| Shuffle State | True when shuffle matches chosen state |
| Repeat Mode | True when repeat matches chosen mode |
| Track Match | True when a specific track URI is playing |
| Track Liked | True when current track is in Liked Songs |
| Bookmark Exists | True when a bookmark slot has a saved position |
| API Healthy | True when the Spotify Web API is reachable |
| Album Art (per grid slot) | Renders album art image on the button |

---

## Features

**Cue-point playback** - Start a track at an exact timestamp. Ideal for live show cues where you need to start mid-track.

**Bookmarks** - Save and resume named playback positions across multiple independent slots. Bookmark Resume restores track, position, and playlist/album context so next/prev continue from the right place.

**Volume fades** - Fade in/out with configurable duration. The Play Fade In action is a single combined action (set volume to 0, play, then fade up) to avoid race conditions when actions run in parallel.

**Album art grids** - Render album art across 1x1, 2x2, or 3x3 button grids. Press any grid button to play/pause.

**Cycling display** - Rotate between track/artist/playlist info on a single button at a configurable speed (set in module config).

**AppleScript offline fallback (macOS only)** - If the Spotify Web API becomes unreachable (no internet, firewall, etc.), the module automatically switches to local AppleScript control after ~6 seconds. Transport controls (play, pause, next, previous, seek, volume, shuffle, repeat) keep working. Actions that require the internet (Play by URI, Play Playlist, Add to Queue, Like/Unlike, Bookmark Resume) log a warning and do nothing. The module switches back to the Web API automatically when connectivity returns.

---

## Tips

- **Nothing working?** Make sure Spotify is open and has played at least once on your target device. Devices that have never played return "no active device" errors.
- **Buttons stop mid-show?** The Spotify app may have gone idle. Hit play manually once and Companion will reconnect within 2 seconds.
- **Re-authenticate if** you changed your Spotify password, or the module shows a red connection error that does not clear automatically.
- **Bookmark resume** briefly starts from the beginning of the track before jumping to the saved position. This is a Spotify API limitation (position_ms is ignored on context plays).
