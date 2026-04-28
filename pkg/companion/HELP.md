# BSK Spotify Web API

Controls Spotify via the Web API. Requires Spotify Premium.

## Setup

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and open your app settings
2. Add `http://127.0.0.1:4115/callback` as a Redirect URI and save
3. Enter your Client ID and Client Secret in the module config
4. Save the config, then visit `http://127.0.0.1:4115/auth` in your browser
5. Log in to Spotify - you will be redirected back and authenticated automatically

## Features

- Play/Pause/Toggle, Next, Previous
- Play Track by ID with optional start position (M:SS)
- Skip forward/back by seconds
- Set Volume, Volume Up/Down
- Shuffle On/Off/Toggle
- Repeat Off/Track/Playlist
- Feedbacks for playback state, shuffle, repeat, and currently playing track
- Variables for track name, artist, album, position, duration, time remaining, volume
