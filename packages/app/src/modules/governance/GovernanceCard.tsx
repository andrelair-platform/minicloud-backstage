import { useEntity } from '@backstage/plugin-catalog-react';
import { InfoCard } from '@backstage/core-components';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Typography,
} from '@material-ui/core';

// The §8 capability-registry governance columns, read from entity annotations.
// Value conventions (per annotation): free text, a bare URL, or "Label|URL"; multiple
// entries separated by ";". The 4 "applicable" rows normally link to the BookStack intranet.
const FIELDS: ReadonlyArray<readonly [string, string]> = [
  ['Politique applicable', 'governance.ktayl-solution/applicable-policy'],
  ['Standard applicable', 'governance.ktayl-solution/applicable-standard'],
  ['Directive applicable', 'governance.ktayl-solution/applicable-guideline'],
  ['Procédure applicable', 'governance.ktayl-solution/applicable-procedure'],
  ['Contrôles requis', 'governance.ktayl-solution/required-controls'],
  ["Autorité d'approbation", 'governance.ktayl-solution/approval-authority'],
  ['Preuves requises', 'governance.ktayl-solution/evidence-required'],
];

const renderValue = (raw?: string) => {
  if (!raw) {
    return (
      <Typography variant="body2" color="textSecondary">
        —
      </Typography>
    );
  }
  return raw.split(';').map((part, i) => {
    const trimmed = part.trim();
    const [label, url] = trimmed.includes('|')
      ? trimmed.split('|')
      : [trimmed, trimmed.startsWith('http') ? trimmed : ''];
    return url ? (
      <div key={i}>
        <Link href={url.trim()} target="_blank" rel="noopener noreferrer">
          {label.trim()}
        </Link>
      </div>
    ) : (
      <div key={i}>{label.trim()}</div>
    );
  });
};

export const GovernanceCard = () => {
  const { entity } = useEntity();
  const annotations = entity.metadata.annotations ?? {};
  return (
    <InfoCard
      title="Gouvernance & conformité"
      subheader="Registre de capacités — cadre applicable (intranet)"
    >
      <Table size="small">
        <TableBody>
          {FIELDS.map(([label, key]) => (
            <TableRow key={key}>
              <TableCell
                style={{ width: '42%', fontWeight: 600, verticalAlign: 'top' }}
              >
                {label}
              </TableCell>
              <TableCell>{renderValue(annotations[key])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </InfoCard>
  );
};
