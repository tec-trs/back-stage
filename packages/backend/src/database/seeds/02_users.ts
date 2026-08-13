import type { Knex } from 'knex';

import { hashPassword } from '../../shared/auth/password.js';

const DEV_ADMIN_PASSWORD = 'ChangeMe123!';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').where({ email: 'admin@back-stage.dev' }).del();

  await knex('users').insert({
    email: 'admin@back-stage.dev',
    full_name: 'Administrador da Plataforma',
    is_active: true,
    password_hash: await hashPassword(DEV_ADMIN_PASSWORD),
    roles: ['admin'],
  });
}
