/*
 * OIDC provider with an Authentik-groups sign-in resolver (IDP #5 — directory-integrated RBAC).
 *
 * Re-registers the `oidc` auth provider using the stock `oidcAuthenticator` + a CUSTOM sign-in
 * resolver that (a) resolves the Backstage user from the email local-part (same as the previous
 * config resolver) and (b) maps the Authentik **groups** claim into the identity's ownership refs
 * (`group:default/<slug>`), so the RBAC PermissionPolicy (rbacPolicy.ts) can enforce by group.
 *
 * Because this registers providerId `oidc`, the stock `@backstage/plugin-auth-backend-module-oidc-
 * provider` backend module is REMOVED from index.ts (two registrations of the same id would clash),
 * and the app-config `auth.providers.oidc.<env>.signIn.resolvers` block is dropped (this resolver
 * replaces it).
 *
 * DEFENSIVE: the resolver never throws on groups-parsing — a missing/empty/odd `groups` claim just
 * yields no group refs (→ read-only tier), it never blocks login. The only hard requirement is an
 * email in the profile (already true for every Authentik login).
 */
import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { oidcAuthenticator } from '@backstage/plugin-auth-backend-module-oidc-provider';
import { stringifyEntityRef } from '@backstage/catalog-model';

const slug = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default createBackendModule({
  pluginId: 'auth',
  moduleId: 'oidc-groups-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'oidc',
          factory: createOAuthProviderFactory({
            authenticator: oidcAuthenticator,
            async signInResolver(info, ctx) {
              const email = info.profile.email;
              if (!email) {
                throw new Error('OIDC sign-in failed: no email in the profile');
              }
              const localPart = email.split('@')[0];
              const userRef = stringifyEntityRef({
                kind: 'User',
                namespace: 'default',
                name: slug(localPart),
              });

              // Authentik `groups` claim → ownership refs (best-effort; never block login on it).
              let groupRefs: string[] = [];
              try {
                const result = info.result as unknown as {
                  userinfo?: { groups?: unknown };
                  fullProfile?: { userinfo?: { groups?: unknown } };
                };
                const groups =
                  result.fullProfile?.userinfo?.groups ?? result.userinfo?.groups;
                if (Array.isArray(groups)) {
                  groupRefs = groups
                    .filter((g): g is string => typeof g === 'string')
                    .map(g =>
                      stringifyEntityRef({
                        kind: 'Group',
                        namespace: 'default',
                        name: slug(g),
                      }),
                    );
                }
              } catch {
                // best-effort — a missing/odd groups claim must not break sign-in
              }

              return ctx.issueToken({
                claims: {
                  sub: userRef,
                  ent: [userRef, ...groupRefs],
                },
              });
            },
          }),
        });
      },
    });
  },
});
