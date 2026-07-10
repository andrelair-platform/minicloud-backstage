import TrackChangesIcon from '@material-ui/icons/TrackChanges';
import { createFrontendPlugin, PageBlueprint } from '@backstage/frontend-plugin-api';

const techRadarPage = PageBlueprint.makeWithOverrides({
  factory(originalFactory) {
    return originalFactory({
      path: '/tech-radar',
      title: 'Tech Radar',
      icon: <TrackChangesIcon />,
      loader: () => import('./TechRadarPage').then(m => <m.TechRadarPage />),
    });
  },
});

export const techRadarPlugin = createFrontendPlugin({
  pluginId: 'tech-radar',
  extensions: [techRadarPage],
});
