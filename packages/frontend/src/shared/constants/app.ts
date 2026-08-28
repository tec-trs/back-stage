// APP_VERSION comes from package.json; APP_COMMIT/APP_BUILD_TIME are stamped by
// vite.config.ts at build (or dev-server start) time — this is what lets you
// confirm, from the running app itself, exactly which build you're looking at.
export const APP_VERSION = __APP_VERSION__;
export const APP_COMMIT = __APP_COMMIT__;
export const APP_BUILD_TIME = __APP_BUILD_TIME__;
export const APP_NAME = 'Back-Stage';
