import { useEffect, useState } from 'react';
import { Content, ContentHeader, Page, Progress } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';

interface RadarEntry {
  id: string;
  title: string;
  quadrant: string;
  description?: string;
  url?: string;
  timeline: { ringId: string; date?: string }[];
}

interface RadarRing { id: string; name: string; color: string; }
interface RadarQuadrant { id: string; name: string; }
interface RadarData { quadrants: RadarQuadrant[]; rings: RadarRing[]; entries: RadarEntry[]; }

export function TechRadarPage() {
  const configApi = useApi(configApiRef);
  const [data, setData] = useState<RadarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = configApi.getOptionalString('techRadar.url') ?? '';

  useEffect(() => {
    if (!url) {
      setError('techRadar.url is not configured');
      return;
    }
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(String(e)));
  }, [url]);

  if (error) {
    return (
      <Page themeId="tool">
        <ContentHeader title="Tech Radar" />
        <Content><p style={{ color: '#f44336' }}>Error loading Tech Radar: {error}</p></Content>
      </Page>
    );
  }
  if (!data) {
    return (
      <Page themeId="tool">
        <ContentHeader title="Tech Radar" />
        <Content><Progress /></Content>
      </Page>
    );
  }

  const byQuadrant: Record<string, Record<string, RadarEntry[]>> = {};
  for (const entry of data.entries) {
    const ring = entry.timeline[entry.timeline.length - 1].ringId;
    if (!byQuadrant[entry.quadrant]) byQuadrant[entry.quadrant] = {};
    if (!byQuadrant[entry.quadrant][ring]) byQuadrant[entry.quadrant][ring] = [];
    byQuadrant[entry.quadrant][ring].push(entry);
  }
  const ringColor: Record<string, string> = {};
  for (const r of data.rings) ringColor[r.id] = r.color;

  return (
    <Page themeId="tool">
      <ContentHeader
        title="Tech Radar"
        description="Technology choices and adoption status for the andrelair-platform"
      />
      <Content>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '0 0 24px' }}>
          {data.quadrants.map(q => (
            <div
              key={q.id}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h2 style={{
                margin: '0 0 16px',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: '#90caf9',
              }}>
                {q.name}
              </h2>
              {data.rings.map(ring => {
                const entries = byQuadrant[q.id]?.[ring.id] ?? [];
                if (!entries.length) return null;
                return (
                  <div key={ring.id} style={{ marginBottom: 16 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 12,
                      background: ringColor[ring.id],
                      color: '#111',
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}>
                      {ring.name}
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {entries.map(e => (
                        <li key={e.id} style={{ marginBottom: 4, fontSize: 14 }}>
                          {e.url
                            ? (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#ce93d8', textDecoration: 'none' }}
                              >
                                {e.title}
                              </a>
                            )
                            : <span style={{ color: '#e0e0e0' }}>{e.title}</span>}
                          {e.description && (
                            <span style={{ fontSize: 12, color: '#9e9e9e', marginLeft: 6 }}>
                              — {e.description.split('.')[0]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Content>
    </Page>
  );
}
