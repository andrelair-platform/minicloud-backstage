import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import kubernetesPlugin from '@backstage/plugin-kubernetes/alpha';
import searchPlugin from '@backstage/plugin-search/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import techdocsPlugin from '@backstage/plugin-techdocs/alpha';
import minicloudPlanePlugin from '@internal/plugin-minicloud-plane';
import { techRadarPlugin } from './modules/tech-radar';
import { navModule } from './modules/nav';
import { authModule } from './modules/auth';

export default createApp({
  features: [catalogPlugin, apiDocsPlugin, kubernetesPlugin, searchPlugin, scaffolderPlugin, techdocsPlugin, minicloudPlanePlugin, techRadarPlugin, navModule, authModule],
});
