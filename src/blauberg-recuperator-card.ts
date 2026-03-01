/**
 * Blauberg Recuperator Card — Home Assistant Lovelace Custom Card
 * Premium neumorphic card — matching Altal Heater Card design
 * Multi-device support with tab switching
 * v1.0.0
 */

import './blauberg-recuperator-card-editor';

/* ═══════════════════ Types ═══════════════════ */

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
  devices: DeviceConfig[];
  show_controls?: boolean;
  compact?: boolean;
  text_color?: string;
  animation_color?: string;
}

interface HassEntity {
  state: string;
  attributes: Record<string, any>;
  entity_id: string;
  last_changed?: string;
}

interface Hass {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => Promise<void>;
}

/* ═══════════════════ Card ═══════════════════ */

class BlaubergRecuperatorCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;
  private _activeTab = 0;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('blauberg-recuperator-card-editor'); }

  static getStubConfig() {
    return {
      devices: [
        {
          name: 'Спальня Амели',
          fan_entity: 'fan.siku_blauberg_fan_192_168_1_41',
          sensor_alarm: 'sensor.alarm',
          sensor_boost_mode: 'sensor.boost_mode',
          sensor_filter_timer: 'sensor.filter_timer_countdown',
          sensor_humidity: 'sensor.humidity',
          sensor_mode: 'sensor.mode',
          sensor_rpm: 'sensor.rpm',
          sensor_timer: 'sensor.timer_countdown',
          button_party: 'button.party_mode',
          button_reset_filter: 'button.reset_filter_alarm',
          button_sleep: 'button.sleep_mode_2',
          sensor_firmware: 'sensor.firmware_version',
          sensor_version: 'sensor.version',
        },
        {
          name: 'Мастер Спальня',
          fan_entity: 'fan.siku_blauberg_fan_192_168_1_49',
          sensor_alarm: 'sensor.alarm_3',
          sensor_boost_mode: 'sensor.boost_mode_3',
          sensor_filter_timer: 'sensor.filter_timer_countdown_3',
          sensor_humidity: 'sensor.humidity_3',
          sensor_mode: 'sensor.mode_3',
          sensor_rpm: 'sensor.rpm_3',
          sensor_timer: 'sensor.timer_countdown_3',
          button_party: 'button.party_mode_2',
          button_reset_filter: 'button.reset_filter_alarm_2',
          button_sleep: 'button.sleep_mode',
          sensor_firmware: 'sensor.firmware_version_3',
          sensor_version: 'sensor.version_3',
        },
        {
          name: 'Спальня Пацанов',
          fan_entity: 'fan.siku_blauberg_fan_192_168_1_50',
          sensor_alarm: 'sensor.alarm_2',
          sensor_boost_mode: 'sensor.boost_mode_2',
          sensor_filter_timer: 'sensor.filter_timer_countdown_2',
          sensor_humidity: 'sensor.humidity_2',
          sensor_mode: 'sensor.mode_2',
          sensor_rpm: 'sensor.rpm_2',
          sensor_timer: 'sensor.timer_countdown_2',
          button_party: 'button.party_mode_3',
          button_reset_filter: 'button.reset_filter_alarm_3',
          button_sleep: 'button.sleep_mode_5',
          sensor_firmware: 'sensor.firmware_version_2',
          sensor_version: 'sensor.version_2',
        },
      ],
      show_controls: true, compact: false,
    };
  }

  setConfig(config: CardConfig) {
    // Support legacy single-device config
    if (!(config as any).devices && (config as any).fan_entity) {
      (config as any).devices = [{
        name: (config as any).title || 'Рекуператор',
        fan_entity: (config as any).fan_entity,
        sensor_alarm: (config as any).sensor_alarm || '',
        sensor_boost_mode: (config as any).sensor_boost_mode || '',
        sensor_filter_timer: (config as any).sensor_filter_timer || '',
        sensor_humidity: (config as any).sensor_humidity || '',
        sensor_mode: (config as any).sensor_mode || '',
        sensor_rpm: (config as any).sensor_rpm || '',
        sensor_timer: (config as any).sensor_timer || '',
        button_party: (config as any).button_party || '',
        button_reset_filter: (config as any).button_reset_filter || '',
        button_sleep: (config as any).button_sleep || '',
        sensor_firmware: (config as any).sensor_firmware || '',
        sensor_version: (config as any).sensor_version || '',
      }];
    }
    if (!config.devices || config.devices.length === 0) throw new Error('Укажите хотя бы одно устройство в devices');
    this._config = { show_controls: true, compact: false, ...config };
    if (this._activeTab >= this._config.devices.length) this._activeTab = 0;
    if (this._hass) this._render();
  }

  set hass(hass: Hass) {
    const prev = this._hass;
    this._hass = hass;
    // Only rerender if something changed
    if (!prev) { this._render(); return; }
    const d = this._config?.devices?.[this._activeTab];
    if (!d) { this._render(); return; }
    const changed = [d.fan_entity, d.sensor_alarm, d.sensor_boost_mode, d.sensor_filter_timer,
    d.sensor_humidity, d.sensor_mode, d.sensor_rpm, d.sensor_timer,
    d.sensor_firmware, d.sensor_version].some(e =>
      e && prev.states[e] !== hass.states[e]);
    if (changed) this._render();
  }

  getCardSize() { return this._config?.compact ? 5 : 8; }

  /* ── Helpers ───────────────────────────── */

  private _sv(entity: string): string {
    if (!entity) return '—';
    const s = this._hass?.states?.[entity];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return '—';
    return s.state;
  }

  /** Parse filter timer: handles pure numbers (hours/days) and Russian strings like "82 д. 12 ч." */
  private _parseFilterDays(val: string): number | null {
    if (val === '—') return null;
    // Pure number
    const num = parseFloat(val);
    if (!isNaN(num) && /^\d+(\.\d+)?$/.test(val.trim())) return num;
    // Russian format: "82 д. 12 ч." or "82д 12ч"
    const dMatch = val.match(/(\d+)\s*д/);
    const hMatch = val.match(/(\d+)\s*ч/);
    if (dMatch || hMatch) {
      const days = dMatch ? parseInt(dMatch[1], 10) : 0;
      const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
      return days + hours / 24;
    }
    // Try parseInt as fallback
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  }

  private _isFanOn(d: DeviceConfig): boolean {
    return this._hass?.states?.[d.fan_entity]?.state === 'on';
  }

  private _fanPct(d: DeviceConfig): number {
    const fan = this._hass?.states?.[d.fan_entity];
    return fan?.state === 'on' ? (fan.attributes.percentage ?? 0) : 0;
  }

  private _spinDuration(d: DeviceConfig): string {
    const rpm = parseInt(this._sv(d.sensor_rpm), 10);
    if (!rpm || rpm <= 0) return '4s';
    return `${Math.max(0.3, Math.min(4, 60 / rpm)).toFixed(2)}s`;
  }

  /* ── Actions ────────────────────────────── */

  private async _toggleFan(d: DeviceConfig) {
    if (!d.fan_entity) return;
    await this._hass.callService('fan', 'toggle', { entity_id: d.fan_entity });
  }

  private async _setSpeed(d: DeviceConfig, dir: number) {
    const fan = this._hass?.states?.[d.fan_entity];
    if (!fan) return;
    const step = fan.attributes.percentage_step ?? 25;
    const cur = fan.attributes.percentage ?? 0;
    const next = Math.max(0, Math.min(100, cur + dir * step));
    if (next === 0) {
      await this._hass.callService('fan', 'turn_off', { entity_id: d.fan_entity });
    } else {
      await this._hass.callService('fan', 'set_percentage', { entity_id: d.fan_entity, percentage: next });
    }
  }

  private async _press(entity: string) {
    if (!entity) return;
    await this._hass.callService('button', 'press', { entity_id: entity });
  }

  /* ── SVG Icons (Altal thin-stroke style) ── */
  private _ico = {
    fan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9C12 5.5 9.5 2 12 2s0 3.5 0 7"/><path d="M12 9C12 5.5 14.5 2 12 2"/><path d="M15 12c3.5 0 7-2.5 7 0s-3.5 0-7 0"/><path d="M15 12c3.5 0 7 2.5 7 0"/><path d="M12 15c0 3.5 2.5 7 0 7s0-3.5 0-7"/><path d="M12 15c0 3.5-2.5 7 0 7"/><path d="M9 12c-3.5 0-7 2.5-7 0s3.5 0 7 0"/><path d="M9 12c-3.5 0-7-2.5-7 0"/></svg>`,
    power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v8"/><path d="M17.66 6.34a8 8 0 11-11.32 0"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    humidity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
    mode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    alarm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    party: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3L2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="M22 2l-2.24.75a2.9 2.9 0 00-1.96 3.12l.2 1.3a2.9 2.9 0 01-.76 2.46L14 13l-3-3 3.24-3.24a2.9 2.9 0 012.46-.77l1.3.2a2.9 2.9 0 003.12-1.96z"/></svg>`,
    sleep: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  };

  /* ── Fan SVG blades ── */
  private _fanSvg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="fan-blades">
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z"/>
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z" transform="rotate(60, 50, 50)"/>
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z" transform="rotate(120, 50, 50)"/>
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z" transform="rotate(180, 50, 50)"/>
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z" transform="rotate(240, 50, 50)"/>
      <path class="blade" d="M50 50 C48 40, 44 22, 50 10 C56 22, 52 40, 50 50Z" transform="rotate(300, 50, 50)"/>
      <circle cx="50" cy="50" r="7" class="hub"/>
    </svg>
  `;

  /* ══════════════════ CSS ══════════════════ */

  private _css(): string {
    const customText = this._config?.text_color || 'var(--aerogel-text, var(--primary-text-color, #3b3f5c))';
    const customHeat = this._config?.animation_color || 'var(--aerogel-warning, #3b82f6)';

    return `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');

      :host {
        --bg: var(--aerogel-base, var(--card-background-color, #e3e6ec));
        --bg2: var(--aerogel-base-alt, var(--secondary-background-color, #d1d5db));
        --txt: ${customText};
        --txt2: var(--aerogel-text-secondary, var(--secondary-text-color, #8b8fa3));
        --accent: var(--aerogel-accent, var(--primary-color, #6CB4EE));

        --raised: var(--aerogel-convex-lg, 6px 6px 14px rgba(166,180,200,0.7), -6px -6px 14px rgba(255,255,255,0.8));
        --raised-s: var(--aerogel-convex-sm, 3px 3px 8px rgba(166,180,200,0.7), -3px -3px 8px rgba(255,255,255,0.8));
        --inset: var(--aerogel-concave-lg, inset 3px 3px 7px rgba(166,180,200,0.7), inset -3px -3px 7px rgba(255,255,255,0.8));
        --inset-s: var(--aerogel-concave-sm, inset 2px 2px 4px rgba(166,180,200,0.7), inset -2px -2px 4px rgba(255,255,255,0.8));
        --btn: var(--aerogel-flat, 4px 4px 10px rgba(166,180,200,0.7), -4px -4px 10px rgba(255,255,255,0.8));
        --btn-p: var(--aerogel-active, inset 3px 3px 7px rgba(166,180,200,0.7), inset -3px -3px 7px rgba(255,255,255,0.8));

        --heat: ${customHeat};
        --heat-g: rgba(59, 130, 246, 0.15);
        --idle: var(--aerogel-text-secondary, #93a5be);
        --good: var(--success-color, #05a677);
        --warn: var(--aerogel-warning, #e5a100);
        --danger: #e53935;

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
        font-family: var(--aerogel-font, 'Nunito', sans-serif);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      /* ─── Card ─── */
      .card {
        background: var(--bg);
        border-radius: 24px;
        box-shadow: var(--raised);
        overflow: hidden;
        font-family: 'Nunito', 'Segoe UI', Roboto, sans-serif;
        color: var(--txt);
        padding: clamp(16px, 5cqw, 24px);
        container-type: inline-size;
      }

      /* ─── Device Tabs ─── */
      .tabs {
        display: flex; gap: 8px; margin-bottom: clamp(14px, 4cqw, 20px);
        overflow-x: auto; scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .tabs::-webkit-scrollbar { display: none; }

      .tab {
        padding: 8px 18px; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: clamp(11px, 3cqw, 13px); font-weight: 600;
        color: var(--txt2); white-space: nowrap;
        transition: all 0.25s; -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
      }
      .tab:hover { transform: translateY(-1px); }
      .tab:active { box-shadow: var(--btn-p); transform: scale(0.96); }
      .tab.on { box-shadow: var(--btn-p); color: var(--heat); font-weight: 700; }

      /* ─── Top ─── */
      .top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: clamp(16px, 5cqw, 24px);
      }
      .top-left { display: flex; align-items: center; gap: clamp(12px, 3cqw, 16px); }

      .dev-thumb {
        width: clamp(50px, 13cqw, 64px); aspect-ratio: 1;
        border-radius: 18px;
        background: var(--bg); box-shadow: var(--raised-s);
        overflow: hidden; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        color: var(--txt2); transition: transform 0.3s;
      }
      .dev-thumb:hover { transform: scale(1.04); }
      .dev-thumb svg { width: clamp(28px, 7cqw, 36px); height: clamp(28px, 7cqw, 36px); }

      .top-info .name {
        font-size: clamp(16px, 4cqw, 20px); font-weight: 600;
        color: var(--txt); line-height: 1.3;
      }
      .top-info .status {
        font-size: clamp(11px, 2.8cqw, 13px); font-weight: 400;
        color: var(--txt2); margin-top: 4px;
      }

      .top-right {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: clamp(6px, 2cqw, 10px);
      }

      /* Badge */
      .badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 14px; border-radius: 20px;
        font-size: clamp(9px, 2cqw, 11px); font-weight: 600;
        letter-spacing: 0.5px;
      }
      .badge .dot { width: 7px; height: 7px; border-radius: 50%; }
      .badge.on { background: rgba(59,130,246,0.1); color: var(--heat); }
      .badge.on .dot { background: var(--heat); box-shadow: 0 0 6px var(--heat); animation: blink 1.4s ease-in-out infinite; }
      .badge.off { background: rgba(100,100,120,0.08); color: #999; }
      .badge.off .dot { background: #aaa; }
      @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }

      /* Power */
      .pwr {
        width: clamp(36px, 9cqw, 44px); aspect-ratio: 1; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--idle); transition: all 0.25s;
      }
      .pwr:hover { box-shadow: var(--raised); }
      .pwr:active { box-shadow: var(--btn-p); }
      .pwr.on { color: var(--heat); }
      .pwr svg { width: clamp(18px, 4.5cqw, 22px); height: clamp(18px, 4.5cqw, 22px); }

      /* ─── Fan dial area ─── */
      .dial-area {
        display: flex; align-items: center; justify-content: center;
        gap: clamp(12px, 4cqw, 20px); margin-bottom: 12px;
      }

      .side-btn {
        width: clamp(40px, 10cqw, 56px); aspect-ratio: 1; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--txt); flex-shrink: 0;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .side-btn:hover { transform: scale(1.06); box-shadow: var(--raised); }
      .side-btn:active { box-shadow: var(--btn-p); transform: scale(0.94); }
      .side-btn svg { width: clamp(20px, 5cqw, 24px); }

      /* Circle (fan housing) */
      .circle {
        width: clamp(140px, 40cqw, 220px); aspect-ratio: 1;
        border-radius: 50%; flex-shrink: 0;
        background: var(--bg); box-shadow: var(--raised);
        display: flex; align-items: center; justify-content: center;
        position: relative; cursor: pointer;
      }
      .circle:hover { transform: scale(1.02); }
      .circle:active { transform: scale(0.98); }
      .circle-in {
        width: 85%; aspect-ratio: 1;
        border-radius: 50%;
        background: var(--bg); box-shadow: var(--inset);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; z-index: 2; overflow: hidden;
      }

      /* Glow + spin ring */
      .glow {
        position: absolute; inset: 0; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.5s;
      }
      .glow.on { background: radial-gradient(circle, var(--heat-g) 0%, transparent 60%); opacity: 1; animation: gp 2.5s ease-in-out infinite; }
      @keyframes gp { 0%,100%{opacity:.4;transform:scale(.97)} 50%{opacity:1;transform:scale(1.03)} }

      .spin-ring {
        position: absolute; inset: -3px; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.4s;
      }
      .spin-ring.on {
        opacity: 1;
        border: 2.5px solid transparent;
        border-top-color: var(--heat);
        border-right-color: rgba(59,130,246,0.3);
        animation: sp 3s linear infinite;
        filter: drop-shadow(0 0 3px var(--heat-g));
      }
      @keyframes sp { to { transform:rotate(360deg); } }

      /* Fan blades SVG */
      .fan-blades {
        width: clamp(60px, 20cqw, 100px);
        position: relative; z-index: 3;
        transition: all 0.5s;
      }
      .fan-blades.spinning {
        animation: fan-spin var(--spin-dur, 3s) linear infinite;
      }
      .blade {
        fill: var(--idle);
        transition: fill 0.5s;
      }
      .fan-blades.spinning .blade { fill: var(--heat); }
      .hub {
        fill: var(--bg);
        stroke: var(--idle);
        stroke-width: 1.5;
        transition: all 0.5s;
      }
      .fan-blades.spinning .hub { stroke: var(--heat); }
      @keyframes fan-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

      /* ─── Speed display below dial ─── */
      .setpoint {
        text-align: center; margin-bottom: clamp(16px, 5cqw, 22px);
      }
      .sp-lbl {
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
      }
      .sp-val {
        font-size: clamp(24px, 7cqw, 36px); font-weight: 600; color: var(--txt);
        line-height: 1.3; transition: color 0.3s;
      }
      .sp-val.on { color: var(--heat); }
      .sp-unit {
        font-size: clamp(14px, 4cqw, 20px); font-weight: 400;
      }
      .rpm-sub {
        font-size: clamp(11px, 3cqw, 13px); font-weight: 500;
        color: var(--txt2); margin-top: 2px;
      }

      /* ─── Sensor metrics (Altal grid) ─── */
      .metrics {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: clamp(10px, 3cqw, 14px); margin-bottom: 18px;
        width: 100%;
      }
      .metric {
        background: var(--bg);
        box-shadow: var(--raised-s);
        border-radius: 18px; padding: clamp(12px, 3cqw, 16px);
        display: flex; align-items: center; gap: clamp(8px, 2.5cqw, 12px);
        transition: all 0.25s;
        animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .metric:nth-child(1){animation-delay:.1s}
      .metric:nth-child(2){animation-delay:.15s}
      .metric:nth-child(3){animation-delay:.2s}
      .metric:nth-child(4){animation-delay:.25s}
      .metric:nth-child(5){animation-delay:.3s}
      .metric:nth-child(6){animation-delay:.35s}
      @keyframes pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:none} }
      .metric:hover { transform: translateY(-2px); box-shadow: var(--raised); }
      .metric:active { box-shadow: var(--inset-s); transform: none; }

      .metric.wide { grid-column: 1 / -1; }
      .metric.alarm-active {
        box-shadow: var(--raised-s), inset 0 0 0 2px var(--danger);
      }

      .m-ico {
        width: 44px; height: 44px; border-radius: 14px;
        background: var(--bg); box-shadow: var(--inset-s);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; color: var(--txt2); transition: color 0.3s;
      }
      .m-ico svg { width: 22px; height: 22px; }
      .m-ico.active { color: var(--heat); }
      .m-ico.ok { color: var(--good); }
      .m-ico.warn { color: var(--warn); }
      .m-ico.danger { color: var(--danger); }

      .m-txt { min-width: 0; }
      .m-val { font-size: clamp(15px, 4.5cqw, 20px); font-weight: 600; color: var(--txt); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .m-val.active { color: var(--heat); }
      .m-lbl { font-size: 12px; font-weight: 500; color: var(--txt2); margin-top: 2px; }

      /* Filter progress bar */
      .dt-bar {
        height: 4px; border-radius: 4px; margin-top: 6px;
        background: var(--bg); box-shadow: var(--inset-s);
        overflow: hidden; width: 100%;
      }
      .dt-fill {
        height: 100%; border-radius: 4px;
        transition: width 0.8s ease;
      }
      .dt-fill.ok { background: var(--good); }
      .dt-fill.mid { background: var(--warn); }
      .dt-fill.low { background: var(--danger); }

      /* ─── Action buttons ─── */
      .actions {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
        margin-bottom: 18px;
        animation: pop 0.4s 0.4s both;
      }
      .abtn {
        padding: 12px 8px; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.3px;
        color: var(--txt2); display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 6px;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .abtn:hover { transform: translateY(-2px); }
      .abtn:active { box-shadow: var(--btn-p); transform: scale(0.95); }
      .abtn svg { width: 20px; height: 20px; }

      /* ─── Info footer ─── */
      .info {
        display: flex; align-items: center; justify-content: center;
        gap: 20px; padding: 10px 16px;
        border-radius: 14px; background: var(--bg); box-shadow: var(--inset-s);
        animation: pop 0.4s 0.45s both;
      }
      .info-item {
        display: flex; flex-direction: column; align-items: center; gap: 1px;
      }
      .info-lbl {
        font-size: 9px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
        color: var(--txt2);
      }
      .info-val {
        font-size: 12px; font-weight: 600; color: var(--txt);
      }
      .info-sep {
        width: 1px; height: 24px; background: rgba(139,143,163,0.2);
      }

      /* ─── Error ─── */
      .err {
        padding: 40px; text-align: center; border-radius: 24px;
        background: var(--bg); box-shadow: var(--raised);
      }
      .err h3 { font-size: 18px; font-weight: 600; color: var(--danger); margin-bottom: 8px; }
      .err p { font-size: 14px; color: var(--txt2); }
    `;
  }

  /* ══════════════════ RENDER ══════════════════ */

  private _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2)">Загрузка…</div>`;
      return;
    }

    const devices = this._config.devices;
    const d = devices[this._activeTab];
    if (!d) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Нет устройств</h3><p>Добавьте хотя бы одно устройство в конфигурации</p></div>`;
      return;
    }

    const fanEntity = this._hass.states[d.fan_entity];
    if (!fanEntity) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${d.fan_entity}</p></div>`;
      return;
    }

    const isOn = this._isFanOn(d);
    const pct = this._fanPct(d);
    const spinDur = this._spinDuration(d);
    const rpm = this._sv(d.sensor_rpm);
    const humidity = this._sv(d.sensor_humidity);
    const mode = this._sv(d.sensor_mode);
    const boost = this._sv(d.sensor_boost_mode);
    const alarm = this._sv(d.sensor_alarm);
    const filterTimer = this._sv(d.sensor_filter_timer);
    const timer = this._sv(d.sensor_timer);
    const firmware = this._sv(d.sensor_firmware);
    const version = this._sv(d.sensor_version);

    const alarmLow = alarm.toLowerCase();
    const isAlarm = alarm !== '—' && alarm !== '0' &&
      !['off', 'none', 'false', 'ok', 'no alarm', 'no_alarm', 'no', 'нет'].includes(alarmLow);
    const boostLow = boost.toLowerCase();
    const isBoost = boost !== '—' && boost !== '0' &&
      !['off', 'false', 'inactive', 'нет'].includes(boostLow);

    // Filter progress — parse numeric or Russian strings like "82 д. 12 ч."
    const filterDays = this._parseFilterDays(filterTimer);
    const filterMaxDays = 90; // typical filter life ~90 days
    const filterPct = filterDays === null ? 100 : Math.min(100, Math.max(0, (filterDays / filterMaxDays) * 100));
    const filterCls = filterPct > 50 ? 'ok' : filterPct > 20 ? 'mid' : 'low';

    const name = d.name || fanEntity.attributes.friendly_name || 'Рекуператор';
    const modeLbl = this._sv(d.sensor_mode);

    // Tabs HTML
    const tabsHtml = devices.length > 1 ? `
      <div class="tabs">
        ${devices.map((dev, i) => `
          <button class="tab ${i === this._activeTab ? 'on' : ''}" data-tab="${i}">
            ${dev.name || `Рекуператор ${i + 1}`}
          </button>
        `).join('')}
      </div>
    ` : '';

    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          ${tabsHtml}

          <!-- TOP -->
          <div class="top">
            <div class="top-left">
              <div class="dev-thumb">${this._ico.fan}</div>
              <div class="top-info">
                <div class="name">${name}</div>
                <div class="status">Рекуператор · ${isOn ? (modeLbl !== '—' ? modeLbl : 'Работает') : 'Выкл'}</div>
              </div>
            </div>
            <div class="top-right">
              <div class="badge ${isOn ? 'on' : 'off'}"><span class="dot"></span>${isOn ? 'Работает' : 'Выкл'}</div>
              <button class="pwr ${isOn ? 'on' : ''}" id="pwr">${this._ico.power}</button>
            </div>
          </div>

          <!-- FAN DIAL: [-] [circle] [+] -->
          ${this._config.show_controls !== false ? `
          <div class="dial-area">
            <button class="side-btn" id="dn">${this._ico.minus}</button>
            <div class="circle" id="fan-toggle">
              <div class="spin-ring ${isOn ? 'on' : ''}"></div>
              <div class="circle-in">
                <div class="glow ${isOn ? 'on' : ''}"></div>
                ${this._fanSvg.replace('class="fan-blades"', `class="fan-blades ${isOn ? 'spinning' : ''}" style="--spin-dur:${spinDur}"`)}
              </div>
            </div>
            <button class="side-btn" id="up">${this._ico.plus}</button>
          </div>

          <!-- SPEED -->
          <div class="setpoint">
            <div class="sp-lbl">Скорость</div>
            <div class="sp-val ${isOn ? 'on' : ''}">${pct}<span class="sp-unit">%</span></div>
            <div class="rpm-sub">${rpm !== '—' ? `${rpm} RPM` : ''}</div>
          </div>
          ` : ''}

          <!-- METRICS -->
          <div class="metrics">
            <div class="metric">
              <div class="m-ico ${humidity !== '—' ? 'active' : ''}">${this._ico.humidity}</div>
              <div class="m-txt"><div class="m-val">${humidity}${humidity !== '—' ? '%' : ''}</div><div class="m-lbl">Влажность</div></div>
            </div>
            <div class="metric">
              <div class="m-ico">${this._ico.mode}</div>
              <div class="m-txt"><div class="m-val">${mode}</div><div class="m-lbl">Режим</div></div>
            </div>
            <div class="metric">
              <div class="m-ico ${isBoost ? 'active' : ''}">${this._ico.bolt}</div>
              <div class="m-txt"><div class="m-val ${isBoost ? 'active' : ''}">${isBoost ? 'Вкл' : 'Выкл'}</div><div class="m-lbl">Буст</div></div>
            </div>
            <div class="metric ${isAlarm ? 'alarm-active' : ''}">
              <div class="m-ico ${isAlarm ? 'danger' : 'ok'}">${isAlarm ? this._ico.alarm : this._ico.check}</div>
              <div class="m-txt"><div class="m-val">${alarm}</div><div class="m-lbl">Тревога</div></div>
            </div>
            <div class="metric wide">
              <div class="m-ico">${this._ico.filter}</div>
              <div class="m-txt" style="flex:1">
                <div class="m-val">${filterTimer}</div>
                <div class="m-lbl">Фильтр</div>
                <div class="dt-bar"><div class="dt-fill ${filterCls}" style="width:${filterPct}%"></div></div>
              </div>
            </div>
            <div class="metric wide">
              <div class="m-ico">${this._ico.timer}</div>
              <div class="m-txt"><div class="m-val">${timer}</div><div class="m-lbl">Таймер</div></div>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="actions">
            <button class="abtn" id="btn-party">${this._ico.party}<span>Вечеринка</span></button>
            <button class="abtn" id="btn-sleep">${this._ico.sleep}<span>Сон</span></button>
            <button class="abtn" id="btn-reset">${this._ico.reset}<span>Сброс фильтра</span></button>
          </div>

          <!-- INFO -->
          <div class="info">
            <div class="info-item"><span class="info-lbl">Прошивка</span><span class="info-val">${firmware}</span></div>
            <div class="info-sep"></div>
            <div class="info-item"><span class="info-lbl">Версия</span><span class="info-val">${version}</span></div>
          </div>

        </div>
      </ha-card>
    `;

    this._bindAll(d);
  }

  /* ══════════════════ Bindings ══════════════════ */

  private _bindAll(d: DeviceConfig) {
    const $ = (id: string) => this._root.getElementById(id);

    // Tabs
    this._root.querySelectorAll('.tab').forEach(el => {
      el.addEventListener('click', () => {
        this._activeTab = parseInt((el as HTMLElement).dataset.tab || '0', 10);
        this._render();
      });
    });

    // Power
    $('pwr')?.addEventListener('click', () => this._toggleFan(d));

    // Fan circle toggle
    $('fan-toggle')?.addEventListener('click', () => this._toggleFan(d));

    // Speed
    $('dn')?.addEventListener('click', () => this._setSpeed(d, -1));
    $('up')?.addEventListener('click', () => this._setSpeed(d, 1));

    // Actions
    $('btn-party')?.addEventListener('click', () => this._press(d.button_party));
    $('btn-sleep')?.addEventListener('click', () => this._press(d.button_sleep));
    $('btn-reset')?.addEventListener('click', () => this._press(d.button_reset_filter));
  }
}

/* ═══════════════════ Register ═══════════════════ */

customElements.define('blauberg-recuperator-card', BlaubergRecuperatorCard);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'blauberg-recuperator-card',
  name: 'Blauberg Recuperator',
  description: 'Neumorphic multi-device card for Blauberg wall-mounted recuperators',
  preview: true,
});

console.info(
  '%c BLAUBERG-RECUPERATOR-CARD %c v2.0.0 ',
  'color: white; background: #3b82f6; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;',
  'color: #3b82f6; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;'
);
