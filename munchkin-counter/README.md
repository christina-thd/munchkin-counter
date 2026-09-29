# Munchkin Counter Add-on

Level counter for the Munchkin card game. A tablet (or TV) shows every player at the table,
and each player controls their own level and gear from their phone by scanning a QR code.

## Features

- Dashboard for tablets and TVs: level, gear and strength for up to 6 players on one screen
- Phone controls: players join by QR code, no app or login needed
- Munchkin rules built in: levels 1–10, death keeps your level but loses your gear
- Announcer with Munchkin-style table talk and sound effects
- Start page: continue the current game, start a new one, or reopen a past game
- Activity log per game: who changed what, when, from the tablet or a phone
- Live updates on every screen
- Screen stays on (secure address for Android tablets), full-screen button, and "Add to Home Screen" as an app
- Also available in the Home Assistant sidebar
- Multi-architecture support

## Installation

1. Add this repository to Home Assistant, or copy this directory to your Home Assistant `/addons` folder
2. Refresh the add-on store
3. Install the "Munchkin Counter" add-on
4. Start it, and turn on "Show in sidebar" if you like

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| host_ip | str | (auto) | Address shown in the QR code. Only set it if the QR code shows the wrong address |

## Usage

- Tablet or TV: open `http://<your-homeassistant-ip>:3000/`
- Phones: scan the QR code in the top-right corner of the dashboard

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Munchkin is a trademark of Steve Jackson Games. This is an unofficial fan project, not affiliated with or endorsed by Steve Jackson Games.
