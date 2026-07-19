import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import crypto from 'crypto';

const AUTHENTIK_URL =
  process.env.AUTHENTIK_URL ?? 'https://auth.devandre.sbs';
const STALWART_URL =
  process.env.STALWART_URL ?? 'http://stalwart.mail.svc.cluster.local:8080';
const MAIL_DOMAIN = process.env.MAIL_DOMAIN ?? 'devandre.sbs';

const JMAP_USING = ['urn:ietf:params:jmap:core', 'urn:stalwart:jmap'];

function generatePassword(length = 20): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

function authentikHeaders(): Record<string, string> {
  const token = process.env.AUTHENTIK_API_TOKEN;
  if (!token) throw new Error('AUTHENTIK_API_TOKEN is not set');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function stalwartHeaders(): Record<string, string> {
  const pass = process.env.STALWART_ADMIN_PASSWORD;
  if (!pass) throw new Error('STALWART_ADMIN_PASSWORD is not set');
  const creds = Buffer.from(`admin:${pass}`).toString('base64');
  return {
    Authorization: `Basic ${creds}`,
    'Content-Type': 'application/json',
  };
}

async function jmapCall(methodCalls: any[]): Promise<any[]> {
  const res = await fetch(`${STALWART_URL}/jmap/`, {
    method: 'POST',
    headers: stalwartHeaders(),
    body: JSON.stringify({ using: JMAP_USING, methodCalls }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stalwart JMAP (${res.status}): ${err}`);
  }
  return (await res.json()).methodResponses;
}

// Fetches the Stalwart domain ID for MAIL_DOMAIN dynamically — avoids
// hardcoding an ID that may change if the Longhorn PVC is ever recreated.
async function getDomainId(): Promise<string> {
  const responses = await jmapCall([['x:Domain/get', { ids: null }, '0']]);
  const [, result] = responses[0];
  const domain = (result.list as Array<{ id: string; name: string }>)?.find(
    d => d.name === MAIL_DOMAIN,
  );
  if (!domain) throw new Error(`Domain "${MAIL_DOMAIN}" not found in Stalwart`);
  return domain.id;
}

const onboardEmployeeAction = createTemplateAction<{
  firstName: string;
  lastName: string;
  username: string;
  personalEmail: string;
  role: string;
  department: string;
}>({
  id: 'minicloud:onboard:employee',
  description:
    'Creates a Stalwart mailbox (email = primary identity) then an Authentik SSO account for a new employee.',
  schema: {
    input: {
      type: 'object',
      required: [
        'firstName',
        'lastName',
        'username',
        'personalEmail',
        'role',
        'department',
      ],
      properties: {
        firstName: { type: 'string', title: 'First name' },
        lastName: { type: 'string', title: 'Last name' },
        username: {
          type: 'string',
          title: 'Platform username (lowercase, no spaces)',
        },
        personalEmail: {
          type: 'string',
          title: 'Personal email (for Authentik account)',
        },
        role: { type: 'string', title: 'Job title' },
        department: { type: 'string', title: 'Department' },
      },
    },
    output: {
      type: 'object',
      properties: {
        password: { type: 'string', title: 'Generated temporary password' },
        platformEmail: { type: 'string', title: 'Platform email address' },
        authentikUserId: { type: 'number', title: 'Authentik user PK' },
      },
    },
  },
  async handler(ctx) {
    const { firstName, lastName, username, personalEmail, role, department } =
      ctx.input;
    const platformEmail = `${username}@${MAIL_DOMAIN}`;
    const password = generatePassword();
    const displayName = `${firstName} ${lastName}`;

    // ── 1. Resolve Stalwart domain ID ─────────────────────────────────────
    ctx.logger.info(`[stalwart] Resolving domain ID for "${MAIL_DOMAIN}"`);
    const domainId = await getDomainId();
    ctx.logger.info(`[stalwart] Domain ID: ${domainId}`);

    // ── 2. Create Stalwart mailbox — email is the primary identity ─────────
    // Uses JMAP x:Account/set (Stalwart v0.16+). Must succeed before Authentik
    // is touched so there are no orphan SSO accounts without a mailbox.
    ctx.logger.info(`[stalwart] Creating mailbox: ${platformEmail}`);
    const mailResponses = await jmapCall([
      [
        'x:Account/set',
        {
          create: {
            u1: {
              '@type': 'User',
              name: username,
              domainId,
              description: displayName,
              credentials: { '0': { '@type': 'Password', secret: password } },
            },
          },
        },
        '0',
      ],
    ]);
    const mailResult = mailResponses[0][1];
    if (!mailResult.created?.u1) {
      throw new Error(
        `Stalwart mailbox creation failed: ${JSON.stringify(mailResult.notCreated)}`,
      );
    }
    ctx.logger.info(`[stalwart] Mailbox created: ${platformEmail}`);

    // ── 3. Create Authentik user ──────────────────────────────────────────
    ctx.logger.info(`[authentik] Creating user: ${username}`);
    const createRes = await fetch(`${AUTHENTIK_URL}/api/v3/core/users/`, {
      method: 'POST',
      headers: authentikHeaders(),
      body: JSON.stringify({
        username,
        name: displayName,
        email: personalEmail,
        is_active: true,
        type: 'internal',
        attributes: { role, department },
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(
        `Authentik user creation failed (${createRes.status}): ${err}`,
      );
    }
    const user = (await createRes.json()) as { pk: number };
    ctx.logger.info(`[authentik] User created pk=${user.pk}`);

    // ── 4. Set Authentik password (same temp password as mailbox) ─────────
    const pwRes = await fetch(
      `${AUTHENTIK_URL}/api/v3/core/users/${user.pk}/set_password/`,
      {
        method: 'POST',
        headers: authentikHeaders(),
        body: JSON.stringify({ password }),
      },
    );
    if (!pwRes.ok) {
      const err = await pwRes.text();
      throw new Error(
        `Authentik set_password failed (${pwRes.status}): ${err}`,
      );
    }
    ctx.logger.info('[authentik] Password set');

    // ── 5. Add to department group (create group if it does not exist) ─────
    const groupsRes = await fetch(
      `${AUTHENTIK_URL}/api/v3/core/groups/?name=${encodeURIComponent(department)}`,
      { headers: authentikHeaders() },
    );
    const groupsData = (await groupsRes.json()) as {
      results: Array<{ pk: string }>;
    };
    let groupPk: string;
    if (groupsData.results.length > 0) {
      groupPk = groupsData.results[0].pk;
      ctx.logger.info(`[authentik] Found group "${department}" pk=${groupPk}`);
    } else {
      const createGroupRes = await fetch(
        `${AUTHENTIK_URL}/api/v3/core/groups/`,
        {
          method: 'POST',
          headers: authentikHeaders(),
          body: JSON.stringify({ name: department }),
        },
      );
      if (!createGroupRes.ok) {
        const err = await createGroupRes.text();
        throw new Error(`Authentik group creation failed: ${err}`);
      }
      const group = (await createGroupRes.json()) as { pk: string };
      groupPk = group.pk;
      ctx.logger.info(
        `[authentik] Created group "${department}" pk=${groupPk}`,
      );
    }
    await fetch(`${AUTHENTIK_URL}/api/v3/core/groups/${groupPk}/add_user/`, {
      method: 'POST',
      headers: authentikHeaders(),
      body: JSON.stringify({ pk: user.pk }),
    });
    ctx.logger.info(`[authentik] User added to group "${department}"`);

    ctx.output('password', password);
    ctx.output('platformEmail', platformEmail);
    ctx.output('authentikUserId', user.pk);
  },
});

export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'onboard-actions',
  register(reg) {
    reg.registerInit({
      deps: { scaffolder: scaffolderActionsExtensionPoint },
      async init({ scaffolder }) {
        scaffolder.addActions(onboardEmployeeAction);
      },
    });
  },
});
