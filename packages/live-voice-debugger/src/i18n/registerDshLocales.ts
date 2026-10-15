import { dictionaries, Langs } from './catalogs.js';
export const namespace = 'dsh-live-voice-debugger';
/** DSH owns UI locale selection; flatten only at its namespace registration seam. */
export function registerDshLocales(ctx: any) {
  const registered = new Set(
    (ctx.locale.getSnapshot?.().locales ?? []).map((locale: { id: string }) =>
      locale.id.toLowerCase(),
    ),
  );
  for (const [id, language] of Object.entries(Langs)) {
    if (!registered.has(id.toLowerCase())) {
      ctx.effect(
        () => ctx.locale.addLanguage({ id, label: language.name, shortLabel: language.short }),
        namespace + ': ' + id + ' language',
      );
      registered.add(id.toLowerCase());
    }
  }
  for (const [locale, tree] of Object.entries(dictionaries)) {
    const dictionary = Object.fromEntries(
      Object.entries(tree).flatMap(([group, entries]) =>
        Object.entries(entries).map(([key, value]) => [group + '.' + key, value]),
      ),
    );
    ctx.effect(() => ctx.locale.register(namespace, locale, dictionary), namespace + ': ' + locale);
  }
  return ctx.locale.bind(namespace);
}
