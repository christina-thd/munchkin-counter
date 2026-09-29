# Changelog

## 2.5.0
- Secure address `https://<homeassistant-ip>:3443` so Android tablets keep the screen on (the add-on makes its own certificate)
- Download the certificate at `/munchkin-counter.crt` to install it on a tablet and skip the browser warning

## 2.4.1
- Fix: TVs showed the phone controls instead of the dashboard
- Open the app once with `?dashboard` to keep any device on the dashboard (`?auto` to undo)

## 2.4.0
- The tablet or TV screen stays on while the start page or dashboard is open
- Full-screen button on the start page and the dashboard; stays full screen when moving between them
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
- Logo in the top bar, on the start page and as the browser icon
- The game name in the top bar goes back to the start page

## 2.1.0
- Packaged like the other add-ons: Home Assistant base image, `run.sh` with bashio
- Install and update from the add-on store
- Supports aarch64, amd64, armhf, armv7 and i386

## 2.0.0

Rebuilt with a proper project structure.

- Server split into modules: game rules, state and migrations, file storage, live updates, HTTP routes.
- Games are saved atomically, so a power cut can't corrupt them
- Every action is validated; bad requests get a clear error.
- Browser code split into modules; styles shared between the dashboard and phones.
- Automated tests for the game rules, saved-data migration, the announcer and the HTTP API.
- Pages reload themselves after an update
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
