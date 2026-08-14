# Changelog

## [0.1.1](https://github.com/andrelair-platform/minicloud-backstage/compare/minicloud-backstage-v0.1.0...minicloud-backstage-v0.1.1) (2026-08-14)


### Features

* **auth:** add OIDC sign-in page with Authentik provider ([d1e427c](https://github.com/andrelair-platform/minicloud-backstage/commit/d1e427cb0ce58a1b73718b06b27301ed7d7e6564))
* **backstage:** add minicloud-plane plugin with EntityPlaneIssuesContent tab ([a93416a](https://github.com/andrelair-platform/minicloud-backstage/commit/a93416ae6aad8f92c4ffec411027c99a5f299211))
* **backstage:** enable Kubernetes plugin for live pod view on catalog entities ([68cb70e](https://github.com/andrelair-platform/minicloud-backstage/commit/68cb70e0d8044313e8072dcd14e482bf014ff1ca))
* **catalog:** add consumesApis relationship to minicloud-plane-api ([fe81269](https://github.com/andrelair-platform/minicloud-backstage/commit/fe812691ac3e07f2b799aa934946f01ce9669107))
* **catalog:** add kubernetes-id, argocd annotations and consumesApis for markitdown+rag ([7e6dc8e](https://github.com/andrelair-platform/minicloud-backstage/commit/7e6dc8e0c9bf8bfbee19b4996138984900e17cdd))
* **catalog:** register minicloud-plane in catalog locations ([80432be](https://github.com/andrelair-platform/minicloud-backstage/commit/80432be86777d74db58fd659cc1ee62413f87dfd))
* **metrics:** expose prom-client Prometheus endpoint on port 9464 ([032eb5f](https://github.com/andrelair-platform/minicloud-backstage/commit/032eb5fddf93d620c742f55cd6da0627ea1022e3))
* **onboard:** force password change on first SSO login ([#6](https://github.com/andrelair-platform/minicloud-backstage/issues/6)) ([5a994af](https://github.com/andrelair-platform/minicloud-backstage/commit/5a994afcc65749dc308ce693afcc54affe36659c))
* phase 71 — TechDocs integration and scaffold documentation ([83943ab](https://github.com/andrelair-platform/minicloud-backstage/commit/83943abb7359e599f361daa350b6fd3c48f8fe16))
* **phase-24:** add k8s + argocd + oidc plugins, production app-config with Authentik OIDC ([bcec03f](https://github.com/andrelair-platform/minicloud-backstage/commit/bcec03f516dd38e1a8924ed2d93c693e3fd9d5e5))
* **phase-70:** add go-service scaffolder template + scaffolderPlugin to frontend ([8e4d117](https://github.com/andrelair-platform/minicloud-backstage/commit/8e4d11790dd3c777925b41b122dd15d6b07d46de))
* **scaffolder:** add custom-image template + vault:policy:create action ([038d177](https://github.com/andrelair-platform/minicloud-backstage/commit/038d1778c669bb9a7fce037a8756a102dad938d2))
* **scaffolder:** add onboard-employee template and backend action ([b77a52b](https://github.com/andrelair-platform/minicloud-backstage/commit/b77a52b72f9765131fd7cec01afdc8708c95817c))
* **scaffolder:** New BMAD Sprint template — 4 tech stacks, GitOps PR automation ([c260fd6](https://github.com/andrelair-platform/minicloud-backstage/commit/c260fd67205f581ec9da909071ced3829befd90c))
* **scaffolder:** New BMAD Sprint template — 4 tech stacks, GitOps PR automation ([c260fd6](https://github.com/andrelair-platform/minicloud-backstage/commit/c260fd67205f581ec9da909071ced3829befd90c))
* **scaffolder:** New BMAD Sprint template — 4 tech stacks, GitOps PR automation ([348a677](https://github.com/andrelair-platform/minicloud-backstage/commit/348a677ca86f36bf98c73884b4d0c8e330031a9a))
* **sidebar:** add Tech Radar link to navigation sidebar ([b1fc395](https://github.com/andrelair-platform/minicloud-backstage/commit/b1fc395e21721441ea9785340442937851563322))
* **template:** add VPA to go-service gitops skeleton base ([6070239](https://github.com/andrelair-platform/minicloud-backstage/commit/60702398fde8a3e5a98766a0bfd7779f07f11661))


### Bug Fixes

* **auth:** add configApi to OAuth2, remove guest provider ([01b903e](https://github.com/andrelair-platform/minicloud-backstage/commit/01b903eb46a6987db68dfc683c2683c598693f15))
* **auth:** remove unused React import, use any for SignInPage props to satisfy ComponentType&lt;SignInPageProps&gt; ([0e0b239](https://github.com/andrelair-platform/minicloud-backstage/commit/0e0b239abf57e37db55defc51d924d369e568f15))
* **auth:** set environment=production in OAuth2 factory for OIDC env match ([fa16037](https://github.com/andrelair-platform/minicloud-backstage/commit/fa1603700ca0b631791fc3ee455b172e9ed2aca4))
* **auth:** use ApiBlueprint callback form (defineParams) to avoid EXTENSION_FACTORY_ERROR ([81e320f](https://github.com/andrelair-platform/minicloud-backstage/commit/81e320fcc2adab72d1139402f183f44440055730))
* **ci:** add OCI Accept header to Harbor pre-flight manifest check ([63310c2](https://github.com/andrelair-platform/minicloud-backstage/commit/63310c25e303651e52ee46a15ce50e3f0b3fc04c))
* **ci:** bump-gitops creates PR instead of pushing to main directly ([4cfc1dd](https://github.com/andrelair-platform/minicloud-backstage/commit/4cfc1dd5c959f5bd37404d13d92c0ee3ac0d2d97))
* **config:** scope-&gt;additionalScopes, add grafana.domain ([633f7d9](https://github.com/andrelair-platform/minicloud-backstage/commit/633f7d9e9bea9562b4b134156de539ba9261ddda))
* **onboard-template:** align department enum to real Authentik groups ([#7](https://github.com/andrelair-platform/minicloud-backstage/issues/7)) ([bd4104d](https://github.com/andrelair-platform/minicloud-backstage/commit/bd4104dc912edf87d685b7e0faed5bd3157c8167))
* **onboard:** Stalwart-first order + JMAP v0.16 API ([#5](https://github.com/andrelair-platform/minicloud-backstage/issues/5)) ([c626a2a](https://github.com/andrelair-platform/minicloud-backstage/commit/c626a2a727918236e7966a86e0f893539f320a46))
* **plane-plugin:** restrict Plane Issues tab to annotated entities only ([3239226](https://github.com/andrelair-platform/minicloud-backstage/commit/3239226a3d3c7a0af7fe28e31c82d7f09074f01f))
* **playwright:** replace generateProjects() with explicit project config ([3b3c557](https://github.com/andrelair-platform/minicloud-backstage/commit/3b3c5572d35c3536d6a0286e72857a0fb03dccf4))
* **search:** register searchPlugin in features to provide query service ([f6cd0b2](https://github.com/andrelair-platform/minicloud-backstage/commit/f6cd0b2013b584e869c04229a233a8ac8a095059))
* **tech-radar:** hardcode JSON URL instead of relying on config visibility ([abf7298](https://github.com/andrelair-platform/minicloud-backstage/commit/abf72982d2349d0f1aa9036d955510216e9b5914))
* **tech-radar:** remove stale url from useEffect dependency array ([bda05da](https://github.com/andrelair-platform/minicloud-backstage/commit/bda05da30ffb4834b1f0823be8adc4195e7f0e7d))
* **tech-radar:** remove unused React import (react-jsx transform) ([9f798a2](https://github.com/andrelair-platform/minicloud-backstage/commit/9f798a2d496fbf4ac01c2c56d0337351ff5e9ec6))
* **tech-radar:** replace incompatible npm plugin with custom page module ([e6eab77](https://github.com/andrelair-platform/minicloud-backstage/commit/e6eab77f14a8193a95e895cc2c58e6e283f31f74))
* **tsc:** add local declaration shim for plugin-tech-radar/alpha subpath ([8a13cd7](https://github.com/andrelair-platform/minicloud-backstage/commit/8a13cd725b853f1bb986f1151d54aa500be27932))
* **tsc:** cast techRadarPlugin to any — version mismatch with frontend-plugin-api ([efd2cb5](https://github.com/andrelair-platform/minicloud-backstage/commit/efd2cb5ae566a6f9d0b997ba2445062041160c8b))
* **tsc:** resolve plugin-tech-radar/alpha via tsconfig paths instead of broken shim ([9755e11](https://github.com/andrelair-platform/minicloud-backstage/commit/9755e11227c25c454052b15a3d77a9df0deb58df))
* update yarn.lock after adding techdocs plugin ([21ad695](https://github.com/andrelair-platform/minicloud-backstage/commit/21ad6957716501b41f1b4d09d06a19d51d7f501c))

## Changelog

All notable changes to minicloud-backstage are documented here.

This file is maintained by [release-please](https://github.com/googleapis/release-please).
