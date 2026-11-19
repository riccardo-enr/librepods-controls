# LibrePods Controls

GNOME Shell panel indicator for AirPods: noise control (Off, Noise
Cancellation, Transparency, Adaptive) and battery level. Mode changes are sent
with `librepods-ctl noise:<mode>`; battery is read from BlueZ `Battery1`.

Targets GNOME Shell 50 and 51.

## Requirements

- `librepods` and `librepods-ctl` on `PATH`, with `librepods` running
- BlueZ, with the AirPods paired and connected

## Install

Symlink the project into the extensions directory:

```sh
ln -s "$PWD" ~/.local/share/gnome-shell/extensions/librepods@local
```

The directory name must equal the `uuid` in `metadata.json`.

## Enable

GNOME Shell only scans for new extensions at startup:

- Wayland: log out and back in.
- X11: press `Alt+F2`, type `r`, press Enter.

Then:

```sh
gnome-extensions enable librepods@local
```

Check with `gnome-extensions info librepods@local`. Errors show up in
`journalctl -f -o cat /usr/bin/gnome-shell`.

For development without logging out, run a nested session:

```sh
dbus-run-session gnome-shell --devkit
```

## Usage

The headphones icon appears in the top bar only while AirPods are connected
(matched by name or alias containing "airpods"). Click it. The menu shows the battery level
(refreshed each time it opens) and the four noise modes.

## Limitations

- Battery comes from BlueZ `Battery1` only. AirPods often do not expose it, so
  it can read `unknown`.
- No error feedback if `librepods-ctl` fails.
