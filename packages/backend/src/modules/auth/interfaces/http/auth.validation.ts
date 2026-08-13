import { z } from 'zod';

export const loginBodySchema = z.object({
  code: z.string().min(1).max(50),
  password: z.string().min(8),
});
