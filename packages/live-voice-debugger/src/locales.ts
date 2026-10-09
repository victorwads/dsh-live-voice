export const namespace = 'dsh-live-voice-debugger';
export type DebuggerCopy = {
  activate: string;
  all: string;
  close: string;
  content: string;
  developer: string;
  empty: string;
  error: string;
  eventsClear: string;
  eventsPause: string;
  eventsResume: string;
  filter: string;
  freeze: string;
  help: string;
  omitted: string;
  popupBlocked: string;
  refreshRate: string;
  resume: string;
  states: string;
  title: string;
  transitions: string;
  waiting: string;
};
export const dictionaries: Record<string, DebuggerCopy> = {
  en: {
    activate: 'Open debugger in a separate window',
    all: 'All modules',
    close: 'Close debugger',
    content: 'Inspect text content (sensitive)',
    developer: 'Developer',
    empty: 'No transitions recorded yet.',
    error: 'Diagnostic source failed.',
    eventsClear: 'Clear events',
    eventsPause: 'Pause events',
    eventsResume: 'Resume events',
    filter: 'Filter modules',
    freeze: 'Freeze view',
    help: 'Read-only state tree updated at 10 Hz. Text is hidden by default. This panel does not control voice.',
    omitted: 'Additional items omitted',
    popupBlocked:
      'The browser blocked the debugger window. Allow popups for this site and try again.',
    refreshRate: 'Refresh rate',
    resume: 'Resume updates',
    states: 'Current states',
    title: 'Live Voice Debugger',
    transitions: 'Recent state transitions',
    waiting: 'Waiting for a compatible Live Voice runtime.',
  },
  'pt-BR': {
    activate: 'Abrir debugger em janela separada',
    all: 'Todos os módulos',
    close: 'Fechar debugger',
    content: 'Inspecionar conteúdo de texto (sensível)',
    developer: 'Desenvolvedor',
    empty: 'Nenhuma transição registrada ainda.',
    error: 'A fonte de diagnóstico falhou.',
    eventsClear: 'Limpar eventos',
    eventsPause: 'Pausar eventos',
    eventsResume: 'Retomar eventos',
    filter: 'Filtrar módulos',
    freeze: 'Congelar visualização',
    help: 'Árvore de estados somente leitura atualizada a 10 Hz. Texto oculto por padrão. Este painel não controla a voz.',
    omitted: 'Itens adicionais omitidos',
    popupBlocked:
      'O navegador bloqueou a janela do debugger. Permita pop-ups neste site e tente novamente.',
    refreshRate: 'Frequência de atualização',
    resume: 'Retomar atualizações',
    states: 'Estados atuais',
    title: 'Depurador da Voz ao Vivo',
    transitions: 'Transições de estado recentes',
    waiting: 'Aguardando um runtime da Voz ao Vivo compatível.',
  },
  es: {
    activate: 'Abrir depurador en una ventana separada',
    all: 'Todos los módulos',
    close: 'Cerrar depurador',
    content: 'Inspeccionar contenido de texto (sensible)',
    developer: 'Desarrollador',
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
  },
  fr: {
    activate: 'Ouvrir le débogueur dans une fenêtre séparée',
    all: 'Tous les modules',
    close: 'Fermer le débogueur',
    content: 'Inspecter le texte (sensible)',
    developer: 'Développeur',
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
  },
  hi: {
    activate: 'डीबगर अलग विंडो में खोलें',
    all: 'सभी मॉड्यूल',
    close: 'डीबगर बंद करें',
    content: 'टेक्स्ट सामग्री देखें (संवेदनशील)',
    developer: 'डेवलपर',
    empty: 'अभी कोई ट्रांज़िशन दर्ज नहीं है।',
    error: 'डायग्नोस्टिक स्रोत विफल हुआ।',
    eventsClear: 'इवेंट साफ़ करें',
    eventsPause: 'इवेंट रोकें',
    eventsResume: 'इवेंट फिर शुरू करें',
    filter: 'मॉड्यूल फ़िल्टर करें',
    freeze: 'दृश्य रोकें',
    help: 'केवल पढ़ने वाला स्टेट ट्री 10 Hz पर अपडेट होता है। टेक्स्ट डिफ़ॉल्ट रूप से छिपा है। यह पैनल वॉइस को नियंत्रित नहीं करता।',
    omitted: 'अतिरिक्त आइटम छिपाए गए',
    popupBlocked:
      'ब्राउज़र ने डीबगर विंडो ब्लॉक कर दी। इस साइट के लिए पॉप-अप की अनुमति दें और फिर कोशिश करें।',
    refreshRate: 'अपडेट आवृत्ति',
    resume: 'अपडेट फिर शुरू करें',
    states: 'वर्तमान स्थितियाँ',
    title: 'लाइव वॉइस डीबगर',
    transitions: 'हाल के स्टेट ट्रांज़िशन',
    waiting: 'संगत लाइव वॉइस रनटाइम की प्रतीक्षा है।',
  },
  zh: {
    activate: '在独立窗口中打开调试器',
    all: '所有模块',
    close: '关闭调试器',
    content: '查看文本内容（敏感）',
    developer: '开发者',
    empty: '尚未记录状态转换。',
    error: '诊断数据源失败。',
    eventsClear: '清除事件',
    eventsPause: '暂停事件',
    eventsResume: '恢复事件',
    filter: '筛选模块',
    freeze: '冻结视图',
    help: '只读状态树以 10 Hz 更新。默认隐藏文本。此面板不控制语音。',
    omitted: '已省略其他项目',
    popupBlocked: '浏览器阻止了调试器窗口。请允许此网站的弹出窗口，然后重试。',
    refreshRate: '更新频率',
    resume: '恢复更新',
    states: '当前状态',
    title: '实时语音调试器',
    transitions: '最近的状态转换',
    waiting: '正在等待兼容的实时语音运行时。',
  },
};
export function copyFor(locale = 'en'): DebuggerCopy {
  return dictionaries[locale] ?? dictionaries[locale.split('-')[0]] ?? dictionaries.en;
}
