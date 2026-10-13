# Munchkin Counter Add-on Documentation

This add-on runs a level counter for the Munchkin card game on your home network.

## Configuration

**host_ip** (string, optional)
- The address shown in the QR code that phones scan
- Leave it empty: the address is detected automatically. Set it only if the QR code shows the wrong address, e.g. `192.0.2.10`

**ssl** (true / false, default false), **certfile** (default `fullchain.pem`), **keyfile** (default `privkey.pem`)
- Turn **ssl** on to use Home Assistant's own certificate (for example from Let's Encrypt or DuckDNS) on the secure
  address, instead of the add-on's self-made one. Browsers trust it, so there's no warning, and Android can install
  the app (see [Install as an app on Android](#install-as-an-app-on-android))
- **certfile** and **keyfile** are the certificate and key in Home Assistant's `ssl` folder. Only the file name counts,
  so the paths from Home Assistant's own HTTP settings work as they are (e.g. `../../ssl/fullchain.pem`)
- If a file isn't there, the add-on says so in its log and uses its self-made certificate

**domain** (string, optional)
- The name the certificate is for, e.g. `ha.example.com`: the secure address is shown with it
  (`https://ha.example.com:3443/`). A certificate for a name only works when the page is opened by that name

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
If a tablet or TV ever shows the phone controls by mistake, open it once with `?dashboard` at the end of the
address (e.g. `http://<homeassistant-ip>:3000/?dashboard`); it remembers. Use `?auto` to undo.

### Rules

- **Level** 1–10. Tap a number on the level track to jump straight to it. Level 10 wins.
- **Gear** can go up or down (negative gear means cursed).
- **Strength** = Level + Gear.
- **💀 Died**: you keep your level but lose all your gear.
- **♂ / ♀ Sex**: every character is male or female, which some cards check. Pick it when adding a player
  (on the dashboard or when joining from your phone). Tap ♂ / ♀ next to the name to switch it later, e.g.
  after a Change Sex curse. It carries over when a new game keeps the same players.
- **Avatar**: every player gets a character token (races, classes, monsters and dungeon loot). Tap yours on
  the phone to pick another.
- **New game** (on the start page) adds a game to the list. Old games are kept and can be reopened or deleted.

### Activity log

Every game keeps a log of what happened: players joining or being removed, avatar and sex changes,
level and gear changes, and deaths, each with the time and whether it came from the tablet or a phone.
Open it with 📜 in the dashboard's top bar. It updates live while open.
Quick taps in a row in the same direction are shown as one change; going up and back down shows both.
The newest 500 entries are kept per game.

### Game report

Tap 📈 in the dashboard's top bar, or next to any game on the start page, to see the whole game as a chart: every
player's level over time, with 💀 where someone died, who won and how long it took, and a table of each player's
final and highest level and deaths. Touch or hover the chart to see everyone's level at that moment.

On a phone, tap 📈 next to **💀 I died** for a simpler version: your own line in color over everyone else's in gray,
and the standings as a list. It's built from the activity log, so in a very long game only the newest 500 changes are shown.

### Sound

The dashboard plays a sound for a win, a death, someone reaching level 9, someone stuck at level 1,
negative gear, and level changes. Tap the screen once after opening it (browsers only allow sound after a tap).
Use the 🔊 button to mute. Add `#sounds` to the end of the address to hear every sound.

## Screen always on, and full screen

- **Always on:** while the start page or dashboard is open, the screen doesn't dim or lock. It starts with the first tap
  (browsers require one). Phones are left alone to save their battery.
- **Android tablets:** open the secure address `https://<homeassistant-ip>:3443/`.
  Android browsers only allow keeping the screen on for secure pages. The add-on makes its own certificate, so the
  browser warns that it isn't trusted: tap **Advanced → Proceed**. The browser remembers this for a while; if the
  NUC's address changes, the add-on makes a new certificate and the browser asks once more.
  With the **ssl** option there's no warning: open `https://<domain>:3443/` instead.
- **Full screen:** tap the ⛶ button in the top bar (or the top-right corner of the start page). It stays full screen
  when you move between the start page and the dashboard. Tap it again, or press Esc, to leave.
- **Like an app:** use **Add to Home Screen** in the tablet's browser menu (on an iPad: Share → Add to Home Screen).
  It then opens full screen from its own icon. On Android, see below.

For a tablet that stays on the table for hours, also check its own settings: set the screen timeout to the longest
value (Android: Settings → Display → Screen timeout; iPad: Settings → Display & Brightness → Auto-Lock → Never)
and keep it plugged in.

## Install as an app on Android

Android browsers only install a web app from a page whose certificate they trust. The add-on's self-made one
isn't, so they offer only a shortcut that opens in a browser tab. With a domain and a certificate for it, which
Home Assistant often already has (Let's Encrypt, DuckDNS):

1. In the add-on's configuration, turn on **ssl**, set **certfile** and **keyfile** to the certificate and key
   (the same files as in Home Assistant's HTTP settings) and **domain** to its name. Restart the add-on
2. Check that at home the domain leads to Home Assistant's local address: open `https://<domain>:3443/` on the
   tablet. If it doesn't load, add a local DNS entry for the domain pointing to Home Assistant (in your router,
   or with the AdGuard Home add-on's DNS rewrites)
3. In Chrome's menu, choose **Install app** (or **Add to home screen → Install**)

Don't forward port 3443 on your router to make the domain work: everything stays on your home network, and
the app has no login. A renewed certificate is picked up by itself, without restarting the add-on.

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
