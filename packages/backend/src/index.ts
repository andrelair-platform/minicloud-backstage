/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';
import * as http from 'http';
import * as promClient from 'prom-client';

// Expose Prometheus metrics on port 9464 (separate from the Backstage SPA port 7007
// to avoid the app-backend catch-all intercepting /metrics with SPA HTML).
// prom-client is a transitive dep already used by catalog-backend and scaffolder-backend.
promClient.collectDefaultMetrics();
http
  .createServer(async (req, res) => {
    if (req.url === '/metrics') {
      const body = await promClient.register.metrics();
      res.writeHead(200, { 'Content-Type': promClient.register.contentType });
      res.end(body);
    } else {
      res.writeHead(404);
      res.end();
    }
  })
  .listen(9464);

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));

// scaffolder plugin
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(
  import('@backstage/plugin-scaffolder-backend-module-notifications'),
);

// techdocs plugin
backend.add(import('@backstage/plugin-techdocs-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes plugin
backend.add(import('@backstage/plugin-kubernetes-backend'));

// argocd plugin
backend.add(import('@roadiehq/backstage-plugin-argo-cd-backend'));

// oidc auth provider (used for Authentik SSO in production)
backend.add(import('@backstage/plugin-auth-backend-module-oidc-provider'));

// notifications and signals plugins
backend.add(import('@backstage/plugin-notifications-backend'));
backend.add(import('@backstage/plugin-signals-backend'));

// mcp actions plugin
backend.add(import('@backstage/plugin-mcp-actions-backend'));

// custom scaffolder actions
backend.add(import('./actions/vault'));
backend.add(import('./actions/onboard'));

backend.start();
