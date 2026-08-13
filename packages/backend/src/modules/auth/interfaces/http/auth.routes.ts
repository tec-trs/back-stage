import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { AuthController } from './auth.controller.js';
import { loginBodySchema } from './auth.validation.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  /**
   * @openapi
   * /auth/login:
   *   post:
   *     summary: Autentica um usuario e retorna um JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, format: password }
   *     responses:
   *       200:
   *         description: Login efetuado com sucesso
   *       401:
   *         description: Credenciais invalidas
   */
  router.post(
    '/login',
    validateMiddleware({ body: loginBodySchema }),
    asyncHandler(controller.login),
  );

  /**
   * @openapi
   * /auth/me:
   *   get:
   *     summary: Retorna o usuario autenticado
   *     tags: [Auth]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Usuario autenticado
   *       401:
   *         description: Nao autenticado
   */
  router.get('/me', authenticateMiddleware, controller.me);

  return router;
}
