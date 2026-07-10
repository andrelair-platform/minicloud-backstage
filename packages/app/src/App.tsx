import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import techRadarPlugin from '@backstage/plugin-tech-radar/alpha';
import { navModule } from './modules/nav';
import { authModule } from './modules/auth';

export default createApp({
  // techRadarPlugin cast: 0.7.4 built against older frontend-plugin-api missing info(), works at runtime
  features: [catalogPlugin, apiDocsPlugin, kubernetesPlugin, techRadarPlugin as any, navModule, authModule],
});
