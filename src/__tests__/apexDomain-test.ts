import * as Koa from 'koa';
import { URL } from 'url';

import apexDomain from '../apexDomain';

it(`redirects www.expo.dev to expo.dev`, async () => {
  const ctx = createMockKoaContext('https://www.expo.dev/');
  const next = jest.fn(async () => {});

  const middleware = apexDomain();
  await middleware(ctx, next);

  expect(next).not.toHaveBeenCalled();
  expect(ctx.status).toBe(301);
  expect(ctx.redirect).toHaveBeenCalledWith('https://expo.dev/');
});

it(`preserves the URL protocol`, async () => {
  const ctx = createMockKoaContext('custom://www.expo.dev/');

  const middleware = apexDomain();
  await middleware(ctx, async () => {});

  expect(ctx.redirect).toHaveBeenCalledWith('custom://expo.dev/');
});

it(`redirects staging.www.expo.dev to staging.expo.dev`, async () => {
  const ctx = createMockKoaContext('https://staging.www.expo.dev/');

  const middleware = apexDomain();
  await middleware(ctx, async () => {});

  expect(ctx.redirect).toHaveBeenCalledWith('https://staging.expo.dev/');
});

it(`doesn't redirect expo.dev`, async () => {
  const ctx = createMockKoaContext('https://expo.dev/');
  const next = async (): Promise<void> => {
    ctx.status = 200;
  };

  const middleware = apexDomain();
  await middleware(ctx, next);

  expect(ctx.status).toBe(200);
  expect(ctx.redirect).not.toHaveBeenCalled();
});

it(`doesn't redirect internal Kubernetes service hosts that start with www`, async () => {
  const ctx = createMockKoaContext('http://www.production.svc.cluster.local/');
  const next = async (): Promise<void> => {
    ctx.status = 200;
  };

  const middleware = apexDomain();
  await middleware(ctx, next);

  expect(ctx.status).toBe(200);
  expect(ctx.redirect).not.toHaveBeenCalled();
});

function createMockKoaContext(urlString: string): Koa.Context {
  return {
    status: 404,
    URL: new URL(urlString),
    redirect: jest.fn(),
  } as any;
}
