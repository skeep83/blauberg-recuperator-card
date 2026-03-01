/**
 * Blauberg Recuperator Card — Configuration Editor
 * Multi-device support
 */

interface Hass {
  states: Record<string, any>;
}

interface DeviceConfig {
  name: string;
  fan_entity: string;
  sensor_alarm: string;
  sensor_boost_mode: string;
  sensor_filter_timer: string;
  sensor_humidity: string;
  sensor_mode: string;
  sensor_rpm: string;
  sensor_timer: string;
  button_party: string;
  button_reset_filter: string;
  button_sleep: string;
  sensor_firmware: string;
  sensor_version: string;
}

interface CardConfig {
  type: string;
  devices: DeviceConfig[];
  [key: string]: any;
}

const DEVICE_FIELDS: Array<{ key: keyof DeviceConfig; label: string; domain?: string }> = [
  { key: 'name', label: 'Название' },
  { key: 'fan_entity', label: 'Вентилятор', domain: 'fan' },
  { key: 'sensor_humidity', label: 'Влажность', domain: 'sensor' },
  { key: 'sensor_mode', label: 'Режим', domain: 'sensor' },
  { key: 'sensor_boost_mode', label: 'Буст режим', domain: 'sensor' },
  { key: 'sensor_alarm', label: 'Тревога', domain: 'sensor' },
  { key: 'sensor_filter_timer', label: 'Таймер фильтра', domain: 'sensor' },
  { key: 'sensor_rpm', label: 'Обороты (RPM)', domain: 'sensor' },
  { key: 'sensor_timer', label: 'Таймер', domain: 'sensor' },
  { key: 'button_party', label: 'Вечеринка', domain: 'button' },
  { key: 'button_sleep', label: 'Сон', domain: 'button' },
  { key: 'button_reset_filter', label: 'Сброс фильтра', domain: 'button' },
  { key: 'sensor_firmware', label: 'Прошивка', domain: 'sensor' },
  { key: 'sensor_version', label: 'Версия', domain: 'sensor' },
];

const ED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');

  :host { display: block; font-family: 'Nunito', sans-serif; }

  .ed { padding: 16px; }
  .ed-title {
    font-size: 16px; font-weight: 700; margin-bottom: 16px;
    color: var(--primary-text-color, #333);
    display: flex; align-items: center; gap: 8px;
  }

  /* Tabs */
  .dev-tabs {
    display: flex; gap: 6px; margin-bottom: 14px;
    flex-wrap: wrap; align-items: center;
  }
  .dev-tab {
    padding: 6px 14px; border-radius: 10px; border: 1px solid var(--divider-color, #ddd);
    background: var(--card-background-color, #fff);
    cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600;
    color: var(--secondary-text-color, #888);
    transition: all 0.2s;
  }
  .dev-tab.on {
    background: var(--primary-color, #3b82f6);
    color: white; border-color: var(--primary-color, #3b82f6);
  }
  .dev-tab.add {
    border-style: dashed; color: var(--primary-color, #3b82f6);
  }
  .dev-tab.add:hover { background: rgba(59,130,246,0.08); }

  /* Remove device */
  .dev-remove {
    display: flex; justify-content: flex-end; margin-bottom: 10px;
  }
  .dev-remove button {
    padding: 4px 12px; border-radius: 8px;
    border: 1px solid #e53935; background: none;
    color: #e53935; font-family: inherit; font-size: 11px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .dev-remove button:hover { background: rgba(229,57,53,0.08); }

  /* Fields */
  .section {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; color: var(--secondary-text-color, #888);
    margin: 14px 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid var(--divider-color, #eee);
  }
  .field { margin-bottom: 10px; }
  .field label {
    display: block; font-size: 11px; font-weight: 600;
    color: var(--secondary-text-color, #666);
    text-transform: uppercase; letter-spacing: 0.3px;
    margin-bottom: 3px;
  }
  .field input, .field select {
    width: 100%; padding: 7px 10px;
    border: 1px solid var(--divider-color, #ddd); border-radius: 8px;
    font-size: 13px; font-family: inherit;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #333);
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .field input:focus, .field select:focus {
    outline: none; border-color: var(--primary-color, #3b82f6);
  }
`;

class BlaubergRecuperatorCardEditor extends HTMLElement {
  private _hass!: Hass;
  private _config!: CardConfig;
  private _root!: ShadowRoot;
  private _editIdx = 0;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config: CardConfig) {
    this._config = { ...config };
    if (!this._config.devices) this._config.devices = [];
    this._render();
  }

  private _entities(domain?: string): string[] {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(id => !domain || id.startsWith(`${domain}.`))
      .sort();
  }

  private _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config } },
      bubbles: true, composed: true,
    }));
  }

  private _addDevice() {
    const devices = [...(this._config.devices || [])];
    devices.push({
      name: `Рекуператор ${devices.length + 1}`,
      fan_entity: '', sensor_alarm: '', sensor_boost_mode: '',
      sensor_filter_timer: '', sensor_humidity: '', sensor_mode: '',
      sensor_rpm: '', sensor_timer: '', button_party: '',
      button_reset_filter: '', button_sleep: '',
      sensor_firmware: '', sensor_version: '',
    });
    this._config = { ...this._config, devices };
    this._editIdx = devices.length - 1;
    this._fire();
    this._render();
  }

  private _removeDevice(i: number) {
    const devices = [...(this._config.devices || [])];
    devices.splice(i, 1);
    this._config = { ...this._config, devices };
    if (this._editIdx >= devices.length) this._editIdx = Math.max(0, devices.length - 1);
    this._fire();
    this._render();
  }

  private _updateField(devIdx: number, key: string, value: string) {
    const devices = [...(this._config.devices || [])];
    devices[devIdx] = { ...devices[devIdx], [key]: value };
    this._config = { ...this._config, devices };
    this._fire();
  }

  private _render() {
    if (!this._hass || !this._config) return;

    const devices = this._config.devices || [];
    const d = devices[this._editIdx];

    // Device tabs
    const tabsHtml = devices.map((dev, i) => `
      <button class="dev-tab ${i === this._editIdx ? 'on' : ''}" data-idx="${i}">
        ${dev.name || `#${i + 1}`}
      </button>
    `).join('') + `<button class="dev-tab add" id="add-dev">+ Добавить</button>`;

    // Fields for current device
    let fieldsHtml = '';
    if (d) {
      const grouped: Record<string, typeof DEVICE_FIELDS> = { '': [], 'fan': [], 'sensor': [], 'button': [] };
      for (const f of DEVICE_FIELDS) {
        const g = f.domain || '';
        (grouped[g] = grouped[g] || []).push(f);
      }

      const domainLabels: Record<string, string> = { '': '📝 Основные', 'fan': '🌀 Вентилятор', 'sensor': '📊 Сенсоры', 'button': '🔘 Кнопки' };

      for (const [domain, fields] of Object.entries(grouped)) {
        if (fields.length === 0) continue;
        fieldsHtml += `<div class="section">${domainLabels[domain] || domain}</div>`;

        for (const f of fields) {
          const val = (d as any)[f.key] || '';
          if (f.domain) {
            const ents = this._entities(f.domain);
            const opts = ents.map(e => `<option value="${e}" ${e === val ? 'selected' : ''}>${e}</option>`).join('');
            fieldsHtml += `
              <div class="field">
                <label>${f.label}</label>
                <select data-key="${f.key as string}"><option value="">— выберите —</option>${opts}</select>
              </div>`;
          } else {
            fieldsHtml += `
              <div class="field">
                <label>${f.label}</label>
                <input type="text" data-key="${f.key as string}" value="${val}" placeholder="${f.label}"/>
              </div>`;
          }
        }
      }
    }

    this._root.innerHTML = `
      <style>${ED_CSS}</style>
      <div class="ed">
        <div class="ed-title">🌀 Blauberg Recuperator</div>
        <div class="dev-tabs">${tabsHtml}</div>
        ${d ? `
          ${devices.length > 1 ? `<div class="dev-remove"><button id="rm-dev">🗑 Удалить устройство</button></div>` : ''}
          ${fieldsHtml}
        ` : '<p style="color:var(--secondary-text-color)">Нажмите «+ Добавить» чтобы добавить первое устройство</p>'}
      </div>
    `;

    // Bind
    this._root.querySelectorAll('.dev-tab:not(.add)').forEach(el => {
      el.addEventListener('click', () => {
        this._editIdx = parseInt((el as HTMLElement).dataset.idx || '0', 10);
        this._render();
      });
    });
    this._root.getElementById('add-dev')?.addEventListener('click', () => this._addDevice());
    this._root.getElementById('rm-dev')?.addEventListener('click', () => this._removeDevice(this._editIdx));

    this._root.querySelectorAll('input, select').forEach(el => {
      const handler = (e: Event) => {
        const t = e.target as HTMLInputElement;
        this._updateField(this._editIdx, t.dataset.key!, t.value);
      };
      el.addEventListener('change', handler);
      if (el.tagName === 'INPUT') el.addEventListener('input', handler);
    });
  }
}

customElements.define('blauberg-recuperator-card-editor', BlaubergRecuperatorCardEditor);
