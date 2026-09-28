# Development

Requires Node.js 20+.

```sh
npm install
npm run dev     # http://localhost:3000, restarts on changes
npm test        # unit, HTTP and add-on packaging tests (Node's built-in test runner)
```

Open `/#sounds` on the dashboard to hear every sound.

| Variable     | Default           | Purpose                                                  |
|--------------|-------------------|----------------------------------------------------------|
| `PORT`       | `3000`            | Port to listen on                                        |
| `HOST`       | `0.0.0.0`         | Interface to bind                                        |
| `HOST_IP`    | auto-detected     | Address in the QR code, if detection picks the wrong one |
| `STATE_FILE` | `data/state.json` | Where games are saved                                    |
| `LOGO_FILE`  | built-in die logo | Your own logo image (png, jpg, webp, svg)                |

The server doesn't know about Home Assistant: in the add-on, `run.sh` reads the add-on options
with bashio and sets these variables.

## Layout

This folder is a Home Assistant add-on (the files at the top) that contains the app (the rest).

```
config.yaml, Dockerfile, run.sh     Home Assistant add-on
README.md, DOCS.md, CHANGELOG.md    add-on store page, Documentation tab, changelog

src/                      server (Node, no framework)
  server.js               entry point: load config and state, start HTTP, graceful shutdown
  config.js               environment variables
  app.js                  HTTP routes: pages, static files, QR code, API
  game/state.js           state shape, migrations of older saved data, the view sent to screens
  game/actions.js         every game action, validated (the only code that changes state)
  store.js                JSON file storage: debounced, atomic writes
  sse.js                  Server-Sent Events hub for live updates
  static.js, network.js   safe static file serving, LAN address detection

public/                   browser (plain ES modules, no build step)
  index.html              start page: continue, new game, past games
  table.html, phone.html  dashboard, phone controls (markup only)
  css/                    base.css (theme, shared components), lobby.css, table.css, phone.css
  img/logo.svg            app logo and browser icon; icon-*.png home-screen icons
  media/wake.*            tiny silent video that keeps the screen on over plain http
  manifest.webmanifest    web app manifest (home screen opens full screen)
  js/shared/              rules.js (also used by the server), api, dialog, dom, format, games, screen, storage;
                          device-check.js (plain script: sends phones to /join, keeps tablets and TVs)
  js/lobby/               start page
  js/table/               dashboard: main, board, sizing, dialogs,
                          announcer (situations, pure) + lines (texts) + ticker (UI), sounds
  js/phone/               phone controls

test/                     node:test suites
```

## How it works

**Data flow.** Screens send actions (`POST /api/actions`, e.g. `{ "type": "changeLevel",
"playerId": "…", "delta": 1 }`). The server validates and applies the action, saves, and
broadcasts the new view to every screen over `GET /api/events` (Server-Sent Events).
Screens never change state locally; they only render the latest view.

**Actions:** `addPlayer`, `removePlayer`, `renamePlayer`, `setEmoji`, `changeLevel`, `setLevel`,
`changeGear`, `die`, `newGame`, `switchGame`, `deleteGame`. See `src/game/actions.js`.

**Saved data** is versioned (`schema`). `normalizeState` upgrades older files on load, so
updates never lose games.

**Updates while a page is open:** every view carries the app version; a page that sees a new
version reloads itself.

**Paths are relative** (`api/actions`, `css/…`), so the app also works in the Home Assistant
sidebar, which serves it under `/api/hassio_ingress/<token>/`.

## Releasing a new version

1. Bump `version` in **both** `config.yaml` and `package.json` (a test fails if they differ).
2. Add an entry at the top of `CHANGELOG.md`.
3. Run `npm test`, then commit and push. Home Assistant shows the update in the add-on store.

Games are kept in the add-on's `/data` folder across updates.

## Store images

`icon.png` (128×128) and `logo.png` (250×100) are what Home Assistant shows in the add-on store.
They are rendered from `public/img/logo.svg` and `art/store-logo.svg`; after changing either, run:

```sh
docker run --rm -v "$PWD:/addon" -w /addon alpine:3.20 sh art/render.sh
```

**Keeping the screen on:** `js/shared/screen.js` uses the Wake Lock API where the browser allows it
(https or localhost). On plain http, which is how tablets reach the add-on at home, it loops the tiny
silent video in `public/media/` instead (regenerate it with `art/wake-video.sh`). Safari only plays
video from servers that support byte ranges, which `src/static.js` does.

## Testing the add-on image locally

```sh
docker build --build-arg BUILD_ARCH=amd64 -t munchkin-counter .    # BUILD_FROM defaults to the Home Assistant base image
docker run --rm -p 3000:3000 -v munchkin-data:/data \
  --add-host supervisor:127.0.0.1 -e HOST_IP=192.168.1.50 munchkin-counter
```

`run.sh` reads the add-on options from the Home Assistant Supervisor. Outside Home Assistant there
is none, so `--add-host` makes that lookup fail fast (it logs two harmless errors), and `HOST_IP`
is passed directly instead.
