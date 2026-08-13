import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextStore {
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(store: RequestContextStore, callback: () => T): T {
  return asyncLocalStorage.run(store, callback);
}

export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId;
}
