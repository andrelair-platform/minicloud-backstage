import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

const VAULT_ADDR =
  process.env.VAULT_ADDR ?? 'https://vault.devandre.sbs';

function vaultHeaders(): Record<string, string> {
  const token = process.env.VAULT_SCAFFOLDER_TOKEN;
  if (!token) {
    throw new Error(
      'VAULT_SCAFFOLDER_TOKEN is not set — cannot provision Vault resources',
    );
  }
  return { 'X-Vault-Token': token, 'Content-Type': 'application/json' };
}

async function vaultPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${VAULT_ADDR}/v1/${path}`, {
    method: 'PUT',
    headers: vaultHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vault PUT ${path} failed (${res.status}): ${text}`);
  }
}

async function vaultPost(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${VAULT_ADDR}/v1/${path}`, {
    method: 'POST',
    headers: vaultHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vault POST ${path} failed (${res.status}): ${text}`);
  }
}

const vaultPolicyAction = createTemplateAction<{ name: string }>({
  id: 'vault:policy:create',
  description:
    'Creates a Vault policy, seeds initial KV secrets, and registers a Kubernetes auth role for a new service.',
  schema: {
    input: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          title: 'Service name',
          description: 'Kebab-case service name (matches repo name).',
        },
      },
    },
  },
  async handler(ctx) {
    const { name } = ctx.input;

    ctx.logger.info(`[vault] Creating policy for service: ${name}`);

    // 1. Create read-only policy for the service's own secrets
    await vaultPut(`sys/policy/${name}`, {
      policy: [
        `path "secret/data/platform/${name}/*" {`,
        '  capabilities = ["read"]',
        '}',
        `path "secret/metadata/platform/${name}/*" {`,
        '  capabilities = ["list"]',
        '}',
      ].join('\n'),
    });
    ctx.logger.info(`[vault] Policy ${name} created`);

    // 2. Seed initial KV secrets so the service starts without a 404
    await vaultPost(`secret/data/platform/${name}/config`, {
      data: { environment: 'dev', log_level: 'info' },
    });
    ctx.logger.info(`[vault] Initial secrets seeded at secret/platform/${name}/config`);

    // 3. Create a Kubernetes auth role bound to the service's namespaces
    await vaultPost(`auth/kubernetes/role/${name}`, {
      bound_service_account_names: [name],
      bound_service_account_namespaces: [
        `${name}-dev`,
        `${name}-staging`,
        `${name}-prod`,
      ],
      policies: [name],
      ttl: '1h',
    });
    ctx.logger.info(`[vault] Kubernetes auth role ${name} created`);
  },
});

export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-actions',
  register(reg) {
    reg.registerInit({
      deps: { scaffolder: scaffolderActionsExtensionPoint },
      async init({ scaffolder }) {
        scaffolder.addActions(vaultPolicyAction);
      },
    });
  },
});
