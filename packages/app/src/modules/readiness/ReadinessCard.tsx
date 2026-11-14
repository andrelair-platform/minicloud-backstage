import { useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { InfoCard, Progress } from '@backstage/core-components';
import type { Entity } from '@backstage/catalog-model';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from '@material-ui/core';

// Single source of truth — the JSON the central docs scorecard emits (gen-readiness-scorecard.py).
// raw.githubusercontent.com sends `Access-Control-Allow-Origin: *`, so the browser can fetch it
// cross-origin from the Backstage SPA (the GitHub Pages URL does not reliably send CORS headers).
const DATA_URL =
  'https://raw.githubusercontent.com/andrelair-platform/minicloud-platform-docs/main/static/data/readiness-scorecard.json';

const RUBRIC: ReadonlyArray<readonly [string, string]> = [
  ['README', 'readme'],
  ['LICENSE', 'license'],
  ['CONTRIBUTING', 'contributing'],
  ['CI', 'ci'],
  ['catalog-info', 'catalog'],
  ['release-please', 'release'],
  ['Tests', 'tests'],
  ['Docs', 'docs'],
];

interface Facts {
  score: number;
  max: number;
  helm: boolean;
  kargo: boolean;
  [key: string]: boolean | number;
}

// Map a catalog entity to its repo name — prefer the github project-slug annotation
// (`andrelair-platform/<repo>`), fall back to the entity name.
const repoOf = (entity: Entity): string => {
  const slug = entity.metadata.annotations?.['github.com/project-slug'];
  if (slug && slug.includes('/')) return slug.split('/')[1];
  return entity.metadata.name;
};

export const ReadinessCard = () => {
  const { entity } = useEntity();
  const repo = repoOf(entity);
  // undefined = loading · null = repo not in the scorecard · Facts = loaded
  const [facts, setFacts] = useState<Facts | null | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    let active = true;
    fetch(DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (active) setFacts((json.repos?.[repo] as Facts) ?? null);
      })
      .catch(e => {
        if (active) setError(e as Error);
      });
    return () => {
      active = false;
    };
  }, [repo]);

  const title = 'Golden-path readiness';

  if (error) {
    return (
      <InfoCard title={title}>
        <Typography variant="body2" color="error">
          Couldn’t load the readiness scorecard ({String(error.message)}).
        </Typography>
      </InfoCard>
    );
  }
  if (facts === undefined) {
    return (
      <InfoCard title={title}>
        <Progress />
      </InfoCard>
    );
  }
  if (facts === null) {
    return (
      <InfoCard title={title}>
        <Typography variant="body2" color="textSecondary">
          {repo} is not in the readiness scorecard yet.
        </Typography>
      </InfoCard>
    );
  }

  const deployLabel = (f: Facts): string => {
    if (f.kargo) return '🚀 Kargo (dev→prod)';
    if (f.helm) return 'Helm wrapper chart';
    return '—';
  };
  const deploy = deployLabel(facts);

  return (
    <InfoCard title={title} subheader={`${repo} — ${facts.score}/${facts.max}`}>
      <Table size="small">
        <TableBody>
          {RUBRIC.map(([label, key]) => (
            <TableRow key={key}>
              <TableCell style={{ width: '60%' }}>{label}</TableCell>
              <TableCell>{facts[key] ? '✅' : '⬜'}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell style={{ fontWeight: 600 }}>Deploy</TableCell>
            <TableCell>{deploy}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </InfoCard>
  );
};
