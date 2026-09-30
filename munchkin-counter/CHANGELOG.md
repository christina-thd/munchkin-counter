# Changelog

## 2.6.3
- The app logo is used as the icon when adding the app to the home screen of a phone or tablet (instead of a plain letter)
- Also on the secure address (port 3443), where the tablet doesn't trust the add-on's own certificate
- iPhone and iPad: the home-screen icon has the app's dark background instead of white

## 2.6.2
- Fix fullscreen mode

## 2.6.1
- Safer https certificate: a plain server certificate that can't vouch for other websites (replaces the old one
  automatically, so the tablet asks to accept it once more)
- The certificate is no longer offered for download
- The start page no longer shows the note pointing Android tablets to the secure address
- Activity log: opens from the dashboard only (no longer from the start page)
- Activity log: quick taps are grouped only in the same direction, so going up and back down shows both changes

## 2.6.0
- Activity log for every game: who changed what, when, and from the tablet or a phone
- Open it with 📜 in the dashboard's top bar, or for any game on the start page
- Quick taps in a row show as one change ("level 3 → 6")

## 2.5.0
- Secure address `https://<homeassistant-ip>:3443` so Android tablets keep the screen on (the add-on makes its own certificate)
- Start page on an Android tablet points to the secure address

## 2.4.1
- Fix: TVs showed the phone controls instead of the dashboard
- Open the app once with `?dashboard` to keep any device on the dashboard (`?auto` to undo)

## 2.4.0
- The tablet or TV screen stays on while the start page or dashboard is open
- Full-screen button on the start page and the dashboard
- "Add to Home Screen" opens the app full screen, with its own icon

## 2.3.3
- Add-on icon and logo in the Home Assistant store

## 2.3.2
- Fix: install failed on newer Home Assistant ("base name ($BUILD_FROM) should not be blank")

## 2.3.1
- Start page: games show only their date and number of players

## 2.3.0
- Create logo
- Use your own logo: put `logo.png` in the `share` folder under `munchkin-counter/` (see Documentation)

## 2.2.0
- Start page: continue the current game, start a new one, or reopen and delete past games
- The game name in the top bar goes back to the start page

## 2.1.0
- Packaged like the other add-ons: Home Assistant base image, `run.sh` with bashio
- Install and update from the add-on store
- Supports aarch64, amd64, armhf, armv7 and i386

## 2.0.0

Rebuilt with a proper project structure

- Server split into modules: game rules, state and migrations, file storage, live updates, HTTP routes.
- Games are saved atomically, so a power cut can't corrupt them.
- Every action is validated; bad requests get a clear error.
- Browser code split into modules; styles shared between the dashboard and phones.
- Automated tests for the game rules, saved-data migration, the announcer and the HTTP API.
- Pages reload themselves after an update.
- Older saved games are migrated automatically.

## 1.8.0

- Announcer messages stay 30 seconds.

## 1.7.0

- Announcer rewritten in Munchkin style, about 80 lines, no repeats until a situation's lines are used up.

## 1.6.0

- Phones can't open the dashboard; they go to the phone controls.

## 1.5.0

- Sounds when someone gains or loses a level.

## 1.4.0

- Sounds only for death, win, level 9, stuck at level 1 and negative gear.

## 1.0.0

- First Home Assistant add-on release.
