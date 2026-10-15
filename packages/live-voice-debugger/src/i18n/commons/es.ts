import type { CommonsTranslation } from './base.js';
const translation = {
  activate: 'Abrir depurador en una ventana separada',
  all: 'Todos los módulos',
  close: 'Cerrar depurador',
  content: 'Inspeccionar contenido de texto (sensible)',
  developer: 'Desarrollador',
  diagnostics: 'Diagnóstico',
  empty: 'Todavía no hay transiciones registradas.',
  error: 'La fuente de diagnóstico falló.',
  eventsClear: 'Borrar eventos',
  eventsPause: 'Pausar eventos',
  eventsResume: 'Reanudar eventos',
  filter: 'Filtrar módulos',
  freeze: 'Congelar vista',
  help: 'Árbol de estados de solo lectura actualizado a 10 Hz. Texto oculto por defecto. Este panel no controla la voz.',
  omitted: 'Elementos adicionales omitidos',
  popupBlocked:
    'El navegador bloqueó la ventana del depurador. Permita ventanas emergentes en este sitio e inténtelo de nuevo.',
  refreshRate: 'Frecuencia de actualización',
  resume: 'Reanudar actualizaciones',
  states: 'Estados actuales',
  title: 'Depurador de Voz en vivo',
  transitions: 'Transiciones de estado recientes',
  waiting: 'Esperando un runtime de Voz en vivo compatible.',
} satisfies CommonsTranslation;
export default Object.freeze(translation);
