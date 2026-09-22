export const API_ROOT = '/api/dsh-live-voice';
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
