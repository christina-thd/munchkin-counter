# Changelog

## 2.3.1
- Start page: games show only their date and number of players

## 2.3.0
- Logo: a bouncier, more playful M wearing a little horned helmet
- Use your own logo: put `logo.png` in the `share` folder under `munchkin-counter/` (see Documentation)

## 2.2.0
- Start page: continue the current game, start a new one, or reopen and delete past games
- Logo in the top bar, on the start page and as the browser icon
- The game name in the top bar goes back to the start page

## 2.1.0
- Packaged like the other add-ons in this repository: Home Assistant base image, `run.sh` with bashio
- Install and update from the add-on store (no more copying files)
- Supports aarch64, amd64, armhf, armv7 and i386

## 2.0.0

Rebuilt with a proper project structure. Looks and plays the same.

- Server split into modules: game rules, state and migrations, file storage, live updates, HTTP routes.
- Games are saved atomically, so a power cut can't corrupt them; an unreadable file is kept aside instead of lost.
- Every action is validated; bad requests get a clear error.
- Browser code split into modules; styles shared between the dashboard and phones.
- Automated tests for the game rules, saved-data migration, the announcer and the HTTP API.
- Pages reload themselves after an update, so an open tablet never runs old code.
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
