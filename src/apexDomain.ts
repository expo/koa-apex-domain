import * as Koa from 'koa';
import { URL } from 'url';

/**
 * Returns middleware that redirects requests to `www.${domain}` to `${domain}`.
 */
export default function apexDomain(): Koa.Middleware {
  return async (ctx, next) => {
    // Our internal Kubernetes hostnames end in `${namespace}.svc.cluster.local` and if we have a
    // service named "www" we don't want to remove it from the hostname. Note that our check doesn't
    // match shorthand hostnames like `${service}.${namespace}.svc` so we need to use fully
    // qualified hostnames when we specify an internal Kubernetes hostname.
    // https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/
    const hostname = ctx.URL.hostname;
    const isInternalHostname = hostname.endsWith('svc.cluster.local');
    if (isInternalHostname) {
      await next();
      return;
    }

    // Search for both `www.${domain}` and `${tier}.www.${domain}`
    const parts = hostname.split('.');
    const wwwIndex = parts.indexOf('www');
    if (wwwIndex !== 0 && wwwIndex !== 1) {
      await next();
      return;
    }

    parts.splice(wwwIndex, 1);
    const destinationURL = new URL(ctx.URL.toString());
    destinationURL.hostname = parts.join('.');

    ctx.status = 301;
    ctx.redirect(destinationURL.toString());
  };
}
