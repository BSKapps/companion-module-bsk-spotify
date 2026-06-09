# companion-module-bsk-spotify

Bitfocus Companion module that controls Spotify through the Spotify Web API, built for live show use. Requires Spotify Premium and a free Spotify Developer app.

## Features

- Transport, volume, shuffle, and repeat control
- Play a track or playlist/album from an exact timestamp, for show cues
- Bookmarks: save a track + position + context to a named slot and resume it later
- Volume fades, including a combined play-with-fade-in action
- Album art rendered across 1x1, 2x2, or 3x3 button grids
- Cycling display variables that rotate track / artist / album on one button
- Automatic Spotify launch when no device is active
- Offline fallback on macOS: transport control continues via AppleScript when the Web API is unreachable, and switches back when connectivity returns
- API health feedback and status variable

See [companion/HELP.md](companion/HELP.md) for the full list of actions, variables, and feedbacks.

## Setup

1. Create a Spotify Developer app at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Add `http://127.0.0.1:4115/callback` as a Redirect URI
3. Add the connection in Companion and enter the Client ID and Client Secret
4. Open `http://127.0.0.1:4115/auth` in your browser and log in to Spotify

A walkthrough with screenshots is at [bskapps.com/resources/companion](https://bskapps.com/resources/companion/).

## Known limitations

- Spotify ignores `position_ms` when starting playback inside a playlist or album ([web-api#901](https://github.com/spotify/web-api/issues/901)), so bookmark resume briefly plays from 0:00 before seeking. This cannot be fixed in the module.
- The Web API controls playback but cannot drive the Spotify app's interface, so the app window may show stale state after a context play.

## Development

```
yarn
yarn build
yarn test
```

## License

MIT
