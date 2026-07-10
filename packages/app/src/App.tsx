import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import { navModule } from './modules/nav';
import { authModule } from './modules/auth';

export default createApp({
  features: [catalogPlugin, apiDocsPlugin, kubernetesPlugin, navModule, authModule],
});
