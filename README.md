# Blauberg Recuperator Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Neumorphic Home Assistant custom card for **Blauberg wall-mounted recuperators** (Siku/Blauberg fans).

![Preview](https://raw.githubusercontent.com/skeep83/blauberg-recuperator-card/main/screenshots/card-preview.png)

## Features

- 🌀 **Animated SVG fan** — spins when active, speed proportional to RPM
- 📊 **Sensor dashboard** — humidity, mode, boost, alarm, filter timer, timer countdown
- 🎛️ **Speed control** — adjust fan speed with +/- buttons
- 🎉 **Quick actions** — party mode, sleep mode, reset filter alarm
- 🌙 **Dark mode** — automatic support via `prefers-color-scheme`
- ⚙️ **Config editor** — full GUI configuration in HA UI
- 🎨 **Neumorphic design** — premium soft-shadow aesthetic

## Installation

### HACS (Recommended)

1. Open HACS → Frontend → Custom repositories
2. Add `https://github.com/skeep83/blauberg-recuperator-card` as **Lovelace**
3. Install **Blauberg Recuperator Card**
4. Restart Home Assistant

### Manual

1. Download `blauberg-recuperator-card.js` from [Releases](https://github.com/skeep83/blauberg-recuperator-card/releases)
2. Copy to `config/www/community/blauberg-recuperator-card/`
3. Add resource in HA: Settings → Dashboards → Resources →
   `/local/community/blauberg-recuperator-card/blauberg-recuperator-card.js` (JavaScript Module)

## Usage

```yaml
type: custom:blauberg-recuperator-card
```

### Full configuration

```yaml
type: custom:blauberg-recuperator-card
title: Blauberg Recuperator
subtitle: 192.168.1.41
fan_entity: fan.siku_blauberg_fan_192_168_1_41
sensor_alarm: sensor.alarm
sensor_boost_mode: sensor.boost_mode
sensor_filter_timer: sensor.filter_timer_countdown
sensor_humidity: sensor.humidity
sensor_mode: sensor.mode
sensor_rpm: sensor.rpm
sensor_timer: sensor.timer_countdown
button_party: button.party_mode_2
button_reset_filter: button.reset_filter_alarm_2
button_sleep: button.sleep_mode_2
sensor_firmware: sensor.firmware_version
sensor_version: sensor.version
```

## Development

```bash
npm install
npm run build     # → dist/blauberg-recuperator-card.js
npm run dev       # watch mode
```

## License

MIT
