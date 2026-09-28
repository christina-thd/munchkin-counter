# Munchkin Counter Add-on Documentation

This add-on runs a level counter for the Munchkin card game on your home network.

## Configuration

**host_ip** (string, optional)
- The address shown in the QR code that phones scan
- Leave it empty: the address is detected automatically. Set it only if the QR code shows the wrong address, e.g. `192.168.1.99`

## Usage

1. Install and start the add-on
2. On the tablet or TV, open:
```
   http://<homeassistant-ip>:3000/
```
   or use **Munchkin** in the Home Assistant sidebar. The start page lets you continue the current game,
   start a new one, or reopen a past game. Tap the game name in the top bar to come back to it.
3. Players scan the QR code in the top-right corner of the dashboard (tap it to enlarge), then pick or create their player

Phones connect straight to port 3000, so they don't need a Home Assistant login.
The dashboard is for tablets and TVs only: opening it on a phone goes to the phone controls instead.

### Rules

- **Level** 1–10. Tap a number on the level track to jump straight to it. Level 10 wins.
- **Gear** can go up or down (negative gear means cursed).
- **Strength** = Level + Gear.
- **💀 Died**: you keep your level but lose all your gear.
- **New game** (on the start page) adds a game to the list. Old games are kept and can be reopened or deleted.

### Sound

The dashboard plays a sound for a win, a death, someone reaching level 9, someone stuck at level 1,
negative gear, and level changes. Tap the screen once after opening it (browsers only allow sound after a tap).
Use the 🔊 button to mute. Add `#sounds` to the end of the address to hear every sound.

## Custom logo

To show your own logo in the top bar, on the start page and as the browser icon:

1. Open the **share** folder of Home Assistant (for example with the Samba share add-on: `\\<homeassistant-ip>\share`)
2. Create a folder `munchkin-counter` and put your image in it as `logo.png` (or `logo.jpg`, `logo.webp`, `logo.svg`).
   A square image of at least 256×256 pixels looks best.
3. Restart the add-on

Delete the file and restart to go back to the built-in logo.

## Data

Games are saved in the add-on's data folder, so they survive restarts and updates.

## Support

For issues, please check the add-on logs in Home Assistant.
