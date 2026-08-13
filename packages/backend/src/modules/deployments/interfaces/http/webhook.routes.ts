import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';

import type { WebhookController } from './webhook.controller.js';

export function createWebhookRouter(controller: WebhookController): Router {
  const router = Router();

  /**
   * @openapi
   * /webhooks/github:
   *   post:
   *     summary: Recebe eventos deployment_status do GitHub Actions (assinatura HMAC-SHA256)
   *     tags: [Webhooks]
   *     responses:
   *       200: { description: Evento processado }
   *       401: { description: Assinatura invalida }
   *       202: { description: Evento recebido mas ignorado (tipo nao suportado) }
   */
  router.post('/github', asyncHandler(controller.handleGitHub));

  /**
   * @openapi
   * /webhooks/gitlab:
   *   post:
   *     summary: Recebe eventos de pipeline do GitLab CI (token X-Gitlab-Token)
   *     tags: [Webhooks]
   *     responses:
   *       200: { description: Evento processado }
   *       401: { description: Token invalido }
   *       202: { description: Evento recebido mas ignorado (tipo nao suportado) }
   */
  router.post('/gitlab', asyncHandler(controller.handleGitLab));

  return router;
}
