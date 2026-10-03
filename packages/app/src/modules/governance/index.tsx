import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';
import type { Entity } from '@backstage/catalog-model';

// Capability-registry governance columns (§8): a per-entity "Gouvernance & conformité" card that
// surfaces the applicable policy/standard/guideline/procedure (+ controls/approval/evidence) from
// annotations. Shown only on entities that carry at least one governance annotation.
const GOVERNANCE_PREFIX = 'governance.ktayl-solution/';

const hasGovernanceAnnotation = (entity: Entity): boolean =>
  Object.keys(entity.metadata.annotations ?? {}).some(k =>
    k.startsWith(GOVERNANCE_PREFIX),
  );

const governanceCard = EntityCardBlueprint.make({
  name: 'governance',
  params: {
    type: 'info',
    filter: hasGovernanceAnnotation,
    loader: () => import('./GovernanceCard').then(m => <m.GovernanceCard />),
  },
});

export const governancePlugin = createFrontendPlugin({
  pluginId: 'governance',
  extensions: [governanceCard],
});
