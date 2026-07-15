import React from 'react';
import {
  createFrontendPlugin,
  ApiBlueprint,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import { planeApiRef, PlaneApiClient } from './api';

const planeApiExtension = ApiBlueprint.make({
  name: 'plane',
  params: defineParams =>
    defineParams({
      api: planeApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new PlaneApiClient(discoveryApi, fetchApi),
    }),
});

const entityPlaneIssuesContent = EntityContentBlueprint.make({
  name: 'plane-issues',
  params: {
    path: '/plane',
    title: 'Plane Issues',
    loader: async () => {
      const { EntityPlaneIssuesContent } = await import('./EntityPlaneIssuesContent');
      return React.createElement(EntityPlaneIssuesContent);
    },
  },
});

const minicloudPlanePlugin = createFrontendPlugin({
  pluginId: 'minicloud-plane',
  extensions: [planeApiExtension, entityPlaneIssuesContent],
});

export default minicloudPlanePlugin;
