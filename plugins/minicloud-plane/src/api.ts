import { createApiRef } from '@backstage/frontend-plugin-api';

export interface Project {
  id: string;
  name: string;
  identifier: string;
  description: string;
}

export interface Issue {
  id: string;
  sequence_id: number;
  name: string;
  description_stripped: string;
  state: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface PlaneApi {
  getProjects(): Promise<Project[]>;
  getIssues(projectId: string): Promise<Issue[]>;
}

export const planeApiRef = createApiRef<PlaneApi>({
  id: 'plugin.minicloud-plane.api',
});

export class PlaneApiClient implements PlaneApi {
  constructor(
    private readonly discoveryApi: { getBaseUrl(pluginId: string): Promise<string> },
    private readonly fetchApi: { fetch: typeof fetch },
  ) {}

  private async proxyFetch(path: string): Promise<Response> {
    const base = await this.discoveryApi.getBaseUrl('proxy');
    return this.fetchApi.fetch(`${base}/minicloud-plane${path}`);
  }

  async getProjects(): Promise<Project[]> {
    const resp = await this.proxyFetch('/api/projects');
    if (!resp.ok) throw new Error(`minicloud-plane: HTTP ${resp.status}`);
    return resp.json();
  }

  async getIssues(projectId: string): Promise<Issue[]> {
    const resp = await this.proxyFetch(`/api/projects/${projectId}/issues`);
    if (!resp.ok) throw new Error(`minicloud-plane: HTTP ${resp.status}`);
    return resp.json();
  }
}
