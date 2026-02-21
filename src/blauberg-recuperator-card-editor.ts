/* ===================================================================
 *  Blauberg Recuperator Card — Configuration Editor
 * =================================================================== */

interface HomeAssistant {
  states: Record<string, any>;
}

interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

const EDITOR_FIELDS: Array<{
  key: string;
  label: string;
  domain?: string;
  options?: { value: string; label: string }[];
}> = [
    { key: 'title', label: 'Название карточки' },
    { key: 'subtitle', label: 'Подзаголовок (IP адрес)' },
    { key: 'theme', label: 'Тема', options: [{ value: 'auto', label: 'Авто (Системная)' }, { value: 'light', label: 'Светлая' }, { value: 'dark', label: 'Темная' }] },
    { key: 'fan_entity', label: 'Вентилятор', domain: 'fan' },
    { key: 'sensor_alarm', label: 'Тревога', domain: 'sensor' },
    { key: 'sensor_boost_mode', label: 'Буст режим', domain: 'sensor' },
    { key: 'sensor_filter_timer', label: 'Таймер фильтра', domain: 'sensor' },
    { key: 'sensor_humidity', label: 'Влажность', domain: 'sensor' },
    { key: 'sensor_mode', label: 'Режим', domain: 'sensor' },
    { key: 'sensor_rpm', label: 'Обороты (RPM)', domain: 'sensor' },
    { key: 'sensor_timer', label: 'Таймер', domain: 'sensor' },
    { key: 'button_party', label: 'Кнопка: Вечеринка', domain: 'button' },
    { key: 'button_reset_filter', label: 'Кнопка: Сброс фильтра', domain: 'button' },
    { key: 'button_sleep', label: 'Кнопка: Сон', domain: 'button' },
    { key: 'sensor_firmware', label: 'Версия прошивки', domain: 'sensor' },
    { key: 'sensor_version', label: 'Версия устройства', domain: 'sensor' },
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
  private _hass!: HomeAssistant;
  private _config!: LovelaceCardConfig;
  private _root!: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  setConfig(config: LovelaceCardConfig): void {
    this._config = { ...config };
    this._render();
  }

  private _getEntities(domain?: string): string[] {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter((id) => !domain || id.startsWith(`${domain}.`))
      .sort();
  }

  private _valueChanged(key: string, value: string): void {
    if (!this._config) return;
    const newConfig = { ...this._config, [key]: value };
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  private _render(): void {
    if (!this._hass || !this._config) return;

    let sections = '';

    // Text fields and drop-downs without a domain
    const textFields = EDITOR_FIELDS.filter((f) => !f.domain);
    sections += textFields
      .map((f) => {
        if (f.options) {
          const current = this._config[f.key] || 'auto';
          const opts = f.options.map(o =>
            `<option value="${o.value}" ${current === o.value ? 'selected' : ''}>${o.label}</option>`
          ).join('');
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
                   value="${this._config[f.key] || ''}"
                   placeholder="${f.label}" />
          </div>
        `;
      })
      .join('');

    // Entity fields grouped by domain
    const domains = ['fan', 'sensor', 'button'];
    const domainLabels: Record<string, string> = {
      fan: '🌀 Вентилятор',
      sensor: '📊 Сенсоры',
      button: '🔘 Кнопки',
    };

    for (const domain of domains) {
      const fields = EDITOR_FIELDS.filter((f) => f.domain === domain);
      if (fields.length === 0) continue;

      sections += `<div class="section-divider">${domainLabels[domain] || domain}</div>`;

      const entities = this._getEntities(domain);
      const options = entities
        .map((e) => `<option value="${e}">${e}</option>`)
        .join('');

      for (const f of fields) {
        const current = this._config[f.key] || '';
        sections += `
          <div class="field">
            <label>${f.label}</label>
            <select data-key="${f.key}">
              <option value="">— выберите —</option>
              ${options.replace(
          `value="${current}"`,
          `value="${current}" selected`,
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

    // Bind inputs
    this._root.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this._valueChanged(target.dataset.key!, target.value);
      });
      el.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.tagName === 'INPUT') {
          this._valueChanged(target.dataset.key!, target.value);
        }
      });
    });
  }
}

customElements.define(
  'blauberg-recuperator-card-editor',
  BlaubergRecuperatorCardEditor,
);
