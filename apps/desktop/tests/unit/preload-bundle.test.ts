// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import path from 'path';

/**
 * Regression test for the "Unable to load preload script" crash.
 *
 * The preload script imports `IpcChannel` from '../shared/types'. When the
 * BrowserWindow runs with `sandbox: true`, the preload runs in a restricted
 * context where Node's require() can only resolve `electron` and a handful of
 * built-in modules — NOT relative local files. A raw tsc build leaves a
 * `require("../shared/types")` call in preload.js, which throws at load time
 * and leaves `window.electronAPI` completely undefined (login worked via the
 * HTTP fallback, but license activation / all IPC features were broken).
 *
 * The fix bundles the preload with esbuild so every local import is inlined and
 * only `electron` stays external. This test bundles the preload exactly like the
 * production `build:preload` script and asserts:
 *   1. No relative require() survives (would crash in the sandbox).
 *   2. `electron` is still required externally (contextBridge / ipcRenderer).
 *   3. The IpcChannel string values are inlined (e.g. 'license:activate').
 */
describe('preload bundle (sandbox safety)', () => {
  const preloadEntry = path.resolve(__dirname, '../../src/main/preload.ts');

  async function bundlePreload(): Promise<string> {
    const result = await build({
      entryPoints: [preloadEntry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      external: ['electron'],
      write: false,
    });
    return result.outputFiles[0].text;
  }

  it('does not contain relative require() calls that crash in the sandbox', async () => {
    const code = await bundlePreload();
    // Any require("./...") or require("../...") would fail in a sandboxed preload
    expect(code).not.toMatch(/require\(["']\.\.?\//);
  });

  it('keeps electron as an external require', async () => {
    const code = await bundlePreload();
    expect(code).toContain('require("electron")');
  });

  it('inlines the IpcChannel enum values', async () => {
    const code = await bundlePreload();
    expect(code).toContain('license:activate');
    expect(code).toContain('auth:login');
  });
});
