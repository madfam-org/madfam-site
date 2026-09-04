import * as migration_20260904_223252_initial from './20260904_223252_initial.ts';

export const migrations = [
  {
    up: migration_20260904_223252_initial.up,
    down: migration_20260904_223252_initial.down,
    name: '20260904_223252_initial'
  },
];
