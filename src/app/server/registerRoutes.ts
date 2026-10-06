export const API_ROOT = '/api/dsh-live-voice';

export function registerSettingsRoute(
  ctx: any,
  store: { load(): Promise<unknown>; save(patch: unknown): Promise<unknown> },
) {
  const dispose = ctx.connection.fetch.register({
    path: API_ROOT + '/settings',
    methods: ['GET', 'PUT'],
    requestBody: 'buffered',
    fetch: async (request: Request) => {
      const headers = { 'cache-control': 'no-store' };
      let patch: unknown;
      if (request.method === 'PUT') {
        try {
          const text = await request.text();
          if (text.length > 64000) throw new Error('too-large');
          patch = JSON.parse(text);
          if (!patch || typeof patch !== 'object' || Array.isArray(patch))
            throw new Error('invalid');
        } catch {
          return Response.json(
            { ok: false, error: { code: 'invalid-settings' } },
            { status: 400, headers },
          );
        }
      }
      try {
        const value = request.method === 'GET' ? await store.load() : await store.save(patch);
        return Response.json({ ok: true, value }, { headers });
      } catch {
        return Response.json(
          { ok: false, error: { code: 'settings-unavailable' } },
          { status: 500, headers },
        );
      }
    },
  });
  ctx.effect(() => () => dispose(), 'dsh-live-voice: remove settings route');
}

export const APP_VOICE_CONTEXT_PATH = API_ROOT + '/voice-context';
export type RouteHost = {
  handle(endpoint: string, payload: unknown, signal?: AbortSignal): unknown;
  dispose?(): unknown;
};
export function registerHostRoutes(ctx: any, path: string, host: RouteHost) {
  return ctx.connection.service(path, (endpoint: string, payload: unknown, signal?: AbortSignal) =>
    host.handle(endpoint, payload, signal),
  );
}
