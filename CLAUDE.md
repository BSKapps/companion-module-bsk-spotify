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
| `src/main.js` | InstanceBase, poll loop (2s), tick interpolator (500ms), OAuth server |
| `src/spotify.js` | SpotifyClient — all API calls, 401 auto-refresh, 10s timeout, 429/502/503 retry |
| `src/actions.js` | All action definitions — immediate local state updates after API calls |
| `src/feedbacks.js` | 13 feedbacks — playback, shuffle, repeat, track match, health, bookmark, album art |
| `src/variables.js` | 32 variables — track info, timing, shuffle, repeat, liked, api_status, playlist_name, 3 cycling display variants |
| `src/presets.js` | ~98 presets across 15 categories |
| `src/albumart.js` | jimp-based album art download + grid slicing (1x1, 2x2, 3x3) |
| `src/icons.js` | Base64 icon data for transport icon presets |
| `companion/manifest.json` | Module manifest (id: bsk-spotify, version: 1.0.0) |
| `tests/` | Jest tests for feedbacks, variables, spotify client |

## Key Design Decisions
- All actions immediately update `self.state.*` after API call + call `checkFeedbacks()` — no waiting for next poll
- `_apiCall` catches 401, refreshes token, retries once — transparent to all callers
- `tick()` runs every 500ms to interpolate `positionMs` between polls — smooth time display
- Poll lock (`_isPolling`) prevents concurrent overlapping polls
- After 3 consecutive poll failures, marks unhealthy + updates Companion status banner
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
1.0.0 — LOCKED. Do not change until release.

## Pending
- Public GitHub repo (not yet created)
- Bitfocus submission after user testing
