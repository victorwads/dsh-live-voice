window.__ModuleLoader__.load({id:"dsh-live-voice-debugger",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/apply.tsx
var apply_exports = {};
__export(apply_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(apply_exports);
var import_react3 = __toESM(require("react"), 1);
var import_client = require("react-dom/client");

// src/DebuggerPanel.tsx
var import_react2 = __toESM(require("react"), 1);

// ../live-voice/src/modules/core/diagnostics.ts
var DIAGNOSTIC_KEY = /* @__PURE__ */ Symbol.for("dsh-live-voice.diagnostics.v1");
var DIAGNOSTIC_CHANGED = "dsh-live-voice:diagnostics-changed";

// src/inspector.ts
function createInspector(source, now = Date.now, limit = 200) {
  let previous = null;
  let sequence = 0;
  let paused = false;
  let entries = [];
  function record() {
    const next = source.read();
    if (paused) {
      previous = next;
      return;
    }
    for (const [sessionId, session] of Object.entries(next?.sessions ?? {})) {
      for (const [module2, value] of Object.entries(session)) {
        const normalized = module2 === "capture" ? { ...value, level: null } : value;
        const old = previous?.sessions?.[sessionId]?.[module2];
        const before = module2 === "capture" && old ? { ...old, level: null } : old;
        if (previous && JSON.stringify(before) !== JSON.stringify(normalized)) {
          entries.push({
            sequence: ++sequence,
            timeMs: now(),
            sessionId,
            module: module2,
            level: module2 === "error" && value?.present ? "error" : "debug",
            before: before ?? null,
            after: normalized
          });
        }
      }
    }
    entries = entries.slice(-Math.max(1, limit));
    previous = next;
  }
  record();
  const unsubscribe = source.subscribe(() => {
    try {
      record();
    } catch {
    }
  });
  return {
    read(includeContent = false) {
      record();
      return { state: source.read({ includeContent }), transitions: [...entries] };
    },
    setPaused(value) {
      previous = source.read();
      paused = value;
    },
    clear() {
      previous = source.read();
      entries = [];
    },
    dispose() {
      unsubscribe();
      previous = null;
      entries = [];
    }
  };
}

// src/StateTree.tsx
var import_react = __toESM(require("react"), 1);
function StateTree({
  name,
  value,
  omitted,
  depth = 0
}) {
  if (value === null || typeof value !== "object")
    return /* @__PURE__ */ import_react.default.createElement("div", { className: "dlvd-leaf" }, /* @__PURE__ */ import_react.default.createElement("code", null, name), /* @__PURE__ */ import_react.default.createElement("span", { "data-kind": typeof value }, String(value)));
  const entries = Object.entries(value);
  return /* @__PURE__ */ import_react.default.createElement("details", { className: "dlvd-branch", open: depth < 3 }, /* @__PURE__ */ import_react.default.createElement("summary", null, /* @__PURE__ */ import_react.default.createElement("code", null, name), /* @__PURE__ */ import_react.default.createElement("small", null, Array.isArray(value) ? "[" + entries.length + "]" : "{" + entries.length + "}")), entries.slice(0, 100).map(([key, child]) => /* @__PURE__ */ import_react.default.createElement(StateTree, { key, name: key, value: child, omitted, depth: depth + 1 })), entries.length > 100 && /* @__PURE__ */ import_react.default.createElement("p", null, omitted));
}

// src/DebuggerPanel.tsx
function DebuggerPanel({
  copy,
  onClose,
  target = window
}) {
  const [frozen, setFrozen] = import_react2.default.useState(false);
  const [refreshHz, setRefreshHz] = import_react2.default.useState(10);
  const updateRef = import_react2.default.useRef(null);
  const [content, setContent] = import_react2.default.useState(false);
  const [module2, setModule] = import_react2.default.useState("");
  const [view, setView] = import_react2.default.useState(null);
  const [failed, setFailed] = import_react2.default.useState(false);
  const [eventsPaused, setEventsPaused] = import_react2.default.useState(false);
  const pausedRef = import_react2.default.useRef(false);
  const inspectorRef = import_react2.default.useRef(null);
  import_react2.default.useEffect(() => {
    if (frozen) return;
    let inspector = null;
    let source = null;
    const update = () => {
      try {
        const next = target[DIAGNOSTIC_KEY];
        if (next !== source) {
          inspector?.dispose();
          inspector = null;
          source = next?.version === 1 ? next : null;
          if (source) {
            inspector = createInspector(source);
            inspector.setPaused(pausedRef.current);
          }
          inspectorRef.current = inspector;
        }
        setView(inspector?.read(content) ?? null);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    };
    update();
    updateRef.current = update;
    target.addEventListener(DIAGNOSTIC_CHANGED, update);
    return () => {
      updateRef.current = null;
      target.removeEventListener(DIAGNOSTIC_CHANGED, update);
      inspector?.dispose();
      inspectorRef.current = null;
    };
  }, [frozen, content, target]);
  import_react2.default.useEffect(() => {
    if (frozen) return;
    const timer = setInterval(() => updateRef.current?.(), 1e3 / refreshHz);
    return () => clearInterval(timer);
  }, [frozen, refreshHz]);
  const modules = [...new Set(view?.transitions.map((entry) => entry.module) ?? [])].sort();
  return /* @__PURE__ */ import_react2.default.createElement("aside", { className: "dlvd-panel", "aria-label": copy.title }, /* @__PURE__ */ import_react2.default.createElement("header", null, /* @__PURE__ */ import_react2.default.createElement("strong", null, copy.title), /* @__PURE__ */ import_react2.default.createElement("span", null, refreshHz, " Hz"), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: onClose, "aria-label": copy.close }, "\xD7")), /* @__PURE__ */ import_react2.default.createElement("p", null, copy.help), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dlvd-toolbar" }, /* @__PURE__ */ import_react2.default.createElement("label", null, copy.refreshRate, /* @__PURE__ */ import_react2.default.createElement("select", { value: refreshHz, onChange: (event) => setRefreshHz(Number(event.target.value)) }, [1, 2, 5, 10, 20].map((hz) => /* @__PURE__ */ import_react2.default.createElement("option", { key: hz, value: hz }, hz, " Hz")))), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => setFrozen(!frozen) }, frozen ? copy.resume : copy.freeze), /* @__PURE__ */ import_react2.default.createElement("label", null, /* @__PURE__ */ import_react2.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: content,
      onChange: (event) => {
        setView(null);
        setFrozen(false);
        setContent(event.target.checked);
      }
    }
  ), copy.content)), failed ? /* @__PURE__ */ import_react2.default.createElement("p", { role: "alert" }, copy.error) : !view ? /* @__PURE__ */ import_react2.default.createElement("p", { role: "status" }, copy.waiting) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "dlvd-columns" }, /* @__PURE__ */ import_react2.default.createElement("section", { className: "dlvd-state-pane", "aria-label": copy.states }, /* @__PURE__ */ import_react2.default.createElement("h3", null, copy.states), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dlvd-scroll", tabIndex: 0 }, /* @__PURE__ */ import_react2.default.createElement(StateTree, { name: "context", value: view.state, omitted: copy.omitted }))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "dlvd-event-pane", "aria-label": copy.transitions }, /* @__PURE__ */ import_react2.default.createElement("h3", null, copy.transitions), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dlvd-toolbar" }, /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      "aria-pressed": eventsPaused,
      onClick: () => {
        const paused = !eventsPaused;
        inspectorRef.current?.setPaused(paused);
        pausedRef.current = paused;
        setEventsPaused(paused);
      }
    },
    eventsPaused ? copy.eventsResume : copy.eventsPause
  ), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        inspectorRef.current?.clear();
        setView((current) => current ? { ...current, transitions: [] } : current);
      }
    },
    copy.eventsClear
  )), /* @__PURE__ */ import_react2.default.createElement("label", null, copy.filter, /* @__PURE__ */ import_react2.default.createElement("select", { value: module2, onChange: (event) => setModule(event.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "" }, copy.all), modules.map((name) => /* @__PURE__ */ import_react2.default.createElement("option", { key: name }, name)))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "dlvd-history dlvd-scroll", tabIndex: 0 }, view.transitions.filter((entry) => !module2 || entry.module === module2).slice().reverse().map((entry) => /* @__PURE__ */ import_react2.default.createElement("details", { key: entry.sequence, "data-level": entry.level }, /* @__PURE__ */ import_react2.default.createElement("summary", null, /* @__PURE__ */ import_react2.default.createElement("small", null, new Date(entry.timeMs).toLocaleTimeString()), " ", /* @__PURE__ */ import_react2.default.createElement("code", null, entry.sessionId, " / ", entry.module)), /* @__PURE__ */ import_react2.default.createElement(StateTree, { name: "before", value: entry.before, omitted: copy.omitted }), /* @__PURE__ */ import_react2.default.createElement(StateTree, { name: "after", value: entry.after, omitted: copy.omitted }))), !view.transitions.length && /* @__PURE__ */ import_react2.default.createElement("p", null, copy.empty)))));
}

// src/locales.ts
var namespace = "dsh-live-voice-debugger";
var dictionaries = {
  en: {
    activate: "Open debugger in a separate window",
    all: "All modules",
    close: "Close debugger",
    content: "Inspect text content (sensitive)",
    developer: "Developer",
    empty: "No transitions recorded yet.",
    error: "Diagnostic source failed.",
    eventsClear: "Clear events",
    eventsPause: "Pause events",
    eventsResume: "Resume events",
    filter: "Filter modules",
    freeze: "Freeze view",
    help: "Read-only state tree updated at 10 Hz. Text is hidden by default. This panel does not control voice.",
    omitted: "Additional items omitted",
    popupBlocked: "The browser blocked the debugger window. Allow popups for this site and try again.",
    refreshRate: "Refresh rate",
    resume: "Resume updates",
    states: "Current states",
    title: "Live Voice Debugger",
    transitions: "Recent state transitions",
    waiting: "Waiting for a compatible Live Voice runtime."
  },
  "pt-BR": {
    activate: "Abrir debugger em janela separada",
    all: "Todos os m\xF3dulos",
    close: "Fechar debugger",
    content: "Inspecionar conte\xFAdo de texto (sens\xEDvel)",
    developer: "Desenvolvedor",
    empty: "Nenhuma transi\xE7\xE3o registrada ainda.",
    error: "A fonte de diagn\xF3stico falhou.",
    eventsClear: "Limpar eventos",
    eventsPause: "Pausar eventos",
    eventsResume: "Retomar eventos",
    filter: "Filtrar m\xF3dulos",
    freeze: "Congelar visualiza\xE7\xE3o",
    help: "\xC1rvore de estados somente leitura atualizada a 10 Hz. Texto oculto por padr\xE3o. Este painel n\xE3o controla a voz.",
    omitted: "Itens adicionais omitidos",
    popupBlocked: "O navegador bloqueou a janela do debugger. Permita pop-ups neste site e tente novamente.",
    refreshRate: "Frequ\xEAncia de atualiza\xE7\xE3o",
    resume: "Retomar atualiza\xE7\xF5es",
    states: "Estados atuais",
    title: "Depurador da Voz ao Vivo",
    transitions: "Transi\xE7\xF5es de estado recentes",
    waiting: "Aguardando um runtime da Voz ao Vivo compat\xEDvel."
  },
  es: {
    activate: "Abrir depurador en una ventana separada",
    all: "Todos los m\xF3dulos",
    close: "Cerrar depurador",
    content: "Inspeccionar contenido de texto (sensible)",
    developer: "Desarrollador",
    empty: "Todav\xEDa no hay transiciones registradas.",
    error: "La fuente de diagn\xF3stico fall\xF3.",
    eventsClear: "Borrar eventos",
    eventsPause: "Pausar eventos",
    eventsResume: "Reanudar eventos",
    filter: "Filtrar m\xF3dulos",
    freeze: "Congelar vista",
    help: "\xC1rbol de estados de solo lectura actualizado a 10 Hz. Texto oculto por defecto. Este panel no controla la voz.",
    omitted: "Elementos adicionales omitidos",
    popupBlocked: "El navegador bloque\xF3 la ventana del depurador. Permita ventanas emergentes en este sitio e int\xE9ntelo de nuevo.",
    refreshRate: "Frecuencia de actualizaci\xF3n",
    resume: "Reanudar actualizaciones",
    states: "Estados actuales",
    title: "Depurador de Voz en vivo",
    transitions: "Transiciones de estado recientes",
    waiting: "Esperando un runtime de Voz en vivo compatible."
  },
  fr: {
    activate: "Ouvrir le d\xE9bogueur dans une fen\xEAtre s\xE9par\xE9e",
    all: "Tous les modules",
    close: "Fermer le d\xE9bogueur",
    content: "Inspecter le texte (sensible)",
    developer: "D\xE9veloppeur",
    empty: "Aucune transition enregistr\xE9e.",
    error: "La source de diagnostic a \xE9chou\xE9.",
    eventsClear: "Effacer les \xE9v\xE9nements",
    eventsPause: "Suspendre les \xE9v\xE9nements",
    eventsResume: "Reprendre les \xE9v\xE9nements",
    filter: "Filtrer les modules",
    freeze: "Figer la vue",
    help: "Arbre des \xE9tats en lecture seule actualis\xE9 \xE0 10 Hz. Texte masqu\xE9 par d\xE9faut. Ce panneau ne contr\xF4le pas la voix.",
    omitted: "\xC9l\xE9ments suppl\xE9mentaires masqu\xE9s",
    popupBlocked: "Le navigateur a bloqu\xE9 la fen\xEAtre du d\xE9bogueur. Autorisez les fen\xEAtres contextuelles pour ce site et r\xE9essayez.",
    refreshRate: "Fr\xE9quence de mise \xE0 jour",
    resume: "Reprendre les mises \xE0 jour",
    states: "\xC9tats actuels",
    title: "D\xE9bogueur Voix en direct",
    transitions: "Transitions r\xE9centes des \xE9tats",
    waiting: "En attente d\u2019un runtime Voix en direct compatible."
  },
  hi: {
    activate: "\u0921\u0940\u092C\u0917\u0930 \u0905\u0932\u0917 \u0935\u093F\u0902\u0921\u094B \u092E\u0947\u0902 \u0916\u094B\u0932\u0947\u0902",
    all: "\u0938\u092D\u0940 \u092E\u0949\u0921\u094D\u092F\u0942\u0932",
    close: "\u0921\u0940\u092C\u0917\u0930 \u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
    content: "\u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0926\u0947\u0916\u0947\u0902 (\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932)",
    developer: "\u0921\u0947\u0935\u0932\u092A\u0930",
    empty: "\u0905\u092D\u0940 \u0915\u094B\u0908 \u091F\u094D\u0930\u093E\u0902\u091C\u093C\u093F\u0936\u0928 \u0926\u0930\u094D\u091C \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    error: "\u0921\u093E\u092F\u0917\u094D\u0928\u094B\u0938\u094D\u091F\u093F\u0915 \u0938\u094D\u0930\u094B\u0924 \u0935\u093F\u092B\u0932 \u0939\u0941\u0906\u0964",
    eventsClear: "\u0907\u0935\u0947\u0902\u091F \u0938\u093E\u092B\u093C \u0915\u0930\u0947\u0902",
    eventsPause: "\u0907\u0935\u0947\u0902\u091F \u0930\u094B\u0915\u0947\u0902",
    eventsResume: "\u0907\u0935\u0947\u0902\u091F \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    filter: "\u092E\u0949\u0921\u094D\u092F\u0942\u0932 \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0915\u0930\u0947\u0902",
    freeze: "\u0926\u0943\u0936\u094D\u092F \u0930\u094B\u0915\u0947\u0902",
    help: "\u0915\u0947\u0935\u0932 \u092A\u0922\u093C\u0928\u0947 \u0935\u093E\u0932\u093E \u0938\u094D\u091F\u0947\u091F \u091F\u094D\u0930\u0940 10 Hz \u092A\u0930 \u0905\u092A\u0921\u0947\u091F \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u091F\u0947\u0915\u094D\u0938\u094D\u091F \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F \u0930\u0942\u092A \u0938\u0947 \u091B\u093F\u092A\u093E \u0939\u0948\u0964 \u092F\u0939 \u092A\u0948\u0928\u0932 \u0935\u0949\u0907\u0938 \u0915\u094B \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093E\u0964",
    omitted: "\u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 \u0906\u0907\u091F\u092E \u091B\u093F\u092A\u093E\u090F \u0917\u090F",
    popupBlocked: "\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0928\u0947 \u0921\u0940\u092C\u0917\u0930 \u0935\u093F\u0902\u0921\u094B \u092C\u094D\u0932\u0949\u0915 \u0915\u0930 \u0926\u0940\u0964 \u0907\u0938 \u0938\u093E\u0907\u091F \u0915\u0947 \u0932\u093F\u090F \u092A\u0949\u092A-\u0905\u092A \u0915\u0940 \u0905\u0928\u0941\u092E\u0924\u093F \u0926\u0947\u0902 \u0914\u0930 \u092B\u093F\u0930 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964",
    refreshRate: "\u0905\u092A\u0921\u0947\u091F \u0906\u0935\u0943\u0924\u094D\u0924\u093F",
    resume: "\u0905\u092A\u0921\u0947\u091F \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    states: "\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0938\u094D\u0925\u093F\u0924\u093F\u092F\u093E\u0901",
    title: "\u0932\u093E\u0907\u0935 \u0935\u0949\u0907\u0938 \u0921\u0940\u092C\u0917\u0930",
    transitions: "\u0939\u093E\u0932 \u0915\u0947 \u0938\u094D\u091F\u0947\u091F \u091F\u094D\u0930\u093E\u0902\u091C\u093C\u093F\u0936\u0928",
    waiting: "\u0938\u0902\u0917\u0924 \u0932\u093E\u0907\u0935 \u0935\u0949\u0907\u0938 \u0930\u0928\u091F\u093E\u0907\u092E \u0915\u0940 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0939\u0948\u0964"
  },
  zh: {
    activate: "\u5728\u72EC\u7ACB\u7A97\u53E3\u4E2D\u6253\u5F00\u8C03\u8BD5\u5668",
    all: "\u6240\u6709\u6A21\u5757",
    close: "\u5173\u95ED\u8C03\u8BD5\u5668",
    content: "\u67E5\u770B\u6587\u672C\u5185\u5BB9\uFF08\u654F\u611F\uFF09",
    developer: "\u5F00\u53D1\u8005",
    empty: "\u5C1A\u672A\u8BB0\u5F55\u72B6\u6001\u8F6C\u6362\u3002",
    error: "\u8BCA\u65AD\u6570\u636E\u6E90\u5931\u8D25\u3002",
    eventsClear: "\u6E05\u9664\u4E8B\u4EF6",
    eventsPause: "\u6682\u505C\u4E8B\u4EF6",
    eventsResume: "\u6062\u590D\u4E8B\u4EF6",
    filter: "\u7B5B\u9009\u6A21\u5757",
    freeze: "\u51BB\u7ED3\u89C6\u56FE",
    help: "\u53EA\u8BFB\u72B6\u6001\u6811\u4EE5 10 Hz \u66F4\u65B0\u3002\u9ED8\u8BA4\u9690\u85CF\u6587\u672C\u3002\u6B64\u9762\u677F\u4E0D\u63A7\u5236\u8BED\u97F3\u3002",
    omitted: "\u5DF2\u7701\u7565\u5176\u4ED6\u9879\u76EE",
    popupBlocked: "\u6D4F\u89C8\u5668\u963B\u6B62\u4E86\u8C03\u8BD5\u5668\u7A97\u53E3\u3002\u8BF7\u5141\u8BB8\u6B64\u7F51\u7AD9\u7684\u5F39\u51FA\u7A97\u53E3\uFF0C\u7136\u540E\u91CD\u8BD5\u3002",
    refreshRate: "\u66F4\u65B0\u9891\u7387",
    resume: "\u6062\u590D\u66F4\u65B0",
    states: "\u5F53\u524D\u72B6\u6001",
    title: "\u5B9E\u65F6\u8BED\u97F3\u8C03\u8BD5\u5668",
    transitions: "\u6700\u8FD1\u7684\u72B6\u6001\u8F6C\u6362",
    waiting: "\u6B63\u5728\u7B49\u5F85\u517C\u5BB9\u7684\u5B9E\u65F6\u8BED\u97F3\u8FD0\u884C\u65F6\u3002"
  }
};

// src/styles.ts
var styles = `
.dlvd-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;flex:1;min-height:0;overflow:hidden}.dlvd-state-pane,.dlvd-event-pane{display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden}.dlvd-event-pane{border-left:1px solid #344154;padding-left:16px}.dlvd-columns h3{margin:0 0 10px}.dlvd-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding-right:8px}.dlvd-scroll:focus-visible{outline:2px solid #8db9ff;outline-offset:-2px}.dlvd-history summary{overflow-wrap:anywhere}.dlvd-panel>header,.dlvd-panel>p,.dlvd-panel>.dlvd-toolbar{flex-shrink:0}

.dlvd-window{margin:0;background:#101722;color:#e6edf5;color-scheme:dark}.dlvd-window .dlvd-panel{position:static;width:100%;height:100dvh;max-height:none;min-width:0;resize:none;border:0;border-radius:0;box-shadow:none}
.dlvd-panel{position:fixed;right:16px;top:16px;width:min(520px,calc(100vw - 32px));height:80vh;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;z-index:1000;padding:16px;border:1px solid #526177;border-radius:14px;background:#101722;color:#e6edf5;box-shadow:0 12px 40px #0008;font:13px/1.6 system-ui;resize:both;min-width:280px;box-sizing:border-box;color-scheme:dark}
.dlvd-panel header{display:flex;align-items:center;gap:12px;position:sticky;top:-16px;background:#101722;padding:8px 0;z-index:1}.dlvd-panel header strong{flex:1}.dlvd-panel button,.dlvd-panel select{background:#243247;color:#e6edf5;border:1px solid #526177;border-radius:6px;padding:5px 9px;cursor:pointer}.dlvd-panel button:focus-visible,.dlvd-panel summary:focus-visible{outline:2px solid #8db9ff}.dlvd-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.dlvd-panel p{color:#aebed1}.dlvd-branch{margin-left:10px;border-left:1px solid #344154;padding-left:9px}.dlvd-branch summary{cursor:pointer;padding:3px 0}.dlvd-panel small{color:#aebed1;margin-left:8px}.dlvd-leaf{display:flex;gap:12px;justify-content:space-between;padding:2px 0;overflow-wrap:anywhere}.dlvd-leaf code{color:#b4c9e4}.dlvd-leaf span{white-space:pre-wrap;text-align:right;max-width:65%}.dlvd-leaf [data-kind=boolean]{color:#c8a5ff}.dlvd-leaf [data-kind=number]{color:#7cdbb6}.dlvd-history{margin-top:12px}.dlvd-history>details{border-top:1px solid #344154;padding:6px 0}.dlvd-history [data-level=error]{border-left:3px solid #ff8a8a;padding-left:8px}
`;

// ../live-voice/src/modules/core/developerExtension.ts
var DEVELOPER_KEY = /* @__PURE__ */ Symbol.for("dsh-live-voice.developer.v1");
var DEVELOPER_CHANGED = "dsh-live-voice:developer-changed";
function publishDeveloperExtension(target, extension) {
  const ChangedEvent = target.Event ?? Event;
  target[DEVELOPER_KEY] = extension;
  target.dispatchEvent(new ChangedEvent(DEVELOPER_CHANGED));
  return () => {
    if (target[DEVELOPER_KEY] !== extension) return;
    delete target[DEVELOPER_KEY];
    target.dispatchEvent(new ChangedEvent(DEVELOPER_CHANGED));
  };
}

// src/apply.tsx
var inject = ["locale"];
function apply(ctx) {
  let enabled = false;
  let blocked = false;
  let popup = null;
  let root = null;
  let closedTimer = null;
  const listeners = /* @__PURE__ */ new Set();
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const notify = () => {
    for (const listener of listeners) listener();
  };
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    ctx.effect(() => ctx.locale.register(namespace, locale, dictionary), namespace + ": " + locale);
  }
  const t = ctx.locale.bind(namespace);
  const copy = () => Object.fromEntries(Object.keys(dictionaries.en).map((key) => [key, t(key)]));
  const localeSubscribe = (listener) => ctx.locale.subscribe(listener);
  const localeSnapshot = () => ctx.locale.getSnapshot();
  const close = () => {
    if (closedTimer !== null) clearInterval(closedTimer);
    closedTimer = null;
    const oldRoot = root;
    const oldPopup = popup;
    root = null;
    popup = null;
    enabled = false;
    oldRoot?.unmount();
    if (oldPopup && !oldPopup.closed) oldPopup.close();
    notify();
  };
  function Host() {
    import_react3.default.useSyncExternalStore(localeSubscribe, localeSnapshot);
    const labels = copy();
    import_react3.default.useEffect(() => {
      if (popup && !popup.closed) popup.document.title = labels.title;
    }, [labels.title]);
    return /* @__PURE__ */ import_react3.default.createElement(DebuggerPanel, { copy: labels, target: window, onClose: () => queueMicrotask(close) });
  }
  const open = () => {
    if (popup && !popup.closed) {
      popup.focus();
      return;
    }
    close();
    blocked = false;
    let candidate = null;
    try {
      candidate = window.open(
        "",
        "",
        "popup=yes,width=720,height=850,resizable=yes,scrollbars=yes"
      );
      if (!candidate) {
        blocked = true;
        notify();
        return;
      }
      popup = candidate;
      const doc = candidate.document;
      doc.title = copy().title;
      doc.body.replaceChildren();
      doc.body.className = "dlvd-window";
      const style = doc.createElement("style");
      style.textContent = styles;
      doc.head.appendChild(style);
      const container = doc.createElement("div");
      container.dataset.plugin = namespace;
      doc.body.appendChild(container);
      root = (0, import_client.createRoot)(container);
      root.render(/* @__PURE__ */ import_react3.default.createElement(Host, null));
      enabled = true;
      closedTimer = setInterval(() => {
        if (popup?.closed) close();
      }, 250);
      notify();
    } catch {
      close();
      if (candidate && !candidate.closed) candidate.close();
      blocked = true;
      notify();
    }
  };
  function Settings() {
    const active = import_react3.default.useSyncExternalStore(subscribe, () => enabled);
    const failed = import_react3.default.useSyncExternalStore(subscribe, () => blocked);
    import_react3.default.useSyncExternalStore(localeSubscribe, localeSnapshot);
    const labels = copy();
    return /* @__PURE__ */ import_react3.default.createElement("section", null, /* @__PURE__ */ import_react3.default.createElement("h2", null, labels.title), /* @__PURE__ */ import_react3.default.createElement("p", null, labels.help), /* @__PURE__ */ import_react3.default.createElement("label", null, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: active,
        onChange: (event) => event.target.checked ? open() : close()
      }
    ), labels.activate), failed && /* @__PURE__ */ import_react3.default.createElement("p", { role: "alert" }, labels.popupBlocked));
  }
  ctx.effect(
    () => publishDeveloperExtension(window, {
      version: 1,
      label: () => t("developer"),
      component: Settings
    }),
    namespace + ": Developer tab"
  );
  ctx.effect(() => {
    window.addEventListener("pagehide", close);
    return () => {
      window.removeEventListener("pagehide", close);
      close();
      listeners.clear();
    };
  }, namespace + ": separate window");
}
return module.exports;}});
