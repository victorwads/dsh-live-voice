// @ts-nocheck
// Independent presentation for the DSH Live Voice controls.
export const styles = `
.dlv-icon-button{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;cursor:pointer;background:transparent;color:var(--dsw-alias-label-secondary);padding:0;font:inherit}
.dlv-icon-button svg{display:block;width:20px;height:20px}
.dlv-mic{width:30px;height:30px;border:1px solid var(--dsw-alias-border-l1);border-radius:50%}
.dlv-mic:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dlv-speaker{width:28px;height:28px;border:0;border-radius:28px;padding:5px;color:var(--dsw-alias-label-tertiary)}
.dlv-speaker:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dlv-speaker[aria-pressed=true]{color:var(--dsw-alias-label-primary)}
.dlv-icon-button:disabled{opacity:.4;cursor:default}
.dlv-icon-button:focus-visible,.dlv-settings :is(input,select):focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:3px}
.dlv-bar-wrap{width:100%;min-width:0}
.dlv-pill{display:flex;align-items:center;box-sizing:border-box;gap:10px;min-height:52px;border-radius:26px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);padding:0 14px;width:100%;max-width:720px;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.dlv-pill-button{width:34px;height:34px;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.dlv-pill-button:hover{background:var(--dsw-alias-bg-layer-2)}
.dlv-live-toggle{width:34px;height:34px;padding:0 7px;gap:0;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:17px;color:var(--dsw-alias-label-primary);transition:width .16s ease,gap .16s ease}
.dlv-live-toggle svg{width:18px;height:18px;flex:none}
.dlv-toggle-state{max-width:0;opacity:0;overflow:hidden;white-space:nowrap;font-size:10px;font-weight:700;line-height:1;letter-spacing:.04em;text-align:left;transition:max-width .16s ease,opacity .12s ease}
.dlv-live-toggle:hover,.dlv-live-toggle:focus-visible{width:78px;gap:5px;background:var(--dsw-alias-bg-layer-2)}
.dlv-live-toggle:hover .dlv-toggle-state,.dlv-live-toggle:focus-visible .dlv-toggle-state{max-width:38px;opacity:1}
.dlv-live-toggle[aria-checked=false],.dlv-live-toggle[data-mode=manual]{color:var(--dsw-alias-label-tertiary);border-color:var(--dsw-alias-border-l1);opacity:.55}
.dlv-live-toggle[aria-checked=true]{background:var(--dsw-alias-bg-layer-2)}
.dlv-wave{display:block;flex:1 1 180px;min-width:30px;width:100%;height:40px;color:var(--dsw-alias-label-primary)}
.dlv-status{flex:1 1 120px;min-width:0;font-size:13px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.dlv-error{color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;font-size:13px;max-width:720px;margin:8px auto}
.dlv-settings{box-sizing:border-box;padding:18px;width:100%;display:grid;gap:16px;max-width:640px;color:var(--dsw-alias-label-primary)}
.dlv-settings h3,.dlv-settings p{margin:0}
.dlv-settings-group,.dlv-settings-card{margin:0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;min-width:0}.dlv-settings-group{display:grid;gap:14px;padding:16px}.dlv-settings-group legend{padding:0 6px;font-weight:600;color:var(--dsw-alias-label-primary)}.dlv-settings-card>summary,.dlv-settings-subcard>summary{cursor:pointer;font-weight:650;list-style:none;display:flex;align-items:center;justify-content:space-between;padding:12px}.dlv-settings-card>summary::-webkit-details-marker,.dlv-settings-subcard>summary::-webkit-details-marker{display:none}.dlv-settings-card>summary:after,.dlv-settings-subcard>summary:after{content:"›";transform:rotate(90deg);transition:transform .15s}.dlv-settings-card:not([open])>summary:after,.dlv-settings-subcard:not([open])>summary:after{transform:rotate(0)}.dlv-settings-card-body{display:grid;gap:12px;padding:0 12px 12px}.dlv-settings-subcard{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;min-width:0}.dlv-settings-subcard>summary{padding:10px}.dlv-settings-subcard-body{display:grid;gap:10px;padding:0 10px 10px}
.dlv-settings label{display:grid;gap:6px;font-size:14px}.dlv-settings label.dlv-check{display:flex;align-items:center;gap:8px}.dlv-settings label.dlv-check input{width:auto}
.dlv-settings :is(input,select){box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.dlv-settings small,.dlv-settings p{font-size:13px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dlv-preset-group{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.dlv-settings label.dlv-preset{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;cursor:pointer}.dlv-settings label.dlv-preset:has(input:checked){border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}.dlv-settings label.dlv-preset input{width:auto;margin-top:3px}.dlv-preset span{display:grid;gap:3px}.dlv-vad-summary{font-weight:500}
.dlv-settings-actions{display:flex;flex-wrap:wrap;gap:8px}.dlv-settings-actions button{padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}.dlv-settings-actions button:disabled{opacity:.45;cursor:default}
@media(max-width:480px){.dlv-preset-group{grid-template-columns:1fr}.dlv-pill{flex-wrap:wrap}.dlv-wave{flex-basis:90px}.dlv-status{flex-basis:100px}}
`;
export default styles;
