import { Router } from 'express';
import { authMiddleware } from '../../../../shared/auth/auth.middleware.js';

const router = Router();

router.get('/test-subgraph/:type/:id', authMiddleware, (req, res) => {
  const { type, id } = req.params;

  // Dados hardcoded para teste
  const testData = {
    nodes: [
      {
        id: id,
        resourceType: type,
        label: `Test ${type}`,
        status: 'active',
      },
      {
        id: 'app-123',
        resourceType: 'application',
        label: 'Test Application',
        status: 'active',
      },
    ],
    edges: [
      {
        id: `${type}:${id}→application:app-123`,
        sourceType: 'application',
        sourceId: 'app-123',
        targetType: type,
        targetId: id,
        relationType: 'exposes',
      },
    ],
  };

  res.json(testData);
});

export default router;
