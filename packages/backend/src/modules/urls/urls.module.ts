import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { UrlService } from './application/url.service.js';
import { UrlRepository } from './infrastructure/url.repository.js';
import { UrlController } from './interfaces/http/url.controller.js';
import { createUrlRouter } from './interfaces/http/url.routes.js';

export function registerUrlsModule(): Router {
  container.register('UrlRepository', () => new UrlRepository(db));
  container.register('UrlService', () => new UrlService(container.resolve('UrlRepository')));
  container.register('UrlController', () => new UrlController(container.resolve('UrlService')));

  return createUrlRouter(container.resolve('UrlController'));
}
