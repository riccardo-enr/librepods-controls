import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const MODES = [
    ['off', 'Off'],
    ['anc', 'Noise Cancellation'],
    ['transparency', 'Transparency'],
    ['adaptive', 'Adaptive'],
];

function setMode(mode) {
    Gio.Subprocess.new(['librepods-ctl', `noise:${mode}`], Gio.SubprocessFlags.NONE);
}

// ponytail: BlueZ Battery1 only; AirPods often omit it - switch to a status reply from librepods when upstream has one
function readAirPods() {
    try {
        const bus = Gio.DBus.system;
        const res = bus.call_sync('org.bluez', '/', 'org.freedesktop.DBus.ObjectManager',
            'GetManagedObjects', null, null, Gio.DBusCallFlags.NONE, 1000, null);
        const objs = res.recursiveUnpack()[0];
        for (const ifaces of Object.values(objs)) {
            const dev = ifaces['org.bluez.Device1'];
            if (dev?.Connected && /airpods/i.test(`${dev.Name ?? ''} ${dev.Alias ?? ''}`)) {
                const bat = ifaces['org.bluez.Battery1'];
                return {battery: bat ? `${bat.Percentage}%` : null};
            }
        }
    } catch (_e) { /* bluez unavailable */ }
    return null;
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'LibrePods');
        this.add_child(new St.Icon({icon_name: 'audio-headphones-symbolic', style_class: 'system-status-icon'}));
        this._battery = new PopupMenu.PopupMenuItem('Battery: unknown', {reactive: false});
        this.menu.addMenuItem(this._battery);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        for (const [mode, label] of MODES)
            this.menu.addAction(label, () => setMode(mode));
        this.menu.connect('open-state-changed', (_m, open) => {
            if (open)
                this._battery.label.text = `Battery: ${readAirPods()?.battery ?? 'unknown'}`;
        });
    }
});

export default class LibrePodsExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        const update = () => { this._indicator.visible = readAirPods() !== null; };
        update();
        this._sub = Gio.DBus.system.signal_subscribe('org.bluez',
            'org.freedesktop.DBus.Properties', 'PropertiesChanged', null,
            'org.bluez.Device1', Gio.DBusSignalFlags.NONE, update);
    }

    disable() {
        if (this._sub)
            Gio.DBus.system.signal_unsubscribe(this._sub);
        this._sub = null;
        this._indicator?.destroy();
        this._indicator = null;
    }
}
