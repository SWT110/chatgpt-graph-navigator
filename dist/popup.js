(()=>{var G=null,R={en:"English",zh_CN:"\u7B80\u4F53\u4E2D\u6587"};async function v(){try{return(await chrome.storage.local.get(["userLocale"])).userLocale||chrome.i18n.getUILanguage().replace("-","_")}catch{return chrome.i18n.getUILanguage().replace("-","_")}}async function $(e){await chrome.storage.local.set({userLocale:e}),G=e}async function K(e){try{let a=chrome.runtime.getURL(`_locales/${e}/messages.json`),s=await fetch(a);if(s.ok)return await s.json()}catch(a){console.warn(`Failed to load locale ${e}:`,a)}let t=e.split("_")[0];if(t!==e)try{let a=chrome.runtime.getURL(`_locales/${t}/messages.json`),s=await fetch(a);if(s.ok)return await s.json()}catch(a){console.warn(`Failed to load language ${t}:`,a)}try{let a=chrome.runtime.getURL("_locales/en/messages.json");return await(await fetch(a)).json()}catch(a){return console.error("Failed to load fallback locale:",a),{}}}var h=null;function n(e,t){if(h&&h[e]){let a=h[e].message;if(t){let s=Array.isArray(t)?t:[t];s.forEach((o,l)=>{let u=`$${l+1}`;a=a.replace(new RegExp(`\\$${l+1}\\$`,"g"),o)}),h[e].placeholders&&Object.entries(h[e].placeholders).forEach(([o,l])=>{let u=new RegExp(`\\$${o.toUpperCase()}\\$`,"gi");a=a.replace(u,s[0]||"")})}return a}return chrome.i18n.getMessage(e,t)||e}async function f(e){e||(e=await v()),G=e,h=await K(e),document.querySelectorAll("[data-i18n]").forEach(a=>{let s=a.getAttribute("data-i18n"),o=n(s);o.includes("<")?a.innerHTML=o:a.textContent=o}),document.querySelectorAll("[data-i18n-placeholder]").forEach(a=>{let s=a.getAttribute("data-i18n-placeholder");a.placeholder=n(s)}),document.querySelectorAll("[data-i18n-title]").forEach(a=>{let s=a.getAttribute("data-i18n-title");a.title=n(s)});let t=document.documentElement.getAttribute("data-i18n-title");t&&(document.title=n(t)),document.documentElement.lang=e.replace("_","-")}var X="ChatGPT Graph",pe=`[${X}]`;var b={CONVERSATION_LOADED:"CONVERSATION_LOADED",CONVERSATION_UPDATED:"CONVERSATION_UPDATED",CONVERSATION_INCREMENTAL_UPDATE:"CONVERSATION_INCREMENTAL_UPDATE",NEW_MESSAGE:"NEW_MESSAGE",ERROR:"ERROR",GET_CONVERSATION:"GET_CONVERSATION",GET_ALL_CONVERSATIONS:"GET_ALL_CONVERSATIONS",REFRESH_DATA:"REFRESH_DATA",GET_TOKEN_STATUS:"GET_TOKEN_STATUS",CLEAR_TOKEN:"CLEAR_TOKEN",TOKEN_UPDATED:"TOKEN_UPDATED",DATA_READY:"DATA_READY",UPDATE_NOTIFICATION:"UPDATE_NOTIFICATION",SCROLL_TO_MESSAGE:"SCROLL_TO_MESSAGE",TOGGLE_FLOATING_PANEL:"TOGGLE_FLOATING_PANEL",UPDATE_FLOATING_PANEL_STATE:"UPDATE_FLOATING_PANEL_STATE",ASSISTANT_STREAM_SETTINGS_CHANGED:"ASSISTANT_STREAM_SETTINGS_CHANGED"};var r={CURRENT_CONVERSATION:"current_conversation",CACHE_PREFIX:"cache_",SETTINGS:"settings",COLLAPSE_SETTINGS:"chatgpt_graph_collapse_settings",SIDEPANEL_UI_ZOOM:"chatgpt_graph_sidepanel_ui_zoom",DEBUG_LOG_ENABLED:"chatgpt_graph_debug_log_enabled",DEBUG_LOG_LEVELS:"chatgpt_graph_debug_log_levels",ASSISTANT_STREAM_SETTINGS:"chatgpt_graph_assistant_stream_settings"},S={MERGE_ALL:"merge_all",FINAL_ONLY:"final_only"},T={mode:S.FINAL_ONLY},N={enabled:!0,threshold:200,autoCollapseQuestion:!0,autoCollapseAnswer:!0},Ee={API_DELAY:1e3,MAX_RETRIES:3,CACHE_TTL:5*60*1e3,MAX_CACHE_SIZE:10,OBSERVER_DELAY:500};function M(e,t){return new Promise((a,s)=>{try{chrome.tabs.sendMessage(e,t,o=>{if(chrome.runtime.lastError){s(chrome.runtime.lastError);return}a(o)})}catch(o){s(o)}})}function Q(e){return e?.message?.includes("Receiving end does not exist")}async function J(e,t=300){await chrome.scripting.executeScript({target:{tabId:e},files:["dist/content.js"]}),t>0&&await new Promise(a=>setTimeout(a,t))}async function L(e,t,a={}){let{injectOnMissingReceiver:s=!0,retryDelayMs:o=300}=a;try{return await M(e,t)}catch(l){if(!s||!Q(l))throw l;return await J(e,o),await M(e,t)}}var c={...N},m={...T},E=1,D=60,x=140,ee=5,p=!1,g={verbose:!0,warn:!0,error:!0};async function te(){try{let t=(await chrome.storage.local.get(r.COLLAPSE_SETTINGS))[r.COLLAPSE_SETTINGS];t&&(c={...N,...t})}catch(e){console.warn("Failed to load collapse settings:",e)}return c}async function ae(){try{let t=(await chrome.storage.local.get(r.ASSISTANT_STREAM_SETTINGS))[r.ASSISTANT_STREAM_SETTINGS];m={...T,...t||{}}}catch(e){console.warn("Failed to load assistant stream settings:",e),m={...T}}return m}async function ne(){try{await chrome.storage.local.set({[r.ASSISTANT_STREAM_SETTINGS]:m});let[e]=await chrome.tabs.query({active:!0,currentWindow:!0});if(e&&e.url&&(e.url.includes("chatgpt.com")||e.url.includes("chat.openai.com")))try{await L(e.id,{type:b.ASSISTANT_STREAM_SETTINGS_CHANGED})}catch{}}catch(e){console.error("Failed to save assistant stream settings:",e)}}async function se(){try{let t=(await chrome.storage.local.get(r.SIDEPANEL_UI_ZOOM))[r.SIDEPANEL_UI_ZOOM],a=Number(t);Number.isFinite(a)&&a>=.5&&a<=2.5?E=a:E=1}catch(e){console.warn("Failed to load sidepanel zoom:",e),E=1}return E}async function P(e){let t=Number(e);if(Number.isFinite(t)){E=Math.max(.5,Math.min(2.5,t));try{await chrome.storage.local.set({[r.SIDEPANEL_UI_ZOOM]:E})}catch(a){console.error("Failed to save sidepanel zoom:",a)}}}async function _(){try{await chrome.storage.local.set({[r.COLLAPSE_SETTINGS]:c});let[e]=await chrome.tabs.query({active:!0,currentWindow:!0});if(e&&e.url&&(e.url.includes("chatgpt.com")||e.url.includes("chat.openai.com")))try{await L(e.id,{type:"COLLAPSE_SETTINGS_CHANGED"})}catch{}}catch(e){console.error("Failed to save collapse settings:",e)}}function U(){let e=c.enabled?"":"setting-disabled";return`
    <div class="collapse-settings">
      <h3>${n("collapseSettingsTitle")||"Content Collapse Settings"}</h3>

      <div class="setting-item">
        <label for="collapse-enabled">
          <input type="checkbox" id="collapse-enabled" ${c.enabled?"checked":""}>
          ${n("collapseEnabled")||"Enable auto collapse"}
        </label>
      </div>

      <div class="setting-group ${e}" id="collapse-options">
        <div class="setting-item">
          <label for="collapse-threshold">${n("collapseThreshold")||"Collapse threshold"}</label>
          <div>
            <input type="number" id="collapse-threshold" value="${c.threshold}" min="50" max="2000" step="50">
            <span class="unit">${n("collapseThresholdUnit")||"characters"}</span>
          </div>
        </div>

        <div class="setting-item">
          <label for="collapse-question">
            <input type="checkbox" id="collapse-question" ${c.autoCollapseQuestion?"checked":""}>
            ${n("collapseQuestion")||"Auto collapse questions"}
          </label>
        </div>

        <div class="setting-item">
          <label for="collapse-answer">
            <input type="checkbox" id="collapse-answer" ${c.autoCollapseAnswer?"checked":""}>
            ${n("collapseAnswer")||"Auto collapse answers"}
          </label>
        </div>
      </div>
    </div>
  `}function oe(){let e=m.mode||T.mode;return`
    <div class="popup-settings-card">
      <h3>${n("assistantStreamSettingsTitle")||"Answer Grouping"}</h3>
      <p class="setting-help">${n("assistantStreamSettingsDescription")||"Choose how ChatGPT Graph handles assistant answers that appear in multiple parts while ChatGPT is thinking."}</p>

      <label class="stream-mode-option" for="assistant-stream-final-only">
        <input
          type="radio"
          name="assistant-stream-mode"
          id="assistant-stream-final-only"
          value="${S.FINAL_ONLY}"
          ${e===S.FINAL_ONLY?"checked":""}
        >
        <span>
          <strong>${n("assistantStreamFinalOnlyLabel")||"Use only the final answer"}</strong>
          <small>${n("assistantStreamFinalOnlyDescription")||"Replace interim parts and keep the last completed answer as the graph node."}</small>
        </span>
      </label>

      <label class="stream-mode-option" for="assistant-stream-merge-all">
        <input
          type="radio"
          name="assistant-stream-mode"
          id="assistant-stream-merge-all"
          value="${S.MERGE_ALL}"
          ${e===S.MERGE_ALL?"checked":""}
        >
        <span>
          <strong>${n("assistantStreamMergeAllLabel")||"Merge all streamed parts"}</strong>
          <small>${n("assistantStreamMergeAllDescription")||"Keep every visible part, but store the group as one graph node."}</small>
        </span>
      </label>
    </div>
  `}function F(){let e=Math.round((Number(E)||1)*100),t=Math.max(D,Math.min(x,e));return`
    <div class="collapse-settings">
      <h3>${n("sidepanelZoomTitle")||"Side Panel UI Zoom"}</h3>

      <div class="setting-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
        <div style="display:flex; justify-content: space-between; align-items:center; width:100%;">
          <span class="status-label">${n("sidepanelZoomLabel")||"Zoom (independent from webpage)"}</span>
          <span class="zoom-value" id="sidepanel-zoom-value">${t}%</span>
        </div>

        <div class="zoom-row">
          <input
            type="range"
            id="sidepanel-zoom-range"
            min="${D}"
            max="${x}"
            step="${ee}"
            value="${t}"
          />
          <button class="mini-btn" id="sidepanel-zoom-reset">${n("reset")||"Reset"}</button>
        </div>
      </div>
    </div>
  `}async function le(){try{let e=await chrome.storage.local.get([r.DEBUG_LOG_ENABLED,r.DEBUG_LOG_LEVELS]);p=e[r.DEBUG_LOG_ENABLED]===!0,e[r.DEBUG_LOG_LEVELS]&&(g={...g,...e[r.DEBUG_LOG_LEVELS]})}catch(e){console.warn("Failed to load debug log setting:",e),p=!1}return p}async function re(e){p=e;try{await chrome.storage.local.set({[r.DEBUG_LOG_ENABLED]:e})}catch(t){console.error("Failed to save debug log setting:",t)}}async function y(){try{await chrome.storage.local.set({[r.DEBUG_LOG_LEVELS]:g})}catch(e){console.error("Failed to save debug log levels:",e)}}function B(){let e=p?"":"setting-disabled";return`
    <div class="collapse-settings">
      <h3>${n("debugLogTitle")||"Developer Options"}</h3>

      <div class="setting-item">
        <label for="debug-log-enabled">
          <input type="checkbox" id="debug-log-enabled" ${p?"checked":""}>
          ${n("debugLogEnabled")||"Enable debug logging"}
        </label>
      </div>

      <div class="setting-group ${e}" id="debug-log-levels">
        <div class="setting-item">
          <label for="debug-log-verbose">
            <input type="checkbox" id="debug-log-verbose" ${g.verbose?"checked":""}>
            ${n("debugLogVerbose")||"Verbose (log/debug/info)"}
          </label>
        </div>

        <div class="setting-item">
          <label for="debug-log-warn">
            <input type="checkbox" id="debug-log-warn" ${g.warn?"checked":""}>
            ${n("debugLogWarn")||"Warnings"}
          </label>
        </div>

        <div class="setting-item">
          <label for="debug-log-error">
            <input type="checkbox" id="debug-log-error" ${g.error?"checked":""}>
            ${n("debugLogError")||"Errors"}
          </label>
        </div>
      </div>
    </div>
  `}function H(){let e=document.getElementById("debug-log-enabled"),t=document.getElementById("debug-log-verbose"),a=document.getElementById("debug-log-warn"),s=document.getElementById("debug-log-error"),o=document.getElementById("debug-log-levels");e&&e.addEventListener("change",async()=>{p=e.checked,o&&(p?o.classList.remove("setting-disabled"):o.classList.add("setting-disabled")),await re(e.checked)}),t&&t.addEventListener("change",async()=>{g.verbose=t.checked,await y()}),a&&a.addEventListener("change",async()=>{g.warn=a.checked,await y()}),s&&s.addEventListener("change",async()=>{g.error=s.checked,await y()})}function V(){let e=document.getElementById("sidepanel-zoom-range"),t=document.getElementById("sidepanel-zoom-value"),a=document.getElementById("sidepanel-zoom-reset"),s=o=>{t&&(t.textContent=`${o}%`)};e&&(e.addEventListener("input",()=>{let o=parseInt(e.value,10);s(o)}),e.addEventListener("change",async()=>{let o=parseInt(e.value,10);if(!Number.isFinite(o))return;let l=o/100;await P(l)})),a&&a.addEventListener("click",async()=>{e&&(e.value="100",s(100)),await P(1)})}function Z(){let e=document.getElementById("collapse-enabled"),t=document.getElementById("collapse-threshold"),a=document.getElementById("collapse-question"),s=document.getElementById("collapse-answer"),o=document.getElementById("collapse-options");e&&e.addEventListener("change",async()=>{c.enabled=e.checked,o&&(c.enabled?o.classList.remove("setting-disabled"):o.classList.add("setting-disabled")),await _()}),t&&t.addEventListener("change",async()=>{let l=parseInt(t.value,10);l>=50&&l<=2e3&&(c.threshold=l,await _())}),a&&a.addEventListener("change",async()=>{c.autoCollapseQuestion=a.checked,await _()}),s&&s.addEventListener("change",async()=>{c.autoCollapseAnswer=s.checked,await _()})}function z(){let e=document.getElementById("popup-settings-panel");e&&(e.innerHTML=oe(),ie())}function ie(){document.querySelectorAll('input[name="assistant-stream-mode"]').forEach(e=>{e.addEventListener("change",async()=>{e.checked&&(m={...m,mode:e.value},await ne())})})}function ce(){let e=document.getElementById("popup-settings-btn"),t=document.getElementById("popup-settings-panel");!e||!t||e.addEventListener("click",()=>{let a=!t.classList.contains("collapsed");t.classList.toggle("collapsed",a),e.setAttribute("aria-expanded",String(!a))})}function de(){let e=document.getElementById("language-switcher-container");if(!e)return;e.innerHTML="";let t=document.createElement("div");t.className="language-switcher";let a=document.createElement("label");a.textContent=n("languageLabel"),a.htmlFor="language-select";let s=document.createElement("select");s.id="language-select",s.className="language-select",Object.entries(R).forEach(([o,l])=>{let u=document.createElement("option");u.value=o,u.textContent=l,s.appendChild(u)}),v().then(o=>{s.value=o}),s.addEventListener("change",async o=>{let l=o.target.value;await $(l),await f(l),z(),w()}),t.appendChild(a),t.appendChild(s),e.appendChild(t)}async function ue(){await f(),await te(),await ae(),await se(),await le(),de(),ce(),z(),w()}async function w(){let e=document.getElementById("content");try{let t=await chrome.storage.local.get(["accessToken","tokenTimestamp","tokenSource"]),a=!!t.accessToken,s=t.tokenSource||"manual",o=t.tokenTimestamp?Date.now()-t.tokenTimestamp:null,l=o?Math.floor(o/1e3/60):null,u=o?Math.floor(o/1e3/60/60):null,A=o&&o>24*60*60*1e3,i="";if(!a){i=`
        <div class="status">
          <div class="status-item">
            <span class="status-label">${n("statusLabel")}</span>
            <span class="status-value warning">${n("waitingForToken")||"Waiting for token..."}</span>
          </div>
        </div>

        <div class="help">
          <p>
            <strong>${n("autoTokenTitle")||"Auto Token Capture"}</strong><br><br>
            ${n("autoTokenMessage")||"Token will be automatically captured when you use ChatGPT. Just refresh the ChatGPT page or send a message."}
          </p>
          <p style="margin-top: 8px; color: #6b7280;">
            ${n("manualTokenHint")||"Or you can manually configure the token below."}
          </p>
        </div>

        <div class="actions">
          <button class="secondary" id="setup-btn">
            ${n("manualSetupBtn")||"Manual Setup"}
          </button>
        </div>
      `,i+=U(),i+=F(),i+=B(),e.innerHTML=i,document.getElementById("setup-btn").addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("src/setup/index.html")})}),Z(),V(),H();return}let W=s==="auto"?n("tokenSourceAuto")||"\u{1F916} Auto":n("tokenSourceManual")||"\u270F\uFE0F Manual";i+=`
      <div class="status">
        <div class="status-item">
          <span class="status-label">${n("authenticationLabel")}</span>
          <span class="status-value ${a?A?"warning":"success":"error"}">
            ${a?A?n("tokenExpired"):n("authenticated"):n("notConfigured")}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">${n("tokenSourceLabel")||"Source"}</span>
          <span class="status-value">${W}</span>
        </div>
      </div>
    `;let q=t.accessToken.substring(0,40)+"...",Y=t.accessToken.length,j=u>0?n(u>1?"hoursAgo":"hourAgo",u.toString()):n(l>1?"minutesAgo":"minuteAgo",l.toString());i+=`
      <div class="token-info">
        <h3>${n("tokenInfoTitle")}</h3>
        <div class="token-preview">${q}</div>
        <div class="token-time">
          ${n("tokenLength",Y.toString())}<br>
          ${n("tokenCaptured",j)}
          ${A?`<br><strong style="color: #dc2626;">${n("tokenExpiredWarning")}</strong>`:""}
        </div>
      </div>
    `,i+=`
      <div class="actions">
        <button class="primary" id="open-sidepanel-btn" style="flex: 1;">
           ${n("openGraphBtn")||"Open Graph View"}
        </button>
      </div>
      <div class="actions">
        <button class="secondary" id="toggle-floating-btn" style="flex: 1;">
           ${n("openFloatingBtn")||"Floating Window"}
        </button>
      </div>
      <div class="actions">
        <button class="secondary" id="update-btn">
          ${n("manualSetupBtn")||"Manual Setup"}
        </button>
        <button class="secondary" id="clear-btn">
          ${n("clearTokenBtn")}
        </button>
      </div>
    `,A?i+=`
        <div class="help">
          <p>${n("tokenExpiredAutoHelp")||"Token expired. It will be auto-renewed when you use ChatGPT, or you can refresh the page."}</p>
        </div>
      `:s==="auto"?i+=`
        <div class="help">
          <p>${n("autoTokenReadyHelp")||"Token was automatically captured. It will be auto-renewed when needed."}</p>
        </div>
      `:i+=`
        <div class="help">
          <p>${n("readyHelp")}</p>
        </div>
      `,i+=U(),i+=F(),i+=B(),e.innerHTML=i,Z(),V(),H();let I=document.getElementById("open-sidepanel-btn"),O=document.getElementById("toggle-floating-btn"),C=document.getElementById("update-btn"),k=document.getElementById("clear-btn");I&&I.addEventListener("click",async()=>{try{let[d]=await chrome.tabs.query({active:!0,currentWindow:!0});d&&(await chrome.sidePanel.open({tabId:d.id}),window.close())}catch(d){console.error("Failed to open side panel:",d),alert("Failed to open side panel: "+d.message)}}),O&&O.addEventListener("click",async()=>{try{let[d]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!d?.id)return;await L(d.id,{type:b.TOGGLE_FLOATING_PANEL}),window.close()}catch(d){console.error("Failed to toggle floating panel:",d),alert("Failed to toggle floating window. Please open ChatGPT first.")}}),C&&C.addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("src/setup/index.html")})}),k&&k.addEventListener("click",async()=>{if(confirm(n("confirmClearToken"))){try{await chrome.runtime.sendMessage({type:b.CLEAR_TOKEN})}catch{await chrome.storage.local.remove(["accessToken","tokenTimestamp","tokenSource","tokenInfo"])}w()}})}catch(t){console.error("Failed to load status:",t),e.innerHTML=`
      <div class="status">
        <div class="status-item">
          <span class="status-label">${n("errorLabel")}</span>
          <span class="status-value error">${n("errorLoadFailed")}</span>
        </div>
      </div>
      <div class="help">
        <p><strong>${n("errorLabel")}:</strong> ${t.message}</p>
      </div>
    `}}document.addEventListener("DOMContentLoaded",ue);})();
