import React from 'react';
import { withAppLanguage } from './i18n/index.js';
import { CLIENT_SLOT_DEFINITIONS, SETTINGS_SLOT } from './slotDefinitions.js';

type SlotComponents = Record<string, React.ComponentType<any>>;
export function registerSettingsSlot(
  ctx: any,
  component: React.ComponentType<any>,
  label: () => string,
) {
  return ctx.slots.inject(SETTINGS_SLOT.name, () =>
    ctx.slots.register({ ...SETTINGS_SLOT, label }, withAppLanguage(component, ctx.locale)),
  );
}
export function registerConversationSlots(
  ctx: any,
  components: SlotComponents,
  label: () => string,
) {
  return CLIENT_SLOT_DEFINITIONS.map((definition) => {
    const component = components[definition.component];
    if (!component) throw new Error(`Missing slot component: ${definition.component}`);
    return ctx.slots.inject(definition.name, () =>
      ctx.slots.register(
        { name: definition.name, id: definition.id, order: definition.order, label },
        withAppLanguage(component, ctx.locale),
      ),
    );
  });
}
