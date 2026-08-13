import type { Knex } from 'knex';

import { env } from '../config/env.js';

const isProduction = env.nodeEnv === 'production';

const config: Knex.Config = {
  client: 'pg',
  connection: env.databaseUrl,
  migrations: {
    directory: isProduction ? './dist/database/migrations' : './src/database/migrations',
    extension: isProduction ? 'js' : 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: isProduction ? './dist/database/seeds' : './src/database/seeds',
    extension: isProduction ? 'js' : 'ts',
  },
  pool: {
    min: 2,
    max: isProduction ? 20 : 10,
  },
};

export default config;
