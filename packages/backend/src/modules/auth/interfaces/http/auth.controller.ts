import type { Request, Response } from 'express';

import type { LoginService } from '../../application/login.service.js';

export class AuthController {
  public constructor(private readonly loginService: LoginService) {}

  public login = async (request: Request, response: Response): Promise<void> => {
    const { email, password } = request.body as { email: string; password: string };
    const result = await this.loginService.execute(email, password);
    response.status(200).json(result);
  };

  public me = (request: Request, response: Response): void => {
    response.status(200).json({ user: request.user });
  };
}
