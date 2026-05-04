# companion-module-bsk-spotify

Bitfocus Companion module for Spotify Web API control. Full-featured Spotify controller with cue-point playback, bookmarks, volume fades, and album art — designed for live show use.

Requires Spotify Premium and a Spotify Developer app (free to create).

## Features

- **Cue-point playback** — start a track at an exact timestamp (M:SS:ms), ideal for live show cues
- **Bookmarks** — save and resume named playback positions; multiple independent bookmark slots
- **Volume fades** — fade in/out with configurable duration; combined playFadeIn action avoids race conditions
- **Album art grids** — render album art across 1x1, 2x2, or 3x3 button grids; press to play/pause
- **Cycling display** — rotate between track/artist/playlist info on a single button at configurable speed
- **Playlist name** — dedicated variable for current playlist name, lazily fetched and cached
- **Auto-launch Spotify** — opens Spotify automatically if no active device is found
- **Smart Shuffle support** — works around Spotify's double-call requirement for Smart Shuffle
- **API health feedback** — status variable and feedback for API connectivity
- ~98 presets across 15 categories

## Requirements

- Spotify Premium account
- Spotify Developer app (create at [developer.spotify.com](https://developer.spotify.com))
- Redirect URI set to `http://127.0.0.1:4115/callback` in your Spotify app settings

## Setup

1. Create a Spotify Developer app at [developer.spotify.com](https://developer.spotify.com)
2. Add `http://127.0.0.1:4115/callback` as a Redirect URI
3. In Companion, add the BSK Spotify connection
4. Enter your Client ID and Client Secret, then click Authenticate
5. Complete the OAuth flow in your browser

## Actions

| Category | Actions |
|---|---|
| Playback | Play, Pause, Play/Pause toggle, Next, Previous, Seek |
| Volume | Set volume, Fade in, Fade out, playFadeIn (combined) |
| Shuffle | Enable, Disable, Toggle |
| Repeat | Off, Track, Context, Cycle |
| Playlist | Play playlist, Play playlist track by number |
| Timestamp Cue | Play track from exact timestamp |
| Bookmark | Save, Resume, Toggle, Clear |
| Album Art | Display 1x1, 2x2, 3x3 grid |
| Device | Transfer playback to device |
| Queue | Add track to queue |
| Like | Like/unlike current track |

## Variables

Track info, position, duration, shuffle/repeat state, playlist name, API health, 3 cycling display variants, and more. 32 variables total.

## Feedbacks

Playing, paused, shuffle on/off, repeat mode, track match, liked, bookmark exists, API healthy, album art (per grid slot). 13 feedbacks total.

## Known Limitations

- **Bookmark resume blip** — Spotify's Web API ignores `position_ms` on context plays ([web-api#901](https://github.com/spotify/web-api/issues/901)). There is a ~1-2 second blip from 0:00 before the seek lands. This is a Spotify API limitation and cannot be fixed in the module.
- **Spotify app UI** — the Web API controls playback but cannot navigate the Spotify app's visual interface. The app may show stale state after a context play.

## License

MIT
