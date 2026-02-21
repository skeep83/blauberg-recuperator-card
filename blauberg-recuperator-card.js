const EDITOR_FIELDS = [
  { key: "title", label: "Название карточки" },
  { key: "subtitle", label: "Подзаголовок (IP адрес)" },
  { key: "theme", label: "Тема", options: [{ value: "auto", label: "Авто (Системная)" }, { value: "light", label: "Светлая" }, { value: "dark", label: "Темная" }] },
  { key: "fan_entity", label: "Вентилятор", domain: "fan" },
  { key: "sensor_alarm", label: "Тревога", domain: "sensor" },
  { key: "sensor_boost_mode", label: "Буст режим", domain: "sensor" },
  { key: "sensor_filter_timer", label: "Таймер фильтра", domain: "sensor" },
  { key: "sensor_humidity", label: "Влажность", domain: "sensor" },
  { key: "sensor_mode", label: "Режим", domain: "sensor" },
  { key: "sensor_rpm", label: "Обороты (RPM)", domain: "sensor" },
  { key: "sensor_timer", label: "Таймер", domain: "sensor" },
  { key: "button_party", label: "Кнопка: Вечеринка", domain: "button" },
  { key: "button_reset_filter", label: "Кнопка: Сброс фильтра", domain: "button" },
  { key: "button_sleep", label: "Кнопка: Сон", domain: "button" },
  { key: "sensor_firmware", label: "Версия прошивки", domain: "sensor" },
  { key: "sensor_version", label: "Версия устройства", domain: "sensor" }
];
const EDITOR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  :host {
    display: block;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  .editor {
    padding: 16px;
  }

  .editor-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--primary-text-color, #333);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field {
    margin-bottom: 12px;
  }

  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--secondary-text-color, #666);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .field input,
  .field select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #333);
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .field input:focus,
  .field select:focus {
    outline: none;
    border-color: var(--primary-color, #6C63FF);
  }

  .section-divider {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--secondary-text-color, #888);
    margin: 16px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--divider-color, #eee);
  }
`;
class BlaubergRecuperatorCardEditor extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }
  _getEntities(domain) {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).filter((id) => !domain || id.startsWith(`${domain}.`)).sort();
  }
  _valueChanged(key, value) {
    if (!this._config) return;
    const newConfig = { ...this._config, [key]: value };
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  _render() {
    if (!this._hass || !this._config) return;
    let sections = "";
    const textFields = EDITOR_FIELDS.filter((f) => !f.domain);
    sections += textFields.map((f) => {
      if (f.options) {
        const current = this._config[f.key] || "auto";
        const opts = f.options.map(
          (o) => `<option value="${o.value}" ${current === o.value ? "selected" : ""}>${o.label}</option>`
        ).join("");
        return `
            <div class="field">
              <label>${f.label}</label>
              <select data-key="${f.key}">
                ${opts}
              </select>
            </div>
          `;
      }
      return `
          <div class="field">
            <label>${f.label}</label>
            <input type="text" data-key="${f.key}"
                   value="${this._config[f.key] || ""}"
                   placeholder="${f.label}" />
          </div>
        `;
    }).join("");
    const domains = ["fan", "sensor", "button"];
    const domainLabels = {
      fan: "🌀 Вентилятор",
      sensor: "📊 Сенсоры",
      button: "🔘 Кнопки"
    };
    for (const domain of domains) {
      const fields = EDITOR_FIELDS.filter((f) => f.domain === domain);
      if (fields.length === 0) continue;
      sections += `<div class="section-divider">${domainLabels[domain] || domain}</div>`;
      const entities = this._getEntities(domain);
      const options = entities.map((e) => `<option value="${e}">${e}</option>`).join("");
      for (const f of fields) {
        const current = this._config[f.key] || "";
        sections += `
          <div class="field">
            <label>${f.label}</label>
            <select data-key="${f.key}">
              <option value="">— выберите —</option>
              ${options.replace(
          `value="${current}"`,
          `value="${current}" selected`
        )}
            </select>
          </div>
        `;
      }
    }
    this._root.innerHTML = `
      <style>${EDITOR_STYLES}</style>
      <div class="editor">
        <div class="editor-title">🌀 Настройка Blauberg Recuperator</div>
        ${sections}
      </div>
    `;
    this._root.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", (e) => {
        const target = e.target;
        this._valueChanged(target.dataset.key, target.value);
      });
      el.addEventListener("input", (e) => {
        const target = e.target;
        if (target.tagName === "INPUT") {
          this._valueChanged(target.dataset.key, target.value);
        }
      });
    });
  }
}
customElements.define(
  "blauberg-recuperator-card-editor",
  BlaubergRecuperatorCardEditor
);
const DEFAULTS = {
  fan_entity: "fan.siku_blauberg_fan_192_168_1_41",
  sensor_alarm: "sensor.alarm",
  sensor_boost_mode: "sensor.boost_mode",
  sensor_filter_timer: "sensor.filter_timer_countdown",
  sensor_humidity: "sensor.humidity",
  sensor_mode: "sensor.mode",
  sensor_rpm: "sensor.rpm",
  sensor_timer: "sensor.timer_countdown",
  button_party: "button.party_mode_2",
  button_reset_filter: "button.reset_filter_alarm_2",
  button_sleep: "button.sleep_mode_2",
  sensor_firmware: "sensor.firmware_version",
  sensor_version: "sensor.version",
  theme: "auto"
  // 'auto', 'light', 'dark'
};
const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :host {
    --neumo-bg: #E0E5EC;
    --neumo-shadow-dark: #A3B1C6;
    --neumo-shadow-light: #FFFFFF;
    --neumo-shadow-dark-strong: #8C9BAF;
    --neumo-accent: #4A90E2;
    --neumo-accent-glow: rgba(74, 144, 226, 0.4);
    --neumo-success: #43A047;
    --neumo-warning: #FFB74D;
    --neumo-danger: #E53935;
    --neumo-text: #31344B;
    --neumo-text-secondary: #8A98A8;
    --neumo-radius: 12px;
    --neumo-radius-sm: 8px;
    --neumo-font: 'Inter', 'Segoe UI', system-ui, sans-serif;
    --neumo-fan-active: #4A90E2;
    --neumo-fan-idle: #9BA5B5;

    display: block;
    font-family: var(--neumo-font);
  }

  /* ── Card container ───────────────────────────────────────────── */
  .card {
    background: var(--neumo-bg);
    border-radius: 16px;
    padding: 16px;
    box-shadow:
      6px 6px 12px var(--neumo-shadow-dark),
      -6px -6px 12px var(--neumo-shadow-light);
    overflow: hidden;
    position: relative;
  }

  /* ── Header ───────────────────────────────────────────────────── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--neumo-bg);
    box-shadow:
      3px 3px 6px var(--neumo-shadow-dark),
      -3px -3px 6px var(--neumo-shadow-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .header-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--neumo-text);
    letter-spacing: -0.3px;
  }

  .header-subtitle {
    font-size: 11px;
    color: var(--neumo-text-secondary);
    margin-top: 2px;
    font-weight: 500;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--neumo-bg);
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
    transition: all 0.3s ease;
  }

  .header-status.active {
    color: var(--neumo-success);
  }

  .header-status.inactive {
    color: var(--neumo-text-secondary);
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  .header-status.active .status-dot {
    animation: pulse-dot 2s infinite;
    box-shadow: 0 0 6px currentColor;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* ── Fan Hero ─────────────────────────────────────────────────── */
  .fan-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 8px 0 16px;
  }

  .fan-container {
    position: relative;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: var(--neumo-bg);
    box-shadow:
      inset 4px 4px 8px var(--neumo-shadow-dark),
      inset -4px -4px 8px var(--neumo-shadow-light);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .fan-container:hover {
    transform: scale(1.02);
  }

  .fan-container:active {
    transform: scale(0.98);
  }

  .fan-ring {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: all 0.5s ease;
  }

  .fan-ring.active {
    border-color: var(--neumo-accent);
    box-shadow:
      0 0 10px var(--neumo-accent-glow),
      inset 0 0 10px var(--neumo-accent-glow);
    animation: ring-pulse 3s infinite;
  }

  @keyframes ring-pulse {
    0%, 100% { box-shadow: 0 0 8px var(--neumo-accent-glow), inset 0 0 8px var(--neumo-accent-glow); }
    50% { box-shadow: 0 0 16px var(--neumo-accent-glow), inset 0 0 16px var(--neumo-accent-glow); }
  }

  .fan-svg {
    width: 80px;
    height: 80px;
  }

  .fan-rotor {
    transform-origin: 50% 50%;
  }

  .fan-svg.spinning .fan-rotor {
    animation: spin var(--spin-duration, 3s) linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .fan-blade {
    fill: url(#blade-grad-idle);
    transition: fill 0.5s ease;
  }

  .fan-svg.spinning .fan-blade {
    fill: url(#blade-grad);
  }

  .fan-center {
    fill: var(--neumo-bg);
    stroke: var(--neumo-fan-idle);
    stroke-width: 2;
    transition: all 0.5s ease;
  }

  .fan-svg.spinning .fan-center {
    stroke: var(--neumo-fan-active);
  }


  .fan-label {
    margin-top: 8px;
    font-size: 10px;
    font-weight: 700;
    color: var(--neumo-text-secondary);
    letter-spacing: 0.5px;
  }

  .fan-rpm {
    font-size: 18px;
    font-weight: 700;
    color: var(--neumo-text);
    margin-top: 2px;
  }

  .fan-rpm span {
    font-size: 10px;
    font-weight: 600;
    color: var(--neumo-text-secondary);
    margin-left: 2px;
  }

  /* ── Speed Control ────────────────────────────────────────────── */
  .speed-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 0 0 16px;
  }

  .speed-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--neumo-bg);
    box-shadow:
      3px 3px 6px var(--neumo-shadow-dark),
      -3px -3px 6px var(--neumo-shadow-light);
    color: var(--neumo-text);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    font-family: var(--neumo-font);
  }

  .speed-btn:active {
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
    transform: scale(0.95);
  }

  .speed-display {
    min-width: 60px;
    text-align: center;
    padding: 6px 16px;
    border-radius: 10px;
    background: var(--neumo-bg);
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
    font-size: 16px;
    font-weight: 700;
    color: var(--neumo-accent);
  }

  .speed-display small {
    font-size: 10px;
    font-weight: 600;
    color: var(--neumo-text-secondary);
    margin-left: 2px;
  }

  /* ── Sensor Grid ──────────────────────────────────────────────── */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--neumo-text-secondary);
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .sensor-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  .sensor-tile {
    background: var(--neumo-bg);
    border-radius: var(--neumo-radius-sm);
    padding: 10px;
    box-shadow:
      3px 3px 6px var(--neumo-shadow-dark),
      -3px -3px 6px var(--neumo-shadow-light);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .sensor-tile:hover {
    transform: translateY(-1px);
    box-shadow:
      4px 4px 8px var(--neumo-shadow-dark),
      -4px -4px 8px var(--neumo-shadow-light);
  }

  .sensor-tile.alarm-active {
    box-shadow:
      3px 3px 6px var(--neumo-shadow-dark),
      -3px -3px 6px var(--neumo-shadow-light),
      inset 0 0 0 2px var(--neumo-danger);
    animation: alarm-glow 2s infinite;
  }

  @keyframes alarm-glow {
    0%, 100% { box-shadow: 3px 3px 6px var(--neumo-shadow-dark), -3px -3px 6px var(--neumo-shadow-light), inset 0 0 0 2px var(--neumo-danger); }
    50% { box-shadow: 3px 3px 6px var(--neumo-shadow-dark), -3px -3px 6px var(--neumo-shadow-light), inset 0 0 0 2px var(--neumo-danger), 0 0 8px rgba(229,57,53,0.3); }
  }

  .sensor-icon {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .sensor-name {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--neumo-text-secondary);
    margin-bottom: 2px;
  }

  .sensor-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--neumo-text);
    line-height: 1.2;
  }

  .sensor-value.small {
    font-size: 12px;
  }

  .sensor-unit {
    font-size: 9px;
    font-weight: 600;
    color: var(--neumo-text-secondary);
    margin-left: 1px;
  }

  .sensor-tile.wide {
    grid-column: 1 / -1;
  }

  /* ── Filter progress bar ──────────────────────────────────────── */
  .filter-progress {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--neumo-bg);
    box-shadow:
      inset 1px 1px 2px var(--neumo-shadow-dark),
      inset -1px -1px 2px var(--neumo-shadow-light);
    margin-top: 8px;
    overflow: hidden;
  }

  .filter-progress-bar {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--neumo-success), var(--neumo-accent));
    transition: width 1s ease;
  }

  /* ── Action Buttons ───────────────────────────────────────────── */
  .actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .action-btn {
    flex: 1;
    padding: 8px 6px;
    border-radius: var(--neumo-radius-sm);
    border: none;
    background: var(--neumo-bg);
    box-shadow:
      3px 3px 6px var(--neumo-shadow-dark),
      -3px -3px 6px var(--neumo-shadow-light);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
    font-family: var(--neumo-font);
  }

  .action-btn:active {
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
    transform: scale(0.96);
  }

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow:
      4px 4px 8px var(--neumo-shadow-dark),
      -4px -4px 8px var(--neumo-shadow-light);
  }

  .action-icon {
    font-size: 16px;
  }

  .action-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: var(--neumo-text-secondary);
    text-align: center;
  }

  /* ── Info Footer ──────────────────────────────────────────────── */
  .info-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: var(--neumo-radius-sm);
    background: var(--neumo-bg);
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .info-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--neumo-text-secondary);
  }

  .info-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--neumo-text);
  }

  .info-divider {
    width: 1px;
    height: 28px;
    background: var(--neumo-shadow-dark);
    opacity: 0.3;
  }

  /* ── Mode badge ───────────────────────────────────────────────── */
  .mode-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    background: var(--neumo-bg);
    box-shadow:
      inset 2px 2px 4px var(--neumo-shadow-dark),
      inset -2px -2px 4px var(--neumo-shadow-light);
    color: var(--neumo-accent);
  }

  /* ── Unavailable overlay ──────────────────────────────────────── */
  .unavailable {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }

  .unavailable-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .unavailable-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--neumo-text-secondary);
  }

  .unavailable-hint {
    font-size: 12px;
    color: var(--neumo-text-secondary);
    opacity: 0.6;
    margin-top: 4px;
  }

  /* ── Boost active indicator ───────────────────────────────────── */
  .boost-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
  }

  .boost-indicator.active {
    background: linear-gradient(135deg, #FFB74D22, #FF945022);
    color: #FF9800;
  }

  .boost-indicator.inactive {
    background: var(--neumo-bg);
    box-shadow:
      inset 1px 1px 3px var(--neumo-shadow-dark),
      inset -1px -1px 3px var(--neumo-shadow-light);
    color: var(--neumo-text-secondary);
  }

  /* ── Themes ─────────────────────────────────────────────────────── */
  /* Default (Light) */
  :host {
    --neumo-bg: #E0E5EC;
    --neumo-shadow-dark: #A3B1C6;
    --neumo-shadow-light: #FFFFFF;
    --neumo-shadow-dark-strong: #8C9BAF;
    --neumo-text: #31344B;
    --neumo-text-secondary: #8A98A8;
    --neumo-fan-idle: #9BA5B5;
    --neumo-fan-active: #4A90E2;
    --neumo-accent: #4A90E2;
    --neumo-accent-glow: rgba(74, 144, 226, 0.4);
  }

  /* Dark Theme Variables */
  :host(.theme-dark) {
    --neumo-bg: #2B2E33;
    --neumo-shadow-dark: #1E2024;
    --neumo-shadow-light: #383C42;
    --neumo-shadow-dark-strong: #17181A;
    --neumo-text: #E4E8F0;
    --neumo-text-secondary: #8992A3;
    --neumo-fan-idle: #5A6270;
    --neumo-fan-active: #4A90E2;
    --neumo-accent: #4A90E2;
    --neumo-accent-glow: rgba(74, 144, 226, 0.3);
  }
`;
const FAN_SVG = `
<svg viewBox="0 0 120 120" class="fan-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Blade Gradient for realism -->
    <linearGradient id="blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="var(--neumo-fan-active)" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="var(--neumo-fan-active)" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="blade-grad-idle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="var(--neumo-fan-idle)" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="var(--neumo-fan-idle)" stop-opacity="0.5"/>
    </linearGradient>
    <!-- Drop shadow for depth -->
    <filter id="blade-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Outer vent casing ring (gives it an exhaust fan look) -->
  <circle cx="60" cy="60" r="54" fill="none" class="fan-casing" stroke="var(--neumo-shadow-dark)" stroke-width="3" opacity="0.6" />
  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--neumo-shadow-light)" stroke-width="1" opacity="0.5" />
  
  <g class="fan-rotor">
    <!-- 4 wide, curved aerodynamic blades for a ventilation fan -->
    <g class="fan-blades-group" filter="url(#blade-shadow)">
      <path class="fan-blade" d="M60 60 C40 20, 85 15, 95 30 C105 45, 80 55, 60 60 Z" transform="rotate(0, 60, 60)" />
      <path class="fan-blade" d="M60 60 C40 20, 85 15, 95 30 C105 45, 80 55, 60 60 Z" transform="rotate(90, 60, 60)" />
      <path class="fan-blade" d="M60 60 C40 20, 85 15, 95 30 C105 45, 80 55, 60 60 Z" transform="rotate(180, 60, 60)" />
      <path class="fan-blade" d="M60 60 C40 20, 85 15, 95 30 C105 45, 80 55, 60 60 Z" transform="rotate(270, 60, 60)" />
    </g>

    <!-- Center Hub Assembly -->
    <circle class="fan-center-bg" cx="60" cy="60" r="14" fill="var(--neumo-shadow-dark)" />
    <circle class="fan-center" cx="60" cy="60" r="11" />
    <circle cx="60" cy="60" r="3" fill="var(--neumo-bg)" />
  </g>
</svg>
`;
class BlaubergRecuperatorCard extends HTMLElement {
  constructor() {
    super(...arguments);
    this._rendered = false;
  }
  /* HA calls this first */
  setConfig(config) {
    this._config = {
      title: "Blauberg Recuperator",
      ...config
    };
    if (!this._root) {
      this._root = this.attachShadow({ mode: "open" });
    }
  }
  /* HA calls this when state changes */
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  /* Helpers */
  _e(id) {
    return this._config[id] ?? DEFAULTS[id] ?? "";
  }
  _state(configKey) {
    const entityId = this._e(configKey);
    return entityId ? this._hass.states[entityId] : void 0;
  }
  _stateVal(configKey, fallback = "—") {
    const entity = this._state(configKey);
    if (!entity) return fallback;
    return entity.state === "unavailable" || entity.state === "unknown" ? fallback : entity.state;
  }
  _isFanOn() {
    const fan = this._state("fan_entity");
    return (fan == null ? void 0 : fan.state) === "on";
  }
  _fanSpeedPct() {
    const fan = this._state("fan_entity");
    if (!fan || fan.state !== "on") return 0;
    return fan.attributes.percentage ?? 0;
  }
  _getSpinDuration() {
    const rpm = parseInt(this._stateVal("sensor_rpm", "0"), 10);
    if (!rpm || rpm <= 0) return "4s";
    const duration = Math.max(0.3, 60 / rpm);
    return `${Math.min(duration, 4).toFixed(2)}s`;
  }
  /* ── Toggle fan ────────────────────────────────────────────────── */
  async _toggleFan() {
    const entityId = this._e("fan_entity");
    if (!entityId) return;
    await this._hass.callService("fan", "toggle", {
      entity_id: entityId
    });
  }
  /* ── Set speed ─────────────────────────────────────────────────── */
  async _setSpeed(delta) {
    const entityId = this._e("fan_entity");
    const fan = this._state("fan_entity");
    if (!entityId || !fan) return;
    const current = fan.attributes.percentage ?? 0;
    const step = fan.attributes.percentage_step ?? 25;
    const newSpeed = Math.max(0, Math.min(100, current + delta * step));
    if (newSpeed === 0) {
      await this._hass.callService("fan", "turn_off", { entity_id: entityId });
    } else {
      await this._hass.callService("fan", "set_percentage", {
        entity_id: entityId,
        percentage: newSpeed
      });
    }
  }
  /* ── Press button ──────────────────────────────────────────────── */
  async _pressButton(configKey) {
    const entityId = this._e(configKey);
    if (!entityId) return;
    await this._hass.callService("button", "press", {
      entity_id: entityId
    });
  }
  /* ── Render ────────────────────────────────────────────────────── */
  _render() {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!this._hass || !this._config) return;
    this._state("fan_entity");
    const isFanOn = this._isFanOn();
    const speedPct = this._fanSpeedPct();
    const spinDuration = this._getSpinDuration();
    const alarm = this._stateVal("sensor_alarm");
    const boostMode = this._stateVal("sensor_boost_mode");
    const filterTimer = this._stateVal("sensor_filter_timer");
    const humidity = this._stateVal("sensor_humidity");
    const mode = this._stateVal("sensor_mode");
    const rpm = this._stateVal("sensor_rpm");
    const timer = this._stateVal("sensor_timer");
    const firmware = this._stateVal("sensor_firmware");
    const version = this._stateVal("sensor_version");
    const isAlarmActive = alarm !== "—" && alarm !== "0" && alarm.toLowerCase() !== "off" && alarm.toLowerCase() !== "none" && alarm.toLowerCase() !== "no alarm";
    const isBoostActive = boostMode !== "—" && boostMode !== "0" && boostMode.toLowerCase() !== "off" && boostMode.toLowerCase() !== "inactive";
    const theme = this._config.theme || "auto";
    let isDark = false;
    if (theme === "dark") {
      isDark = true;
    } else if (theme === "light") {
      isDark = false;
    } else {
      isDark = ((_a = this._hass.themes) == null ? void 0 : _a.darkMode) === true;
    }
    if (isDark) {
      this.classList.add("theme-dark");
      this.classList.remove("theme-light");
    } else {
      this.classList.add("theme-light");
      this.classList.remove("theme-dark");
    }
    this._root.innerHTML = `
      <style>${CARD_STYLES}</style>
      <ha-card>
        <div class="card">
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <div class="header-icon">🌀</div>
              <div>
                <div class="header-title">${this._config.title || "Blauberg Recuperator"}</div>
                <div class="header-subtitle">${this._config.subtitle || "192.168.1.41"}</div>
              </div>
            </div>
            <div class="header-status ${isFanOn ? "active" : "inactive"}">
              <div class="status-dot"></div>
              ${isFanOn ? "Работает" : "Выкл"}
            </div>
          </div>

          <!-- Fan Hero -->
          <div class="fan-section">
            <div class="fan-container" id="fan-toggle">
              <div class="fan-ring ${isFanOn ? "active" : ""}"></div>
              <div style="--spin-duration: ${spinDuration}">
                ${FAN_SVG.replace(
      'class="fan-svg"',
      `class="fan-svg ${isFanOn ? "spinning" : ""}" style="--spin-duration: ${spinDuration}"`
    )}
              </div>
            </div>
            <div class="fan-label">ОБОРОТЫ</div>
            <div class="fan-rpm">${rpm}<span> RPM</span></div>
          </div>

          <!-- Speed Control -->
          <div class="speed-control">
            <button class="speed-btn" id="speed-down">−</button>
            <div class="speed-display">${speedPct}<small>%</small></div>
            <button class="speed-btn" id="speed-up">+</button>
          </div>

          <!-- Sensors -->
          <div class="section-label">Датчики</div>
          <div class="sensor-grid">
            <!-- Humidity -->
            <div class="sensor-tile">
              <div class="sensor-icon">💧</div>
              <div class="sensor-name">Влажность</div>
              <div class="sensor-value">${humidity}<span class="sensor-unit">%</span></div>
            </div>

            <!-- Mode -->
            <div class="sensor-tile">
              <div class="sensor-icon">⚙️</div>
              <div class="sensor-name">Режим</div>
              <div class="sensor-value">
                <span class="mode-badge">${mode}</span>
              </div>
            </div>

            <!-- Boost -->
            <div class="sensor-tile">
              <div class="sensor-icon">⚡</div>
              <div class="sensor-name">Буст</div>
              <div class="sensor-value">
                <span class="boost-indicator ${isBoostActive ? "active" : "inactive"}">
                  ${isBoostActive ? "🔥 Вкл" : "Выкл"}
                </span>
              </div>
            </div>

            <!-- Alarm -->
            <div class="sensor-tile ${isAlarmActive ? "alarm-active" : ""}">
              <div class="sensor-icon">${isAlarmActive ? "🚨" : "✅"}</div>
              <div class="sensor-name">Тревога</div>
              <div class="sensor-value small">${alarm}</div>
            </div>

            <!-- Filter Timer -->
            <div class="sensor-tile wide">
              <div class="sensor-icon">🔄</div>
              <div class="sensor-name">Фильтр</div>
              <div class="sensor-value small">${filterTimer}</div>
              <div class="filter-progress">
                <div class="filter-progress-bar" style="width: ${this._getFilterProgress(filterTimer)}%"></div>
              </div>
            </div>

            <!-- Timer -->
            <div class="sensor-tile">
              <div class="sensor-icon">⏱️</div>
              <div class="sensor-name">Таймер</div>
              <div class="sensor-value small">${timer}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="section-label">Управление</div>
          <div class="actions">
            <button class="action-btn" id="btn-party">
              <span class="action-icon">🎉</span>
              <span class="action-label">Вечеринка</span>
            </button>
            <button class="action-btn" id="btn-sleep">
              <span class="action-icon">🌙</span>
              <span class="action-label">Сон</span>
            </button>
            <button class="action-btn" id="btn-reset-filter">
              <span class="action-icon">🔄</span>
              <span class="action-label">Сброс фильтра</span>
            </button>
          </div>

          <!-- Info Footer -->
          <div class="info-footer">
            <div class="info-item">
              <span class="info-label">Прошивка</span>
              <span class="info-value">${firmware}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item">
              <span class="info-label">Версия</span>
              <span class="info-value">${version}</span>
            </div>
          </div>
        </div>
      </ha-card>
    `;
    (_b = this._root.getElementById("fan-toggle")) == null ? void 0 : _b.addEventListener("click", () => this._toggleFan());
    (_c = this._root.getElementById("speed-down")) == null ? void 0 : _c.addEventListener("click", () => this._setSpeed(-1));
    (_d = this._root.getElementById("speed-up")) == null ? void 0 : _d.addEventListener("click", () => this._setSpeed(1));
    (_e = this._root.getElementById("btn-party")) == null ? void 0 : _e.addEventListener("click", () => this._pressButton("button_party"));
    (_f = this._root.getElementById("btn-sleep")) == null ? void 0 : _f.addEventListener("click", () => this._pressButton("button_sleep"));
    (_g = this._root.getElementById("btn-reset-filter")) == null ? void 0 : _g.addEventListener("click", () => this._pressButton("button_reset_filter"));
  }
  /* ── Filter progress helper ────────────────────────────────────── */
  _getFilterProgress(value) {
    if (value === "—") return 100;
    const num = parseInt(value, 10);
    if (isNaN(num)) return 50;
    const maxHours = 720;
    return Math.max(0, Math.min(100, num / maxHours * 100));
  }
  /* ── Card sizing ───────────────────────────────────────────────── */
  getCardSize() {
    return 8;
  }
  /* ── Editor ────────────────────────────────────────────────────── */
  static getConfigElement() {
    return document.createElement("blauberg-recuperator-card-editor");
  }
  static getStubConfig() {
    return { ...DEFAULTS };
  }
}
customElements.define("blauberg-recuperator-card", BlaubergRecuperatorCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "blauberg-recuperator-card",
  name: "Blauberg Recuperator",
  description: "Neumorphic card for Blauberg wall-mounted recuperators",
  preview: true
});
