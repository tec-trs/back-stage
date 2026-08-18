import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<string>();

export const orgContext = {
  run<T>(organizationId: string, fn: () => T): T {
    return storage.run(organizationId, fn);
  },

  get(): string | null {
    return storage.getStore() ?? null;
  },

  getOrThrow(): string {
    const id = storage.getStore();
    if (!id) throw new Error('Organization context not set — organizationMiddleware must run first');
    return id;
  },
};
