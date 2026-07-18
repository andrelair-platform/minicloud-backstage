import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import crypto from 'crypto';

const AUTHENTIK_URL =
  process.env.AUTHENTIK_URL ?? 'https://auth.devandre.sbs';
const STALWART_URL =
  process.env.STALWART_URL ?? 'http://stalwart.mail.svc.cluster.local:8080';
const MAIL_DOMAIN = process.env.MAIL_DOMAIN ?? 'devandre.sbs';

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
    'Creates an Authentik SSO account and Stalwart mailbox for a new employee. Outputs the generated temporary password.',
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

    // ── 1. Create Authentik user ──────────────────────────────────────────
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

    // ── 2. Set initial password ───────────────────────────────────────────
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

    // ── 3. Add to department group (create group if it does not exist) ─────
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
      const createGroupRes = await fetch(`${AUTHENTIK_URL}/api/v3/core/groups/`, {
        method: 'POST',
        headers: authentikHeaders(),
        body: JSON.stringify({ name: department }),
      });
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
    await fetch(
      `${AUTHENTIK_URL}/api/v3/core/groups/${groupPk}/add_user/`,
      {
        method: 'POST',
        headers: authentikHeaders(),
        body: JSON.stringify({ pk: user.pk }),
      },
    );
    ctx.logger.info(`[authentik] User added to group "${department}"`);

    // ── 4. Create Stalwart mailbox ────────────────────────────────────────
    ctx.logger.info(`[stalwart] Creating mailbox: ${platformEmail}`);
    const mailRes = await fetch(`${STALWART_URL}/api/principal`, {
      method: 'POST',
      headers: stalwartHeaders(),
      body: JSON.stringify({
        type: 'individual',
        name: username,
        description: displayName,
        quota: 5000,
        emails: [platformEmail],
        secrets: [password],
      }),
    });
    if (!mailRes.ok) {
      const err = await mailRes.text();
      throw new Error(
        `Stalwart mailbox creation failed (${mailRes.status}): ${err}`,
      );
    }
    ctx.logger.info(`[stalwart] Mailbox created: ${platformEmail}`);

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
