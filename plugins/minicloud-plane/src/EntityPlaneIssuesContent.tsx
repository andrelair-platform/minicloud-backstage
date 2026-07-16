import React, { useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/frontend-plugin-api';
import { planeApiRef, Project, Issue } from './api';

const ANNOTATION = 'plane.io/project-id';

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
  none: '⚪ None',
};

const th: React.CSSProperties = { padding: '8px 16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #e0e0e0' };
const td: React.CSSProperties = { padding: '8px 16px', borderBottom: '1px solid #f0f0f0' };

export function EntityPlaneIssuesContent() {
  const { entity } = useEntity();
  const planeApi = useApi(planeApiRef);
  const projectRef = entity.metadata.annotations?.[ANNOTATION];

  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectRef) return;
    setLoading(true);
    setError(null);

    planeApi
      .getProjects()
      .then(projects => {
        const found = projects.find(p => p.id === projectRef || p.identifier === projectRef);
        if (!found) throw new Error(`No Plane project matching "${projectRef}"`);
        setProject(found);
        return planeApi.getIssues(found.id);
      })
      .then(setIssues)
      .catch(e => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [planeApi, projectRef]);

  // Tab is filtered at plugin registration level — this guard is a safety net only.
  if (!projectRef) return null;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading Plane issues…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#c62828' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {project && (
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          {project.name}{' '}
          <span style={{ color: '#888', fontWeight: 400 }}>({project.identifier})</span>
          {' — '}
          <span style={{ fontWeight: 400 }}>{issues.length} issues</span>
        </h3>
      )}
      {issues.length === 0 ? (
        <p style={{ color: '#666' }}>No issues found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Title</th>
              <th style={th}>Priority</th>
              <th style={th}>State</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, i) => (
              <tr key={issue.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ ...td, color: '#888', width: 48 }}>{issue.sequence_id}</td>
                <td style={td}>{issue.name}</td>
                <td style={{ ...td, width: 120 }}>{PRIORITY_LABEL[issue.priority] ?? issue.priority}</td>
                <td style={{ ...td, width: 140 }}>{issue.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
