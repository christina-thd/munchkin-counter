# Munchkin Counter

A level counter for the Munchkin card game, as a Home Assistant add-on.

A tablet (or TV) shows every player at the table, and each player controls their own
level and gear from their phone by scanning a QR code. Munchkin rules are built in,
with an announcer, sound effects and a game history.

## Installation

Add this repository to Home Assistant:

1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Click menu (⋮) → **Repositories**
3. Add: `https://github.com/christina-thd/munchkin-counter`
4. Install **Munchkin Counter** from the store

## Add-ons

### Munchkin Counter

Tablet dashboard and phone controls for Munchkin, over your home network.

**Features:**
- Dashboard for up to 6 players on one screen, phones join by QR code
- Levels 1–10, gear, strength, and Munchkin death rules
- Munchkin-style announcer and sound effects

[Documentation →](./munchkin-counter/README.md)

## Development

The app is plain Node.js with no build step. See
[munchkin-counter/docs/DEVELOPMENT.md](./munchkin-counter/docs/DEVELOPMENT.md).

```sh
cd munchkin-counter
npm install
npm test
npm run dev
```

## Support

For issues, check the add-on logs or open an issue in this repository.

Munchkin is a trademark of Steve Jackson Games. This is an unofficial fan project, not affiliated with or endorsed by Steve Jackson Games.
