/**
 * Hello World Addon — Example addon for Projection Mapper.
 *
 * Demonstrates:
 * - Lifecycle hooks (activate / deactivate)
 * - Event subscription (projection:update)
 * - Storage API (read / write)
 * - Logging API
 * - Settings access
 */

/** @type {import('../../src/services/addon-api').AddonAPIInstance} */
let api;

/** Unsubscribe handle for event listeners */
let unsubscribe;

/**
 * Called when the addon is enabled/activated.
 * Receives the sandboxed addon API instance.
 *
 * @param {import('../../src/services/addon-api').AddonAPIInstance} addonAPI
 */
async function activate(addonAPI) {
  api = addonAPI;

  // Read the greeting setting (falls back to default from manifest)
  const settings = api.storage?.read?.() ?? {};
  const greeting = settings.greeting || 'Hello from the addon system!';
  const verbose = settings.verbose || false;

  api.log.info(greeting);

  if (verbose) {
    api.log.info('[hello-world] Addon activated with verbose logging enabled');
    api.log.info(`[hello-world] API capabilities: ${Object.keys(api).join(', ')}`);
  }

  // Persist an activation counter
  const data = api.storage?.read?.() ?? {};
  const count = (data.activationCount || 0) + 1;
  api.storage?.write?.({ ...data, activationCount: count });
  api.log.info(`[hello-world] Activation count: ${count}`);

  // Subscribe to projection update events
  unsubscribe = api.events.on('projection:update', (event) => {
    if (verbose) {
      api.log.info(`[hello-world] Projection updated: ${JSON.stringify(event).slice(0, 200)}`);
    }
  });

  // Read current projections if available
  if (api.projection?.getSurfaces) {
    const surfaces = api.projection.getSurfaces();
    api.log.info(`[hello-world] Found ${surfaces.length} projection surface(s)`);
  }
}

/**
 * Called when the addon is disabled/deactivated.
 * Clean up all listeners and resources.
 */
async function deactivate() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  if (api) {
    api.log.info('[hello-world] Addon deactivated. Goodbye!');
    api = null;
  }
}

module.exports = { activate, deactivate };
