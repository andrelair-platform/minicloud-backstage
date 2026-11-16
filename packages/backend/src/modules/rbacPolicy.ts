/*
 * Minicloud RBAC — directory-integrated PermissionPolicy (IDP Core Component #5).
 *
 * Replaces the default `allow-all` policy with Admin / Developer (Member) / read-only tiers driven by
 * the caller's groups (`ownershipEntityRefs`) + a config admin allow-list. This is the "multi-user
 * granularity" the IDP gap analysis flagged as missing (the guardrail pattern — CODEOWNERS-on-prod +
 * Authentik SSO — already existed).
 *
 * SAFE DEFAULT: if `permission.rbac.adminRefs` is empty/unset, the policy ALLOWS everything (behaves
 * exactly like allow-all) and logs a warning. So deploying this code changes NOTHING until you opt in
 * by configuring your admin ref — zero lock-out risk on a solo platform.
 *
 * Group tiers read `ownershipEntityRefs`, which are populated once group memberships reach the
 * identity (the live-Authentik path = add `groups` to the OIDC scopes + a sign-in resolver that maps
 * the claim → ownership; or ingest Authentik users/groups as catalog entities). Until then only the
 * config admin allow-list is active.
 */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import {
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';

class MinicloudRbacPolicy implements PermissionPolicy {
  constructor(
    private readonly adminRefs: string[],
    private readonly developerGroups: string[],
  ) {}

  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    // Enforcement is OFF until admins are configured → never lock anyone out by merely deploying.
    if (this.adminRefs.length === 0) {
      return { result: AuthorizeResult.ALLOW };
    }

    const refs = user?.info.ownershipEntityRefs ?? [];
    const userRef = user?.info.userEntityRef;
    const name = request.permission.name;

    // ── Admin: everything ──────────────────────────────────────────────────
    const isAdmin =
      (!!userRef && this.adminRefs.includes(userRef)) ||
      refs.some(r => this.adminRefs.includes(r));
    if (isAdmin) {
      return { result: AuthorizeResult.ALLOW };
    }

    const isDeveloper = refs.some(r => this.developerGroups.includes(r));

    // Running a golden-path scaffolder = creating/executing a scaffolder task/action.
    const isScaffoldRun =
      name.startsWith('scaffolder.') &&
      (name.includes('execute') ||
        name.includes('task.create') ||
        name.includes('.action.'));
    // Destructive / admin mutations.
    const isMutation =
      name.includes('delete') ||
      name.includes('unregister') ||
      (name.startsWith('catalog.location') && name.includes('create')) ||
      name.startsWith('policy.entity');

    if (isDeveloper) {
      // Developer (Member): may run self-service scaffolders + read; no delete / admin.
      return isMutation
        ? { result: AuthorizeResult.DENY }
        : { result: AuthorizeResult.ALLOW };
    }

    // Authenticated but ungrouped → read-only (view catalog/docs/templates; cannot run or mutate).
    if (isScaffoldRun || isMutation) {
      return { result: AuthorizeResult.DENY };
    }
    return { result: AuthorizeResult.ALLOW };
  }
}

export default createBackendModule({
  pluginId: 'permission',
  moduleId: 'minicloud-rbac-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ policy, config, logger }) {
        const adminRefs =
          config.getOptionalStringArray('permission.rbac.adminRefs') ?? [];
        const developerGroups =
          config.getOptionalStringArray('permission.rbac.developerGroups') ?? [];

        if (adminRefs.length === 0) {
          logger.warn(
            '[rbac] permission.rbac.adminRefs is empty → policy ALLOWS all (enforcement OFF). ' +
              'Set it (e.g. user:default/<you>) to enforce Admin / Developer / read-only.',
          );
        } else {
          logger.info(
            `[rbac] enforcing — admins=${adminRefs.length}, developerGroups=${developerGroups.length}`,
          );
        }

        policy.setPolicy(new MinicloudRbacPolicy(adminRefs, developerGroups));
      },
    });
  },
});
