// Shim: plugin-tech-radar 0.7.4 exports map lacks typesVersions entry for /alpha,
// so TypeScript cannot resolve the subpath without this declaration.
declare module '@backstage/plugin-tech-radar/alpha' {
  export { default, techRadarApi, techRadarPage } from '@backstage/plugin-tech-radar';
}
