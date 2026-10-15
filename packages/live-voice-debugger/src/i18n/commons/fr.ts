import type { CommonsTranslation } from './base.js';
const translation = {
  activate: 'Ouvrir le débogueur dans une fenêtre séparée',
  all: 'Tous les modules',
  close: 'Fermer le débogueur',
  content: 'Inspecter le texte (sensible)',
  developer: 'Développeur',
  diagnostics: 'Diagnostic',
  empty: 'Aucune transition enregistrée.',
  error: 'La source de diagnostic a échoué.',
  eventsClear: 'Effacer les événements',
  eventsPause: 'Suspendre les événements',
  eventsResume: 'Reprendre les événements',
  filter: 'Filtrer les modules',
  freeze: 'Figer la vue',
  help: 'Arbre des états en lecture seule actualisé à 10 Hz. Texte masqué par défaut. Ce panneau ne contrôle pas la voix.',
  omitted: 'Éléments supplémentaires masqués',
  popupBlocked:
    'Le navigateur a bloqué la fenêtre du débogueur. Autorisez les fenêtres contextuelles pour ce site et réessayez.',
  refreshRate: 'Fréquence de mise à jour',
  resume: 'Reprendre les mises à jour',
  states: 'États actuels',
  title: 'Débogueur Voix en direct',
  transitions: 'Transitions récentes des états',
  waiting: 'En attente d’un runtime Voix en direct compatible.',
} satisfies CommonsTranslation;
export default Object.freeze(translation);
