# companion-module-bsk-spotify

Bitfocus Companion module for Spotify Web API control. Full-featured replacement for Tech Ministry Spotify module.

## Commands
- `./deploy.sh` — build + install to Companion modules dir (use this, not npm run build alone)
- `npm test` — run Jest tests (31 tests)
- `npm run build` — webpack build to pkg/ only (no install)

## Deploy
```bash
./deploy.sh
# Then in Companion: disable + re-enable the Spotify connection
```

## Source Files
| File | Purpose |
|---|---|
| `src/main.js` | InstanceBase, poll loop (2s), tick interpolator (500ms), OAuth server, AS fallback |
| `src/spotify.js` | SpotifyClient — all API calls, 401 auto-refresh, 10s timeout, 429/502/503 retry |
| `src/applescript.js` | AppleScriptSpotify — osascript wrapper for offline fallback (macOS only) |
| `src/actions.js` | All action definitions — API call only, state updated on next poll |
| `src/feedbacks.js` | 13 feedbacks — playback, shuffle, repeat, track match, health, bookmark, album art |
| `src/variables.js` | 30 variables - track info, timing, shuffle, repeat, liked, api_status, playlist_name, cycling display variants |
| `src/presets.js` | ~99 presets across 15 categories |
| `src/albumart.js` | jimp-based album art download + grid slicing (1x1, 2x2, 3x3) |
| `src/icons.js` | Base64 icon data for transport icon presets |
| `companion/manifest.json` | Module manifest (id: bsk-spotify, version: 1.0.0) |
| `tests/` | Jest tests for feedbacks, variables, spotify client |

## Key Design Decisions
- Actions make API call only — no optimistic state updates. State syncs on next poll (2s). Avoids play/pause flash caused by stale poll responses overwriting optimistic changes.
- `_apiCall` catches 401, refreshes token, retries once — transparent to all callers
- `tick()` runs every 500ms to interpolate `positionMs` between polls — smooth time display
- Poll lock (`_isPolling`) prevents concurrent overlapping polls
- After 3 consecutive poll failures: on macOS, switches to AppleScript fallback (status = Warning); on other platforms, marks unhealthy (status = ConnectionFailure). Every 10th poll in AS mode (~20s) retries the API to detect recovery and switches back automatically.
- AppleScript fallback (`_useAppleScript` flag): polls via `osascript`, routes transport actions (play/pause/next/prev/seek/volume/shuffle/repeat) through `src/applescript.js`. Internet-only actions (playTrack, playPlaylist, addToQueue, like/unlike, bookmarkResume) log a warning and return. Repeat in AS mode is boolean only — track/context both map to `repeating true`.
- Bookmarks stored in `self.config.bookmarks` — persisted in Companion's SQLite DB
- Bookmark resume: playlist/album contexts use `playContextAtTrackUri` + 1s delay + seek; artist/show/none falls back to direct `playTrack`. The 0:00 blip before seek is a Spotify API limitation (position_ms ignored on context plays) — see GitHub web-api#901
- `playFadeIn` is a single combined action (setVolume 0 + play + fade) because Companion runs preset actions in parallel by default, causing race conditions when split into 3 actions
- Cycling display variables (`display_all`, `display_track_artist`, `display_track_playlist`) all share one global cycle timer driven by `displayCycleSeconds` config (default 2s)
- Playlist name fetched lazily on context change via `/v1/playlists/{id}?fields=name`, cached in `state.playlistName`
- Album art presets have no text, press = play/pause toggle
- OAuth server on port 4115, bound to 127.0.0.1 only, closed after successful auth
- deploy.sh removes all bsk-spotify-* versions before copying — keeps modules dir clean

## Preset Categories
Playback, Transport Icons, Display, Track Info, Volume, Shuffle, Repeat, Toggles, Combo, Playlist, Device, Bookmark, Timestamp Cue, Album Art, Health

## Version
1.0.0 - LOCKED. Do not change until Bitfocus officially accepts the module.

The macOS AppleScript fallback and other improvements committed after v1.0.0 stay on main but are not versioned. Once Bitfocus accepts the module, bump to 1.1.0 and cut a new release that includes these.

## Pending
- Bitfocus submission after user testing
