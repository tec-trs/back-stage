import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const team = await knex('teams').where({ slug: 'platform-engineering' }).first();
  const user = await knex('users').where({ email: 'admin@back-stage.dev' }).first();

  if (!team || !user) {
    throw new Error('Seed de team_members depende dos seeds de teams e users');
  }

  await knex('team_members').where({ team_id: team.id, user_id: user.id }).del();

  await knex('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'owner',
  });
}
