import React from 'react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import {
  ApiBlueprint,
  createApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
} from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import { OAuth2 } from '@backstage/core-app-api';
import { SignInPage } from '@backstage/core-components';
import type {
  OAuthApi,
  OpenIdConnectApi,
  ProfileInfoApi,
  BackstageIdentityApi,
  SessionApi,
} from '@backstage/frontend-plugin-api';

export const oidcAuthApiRef = createApiRef<
  OAuthApi & OpenIdConnectApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
>({
  id: 'auth.oidc',
});

export const authModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'oidc',
      params: defineParams =>
        defineParams({
          api: oidcAuthApiRef,
          deps: {
            discoveryApi: discoveryApiRef,
            oauthRequestApi: oauthRequestApiRef,
          },
          factory: ({ discoveryApi, oauthRequestApi }) =>
            OAuth2.create({
              discoveryApi,
              oauthRequestApi,
              provider: {
                id: 'oidc',
                title: 'Authentik',
                icon: () => null,
              },
              defaultScopes: ['openid', 'email', 'profile'],
            }),
        }),
    }),
    SignInPageBlueprint.make({
      params: {
        loader: async () => (props: Parameters<typeof SignInPage>[0]) => (
          <SignInPage
            {...props}
            providers={[
              {
                id: 'oidc-auth-provider',
                title: 'Login with Authentik',
                message: 'Sign in using your Authentik SSO account',
                apiRef: oidcAuthApiRef,
              },
              'guest',
            ]}
          />
        ),
      },
    }),
  ],
});
