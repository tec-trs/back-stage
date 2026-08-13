import type { Request, Response } from 'express';

import { env } from '../../../../config/env.js';
import { verifyGitHubSignature, verifyGitLabToken } from '../../../../shared/webhooks/signature.js';
import type { DeploymentTrackingService } from '../../application/deployment-tracking.service.js';
import { parseGitHubPayload } from '../../domain/github-payload.parser.js';
import { parseGitLabPayload } from '../../domain/gitlab-payload.parser.js';

export class WebhookController {
  public constructor(private readonly deploymentTrackingService: DeploymentTrackingService) {}

  public handleGitHub = async (request: Request, response: Response): Promise<void> => {
    const signature = request.header('x-hub-signature-256');

    if (
      !request.rawBody ||
      !verifyGitHubSignature(request.rawBody, signature, env.githubWebhookSecret)
    ) {
      response.status(401).json({
        error: { code: 'INVALID_SIGNATURE', message: 'Assinatura do webhook invalida' },
      });
      return;
    }

    const event = parseGitHubPayload(request.body);

    if (!event) {
      response.status(202).json({ status: 'ignored', reason: 'Evento nao suportado' });
      return;
    }

    const result = await this.deploymentTrackingService.handleEvent(event);
    response.status(200).json(result);
  };

  public handleGitLab = async (request: Request, response: Response): Promise<void> => {
    const token = request.header('x-gitlab-token');

    if (!verifyGitLabToken(token, env.gitlabWebhookSecret)) {
      response.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Token do webhook invalido' },
      });
      return;
    }

    const event = parseGitLabPayload(request.body);

    if (!event) {
      response.status(202).json({ status: 'ignored', reason: 'Evento nao suportado' });
      return;
    }

    const result = await this.deploymentTrackingService.handleEvent(event);
    response.status(200).json(result);
  };
}
