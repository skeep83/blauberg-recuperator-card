# Blauberg Recuperator Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/skeep83/blauberg-recuperator-card?style=for-the-badge)](https://github.com/skeep83/blauberg-recuperator-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A premium **neumorphic** Home Assistant custom card for [Blauberg](https://blaubergventilatoren.de/) / Siku wall-mounted recuperators with **multi-device support** — control up to 5 recuperators from a single card.

<p align="center">
  <img src="preview.png" alt="Blauberg Recuperator Card" width="420"/>
</p>

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌀 **Animated Fan** | SVG fan blades spin when active — speed proportional to RPM |
| 🔄 **Multi-Device** | Switch between up to 5 recuperators via tabs |
| 📊 **Sensor Dashboard** | Humidity, mode, boost, alarm, filter timer, timer |
| 🎛️ **Speed Control** | Adjust fan speed with ± buttons |
| 🎉 **Quick Actions** | Party mode, sleep mode, reset filter alarm |
| 🌗 **Auto Dark Mode** | Follows HA theme / `prefers-color-scheme` |
| ⚙️ **Visual Editor** | Full GUI configuration — no YAML needed |
| 🎨 **Neumorphic Design** | Matches [Altal Heater Card](https://github.com/skeep83/altal_heater_card) style |

## 📦 Installation

### HACS (Recommended)

1. Open **HACS** → **Frontend** → ⋮ → **Custom repositories**
2. Add `https://github.com/skeep83/blauberg-recuperator-card` as **Dashboard**
3. Search for and install **Blauberg Recuperator Card**
4. Restart Home Assistant

### Manual

1. Download `blauberg-recuperator-card.js` from the [latest release](https://github.com/skeep83/blauberg-recuperator-card/releases/latest)
2. Copy to `config/www/community/blauberg-recuperator-card/`
3. Add resource in HA:
   - **URL:** `/local/community/blauberg-recuperator-card/blauberg-recuperator-card.js`
   - **Type:** JavaScript Module

## 🚀 Usage

### Single Device

```yaml
type: custom:blauberg-recuperator-card
devices:
  - name: Рекуператор
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

### Multiple Devices (up to 5)

```yaml
type: custom:blauberg-recuperator-card
devices:
  - name: Спальня
    fan_entity: fan.recuperator_bedroom
    sensor_alarm: sensor.alarm_bedroom
    sensor_boost_mode: sensor.boost_bedroom
    sensor_filter_timer: sensor.filter_timer_bedroom
    sensor_humidity: sensor.humidity_bedroom
    sensor_mode: sensor.mode_bedroom
    sensor_rpm: sensor.rpm_bedroom
    sensor_timer: sensor.timer_bedroom
    button_party: button.party_bedroom
    button_reset_filter: button.reset_filter_bedroom
    button_sleep: button.sleep_bedroom
    sensor_firmware: sensor.firmware_bedroom
    sensor_version: sensor.version_bedroom

  - name: Гостиная
    fan_entity: fan.recuperator_living
    sensor_alarm: sensor.alarm_living
    # ... (same fields)

  - name: Кухня
    fan_entity: fan.recuperator_kitchen
    # ... (same fields)
```

## ⚙️ Configuration Options

### Device Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | ✅ | Display name for the device tab |
| `fan_entity` | string | ✅ | Main fan entity (fan.xxx) |
| `sensor_humidity` | string | ❌ | Humidity sensor |
| `sensor_mode` | string | ❌ | Operating mode sensor |
| `sensor_boost_mode` | string | ❌ | Boost mode sensor |
| `sensor_alarm` | string | ❌ | Alarm sensor |
| `sensor_filter_timer` | string | ❌ | Filter timer countdown |
| `sensor_rpm` | string | ❌ | Fan RPM sensor |
| `sensor_timer` | string | ❌ | Timer countdown |
| `button_party` | string | ❌ | Party mode button |
| `button_reset_filter` | string | ❌ | Reset filter alarm button |
| `button_sleep` | string | ❌ | Sleep mode button |
| `sensor_firmware` | string | ❌ | Firmware version sensor |
| `sensor_version` | string | ❌ | Device version sensor |

### Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_controls` | boolean | `true` | Show fan dial and speed controls |
| `compact` | boolean | `false` | Compact card layout |
| `text_color` | string | — | Custom text color (CSS) |
| `animation_color` | string | — | Custom accent color (CSS) |

## 🛠️ Build from Source

```bash
git clone https://github.com/skeep83/blauberg-recuperator-card.git
cd blauberg-recuperator-card
npm install
npm run build
```

Output: `dist/blauberg-recuperator-card.js`

## 🔗 Related

- [Siku Integration](https://github.com/hmn/siku-integration) — Required HA integration for Siku/Blauberg recuperators
- [Altal Heater Card](https://github.com/skeep83/altal_heater_card) — Neumorphic card for Altal heat pumps (same design language)

## 📄 License

MIT © 2026
