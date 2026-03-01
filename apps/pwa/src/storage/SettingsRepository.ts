import type { AlarmConfiguration } from '@kitchensync/alarm-scheduler';
import { alarmScheduler } from '@kitchensync/alarm-scheduler';
import { db } from './db.js';

const DEFAULT_CONFIG: AlarmConfiguration = { id: 'global', defaultEnabled: true };

/**
 * Singleton persistence for the global AlarmConfiguration.
 * Reads pass raw IndexedDB data through deserializeAlarmConfig (Principle III).
 * Falls back to the safe default on any read error or missing record.
 */
export const SettingsRepository = {
  async read(): Promise<AlarmConfiguration> {
    try {
      const raw = await db.alarmConfig.get('global');
      if (!raw) return DEFAULT_CONFIG;
      const result = alarmScheduler.deserializeAlarmConfig(raw);
      return result.ok ? result.value : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  async write(config: AlarmConfiguration): Promise<void> {
    await db.alarmConfig.put(config);
  },
};
