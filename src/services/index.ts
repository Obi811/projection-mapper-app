/**
 * Services barrel export.
 *
 * Re-exports all service modules for convenient single-import usage:
 *   import { login, validateLicense, hasFeature } from '@services';
 */

export { apiClient, configureTokenHandlers } from './api-client';
export * from './auth-service';
export * from './license-service';
export * from './addon-service';
