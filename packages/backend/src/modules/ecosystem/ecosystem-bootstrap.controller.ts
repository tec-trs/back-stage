import type { Request, Response } from 'express';

export class EcosystemBootstrapController {
  public bootstrap = async (request: Request, response: Response): Promise<void> => {
    try {
      const db = (request.app.locals.db as any);
      const org = await db('organizations').where({ slug: 'default' }).first();
      if (!org) {
        response.status(400).json({ error: 'Default organization not found' });
        return;
      }

      // Create applications
      const getOrCreateApp = async (code: string, name: string) => {
        let app = await db('applications').where({ code, organization_id: org.id }).first();
        if (app) return app;
        const [newApp] = await db('applications')
          .insert({ code, display_name: name, organization_id: org.id })
          .returning('*');
        return newApp;
      };

      const pasoe01 = await getOrCreateApp('pasoe-totys-01p', 'PASOE TOTYS 01');
      const pasoe02 = await getOrCreateApp('pasoe-totys-02p', 'PASOE TOTYS 02');
      const pasoe03 = await getOrCreateApp('pasoe-totys-03p', 'PASOE TOTYS 03');
      const pasoe04 = await getOrCreateApp('pasoe-totys-04p', 'PASOE TOTYS 04');
      const totysRef = await getOrCreateApp('totys-dfs', 'TOTYS DFS');
      const sholderTotys = await getOrCreateApp('sholder-totys', 'SHOLDER TOTYS');

      // Delete existing relationships for this bootstrap
      await db('resource_relationships')
        .where({ metadata: { bootstrap: true } })
        .del();

      // Create relationships
      const rels = [
        [pasoe01.id, totysRef.id],
        [pasoe01.id, sholderTotys.id],
        [pasoe02.id, totysRef.id],
        [pasoe02.id, sholderTotys.id],
        [pasoe03.id, totysRef.id],
        [pasoe03.id, sholderTotys.id],
        [pasoe04.id, totysRef.id],
        [pasoe04.id, sholderTotys.id],
      ];

      for (const [sourceId, targetId] of rels) {
        const exists = await db('resource_relationships')
          .where({ source_type: 'application', source_id: sourceId, target_type: 'application', target_id: targetId })
          .first();
        if (!exists) {
          await db('resource_relationships').insert({
            source_type: 'application',
            source_id: sourceId,
            target_type: 'application',
            target_id: targetId,
            relation_type: 'depends_on',
            organization_id: org.id,
            metadata: { bootstrap: true },
          });
        }
      }

      response.status(200).json({ success: true, message: '✓ 8 relationships created!', apps: { pasoe01, pasoe02, pasoe03, pasoe04, totysRef, sholderTotys } });
    } catch (error) {
      response.status(500).json({ error: String(error) });
    }
  };
}
