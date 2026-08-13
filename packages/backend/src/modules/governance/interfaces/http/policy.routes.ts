import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { PolicyController } from './policy.controller.js';
import {
  createExemptionBodySchema,
  createPolicyBodySchema,
  evaluateEntityParamsSchema,
  exemptionIdParamsSchema,
  listExemptionsQuerySchema,
  listPoliciesQuerySchema,
  paginationQuerySchema,
  policyIdParamsSchema,
  updatePolicyBodySchema,
} from './policy.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const ADMIN_ROLES = ['admin'];

export function createPolicyRouter(controller: PolicyController): Router {
  const router = Router();

  /**
   * @openapi
   * /governance/policies:
   *   get:
   *     summary: Lista policies de governanca
   *     tags: [Governance]
   *     responses:
   *       200: { description: Lista paginada de policies }
   *   post:
   *     summary: Cria uma nova policy
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Policy criada }
   */
  router.get(
    '/policies',
    validateMiddleware({ query: listPoliciesQuerySchema }),
    asyncHandler(controller.list),
  );
  router.post(
    '/policies',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createPolicyBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /governance/violations:
   *   get:
   *     summary: Lista violacoes ativas (ultima avaliacao com status fail, exceto exemptions aprovadas)
   *     tags: [Governance]
   *     responses:
   *       200: { description: Lista paginada de violacoes }
   */
  router.get(
    '/violations',
    validateMiddleware({ query: paginationQuerySchema }),
    asyncHandler(controller.listViolations),
  );

  /**
   * @openapi
   * /governance/dashboard:
   *   get:
   *     summary: Resumo de compliance (policies, evaluations, exemptions)
   *     tags: [Governance]
   *     responses:
   *       200: { description: Resumo de compliance }
   */
  router.get('/dashboard', asyncHandler(controller.getDashboard));

  /**
   * @openapi
   * /governance/exemptions:
   *   get:
   *     summary: Lista exemptions de policy
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista paginada de exemptions }
   *   post:
   *     summary: Solicita uma exemption para uma policy em uma entidade
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Exemption solicitada, aguardando aprovacao }
   */
  router.get(
    '/exemptions',
    authenticateMiddleware,
    validateMiddleware({ query: listExemptionsQuerySchema }),
    asyncHandler(controller.listExemptions),
  );
  router.post(
    '/exemptions',
    authenticateMiddleware,
    validateMiddleware({ body: createExemptionBodySchema }),
    asyncHandler(controller.requestExemption),
  );

  /**
   * @openapi
   * /governance/exemptions/{id}/approve:
   *   put:
   *     summary: Aprova uma exemption pendente
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Exemption aprovada }
   * /governance/exemptions/{id}/reject:
   *   put:
   *     summary: Rejeita uma exemption pendente
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Exemption rejeitada }
   */
  router.put(
    '/exemptions/:id/approve',
    authenticateMiddleware,
    authorizeMiddleware(...ADMIN_ROLES),
    validateMiddleware({ params: exemptionIdParamsSchema }),
    asyncHandler(controller.approveExemption),
  );
  router.put(
    '/exemptions/:id/reject',
    authenticateMiddleware,
    authorizeMiddleware(...ADMIN_ROLES),
    validateMiddleware({ params: exemptionIdParamsSchema }),
    asyncHandler(controller.rejectExemption),
  );

  /**
   * @openapi
   * /governance/policies/{id}:
   *   get:
   *     summary: Obtem uma policy pelo id
   *     tags: [Governance]
   *     responses:
   *       200: { description: Policy encontrada }
   *   put:
   *     summary: Atualiza uma policy existente
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Policy atualizada }
   *   delete:
   *     summary: Remove (soft delete) uma policy
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Policy removida }
   */
  router.get(
    '/policies/:id',
    validateMiddleware({ params: policyIdParamsSchema }),
    asyncHandler(controller.getById),
  );
  router.put(
    '/policies/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: policyIdParamsSchema, body: updatePolicyBodySchema }),
    asyncHandler(controller.update),
  );
  router.delete(
    '/policies/:id',
    authenticateMiddleware,
    authorizeMiddleware(...ADMIN_ROLES),
    validateMiddleware({ params: policyIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  /**
   * @openapi
   * /governance/policies/{id}/evaluate:
   *   post:
   *     summary: Avalia a policy contra todas as entidades do catalogo e persiste os resultados
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Resumo da avaliacao em lote }
   * /governance/policies/{id}/evaluate/{entityId}:
   *   post:
   *     summary: Avalia a policy contra uma unica entidade e persiste o resultado
   *     tags: [Governance]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Resultado da avaliacao }
   * /governance/policies/{id}/evaluations:
   *   get:
   *     summary: Historico de avaliacoes de uma policy
   *     tags: [Governance]
   *     responses:
   *       200: { description: Lista paginada de avaliacoes }
   */
  router.post(
    '/policies/:id/evaluate',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: policyIdParamsSchema }),
    asyncHandler(controller.evaluate),
  );
  router.post(
    '/policies/:id/evaluate/:entityId',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: evaluateEntityParamsSchema }),
    asyncHandler(controller.evaluateEntity),
  );
  router.get(
    '/policies/:id/evaluations',
    validateMiddleware({ params: policyIdParamsSchema, query: paginationQuerySchema }),
    asyncHandler(controller.listEvaluations),
  );

  return router;
}
