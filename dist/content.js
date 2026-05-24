(()=>{var cn="ChatGPT Graph",pt=`[${cn}]`,ht={CONVERSATION:"/backend-api/conversation",CONVERSATIONS:"/backend-api/conversations",ME:"/backend-api/me"},G={CONVERSATION_LOADED:"CONVERSATION_LOADED",CONVERSATION_UPDATED:"CONVERSATION_UPDATED",CONVERSATION_INCREMENTAL_UPDATE:"CONVERSATION_INCREMENTAL_UPDATE",NEW_MESSAGE:"NEW_MESSAGE",ERROR:"ERROR",GET_CONVERSATION:"GET_CONVERSATION",GET_ALL_CONVERSATIONS:"GET_ALL_CONVERSATIONS",REFRESH_DATA:"REFRESH_DATA",GET_TOKEN_STATUS:"GET_TOKEN_STATUS",CLEAR_TOKEN:"CLEAR_TOKEN",TOKEN_UPDATED:"TOKEN_UPDATED",DATA_READY:"DATA_READY",UPDATE_NOTIFICATION:"UPDATE_NOTIFICATION",SCROLL_TO_MESSAGE:"SCROLL_TO_MESSAGE",TOGGLE_FLOATING_PANEL:"TOGGLE_FLOATING_PANEL",UPDATE_FLOATING_PANEL_STATE:"UPDATE_FLOATING_PANEL_STATE",ASSISTANT_STREAM_SETTINGS_CHANGED:"ASSISTANT_STREAM_SETTINGS_CHANGED"},P={USER:"user",ASSISTANT:"assistant",SYSTEM:"system"},M={CURRENT_CONVERSATION:"current_conversation",CACHE_PREFIX:"cache_",SETTINGS:"settings",COLLAPSE_SETTINGS:"chatgpt_graph_collapse_settings",SIDEPANEL_UI_ZOOM:"chatgpt_graph_sidepanel_ui_zoom",DEBUG_LOG_ENABLED:"chatgpt_graph_debug_log_enabled",DEBUG_LOG_LEVELS:"chatgpt_graph_debug_log_levels",ASSISTANT_STREAM_SETTINGS:"chatgpt_graph_assistant_stream_settings"},z={MERGE_ALL:"merge_all",FINAL_ONLY:"final_only"},R={mode:z.FINAL_ONLY},ie={enabled:!0,threshold:200,autoCollapseQuestion:!0,autoCollapseAnswer:!0},_e={API_DELAY:1e3,MAX_RETRIES:3,CACHE_TTL:5*60*1e3,MAX_CACHE_SIZE:10,OBSERVER_DELAY:500};var Ce=!1,J={verbose:!0,warn:!0,error:!0};async function ft(){try{if(typeof chrome<"u"&&chrome.storage){let t=await chrome.storage.local.get([M.DEBUG_LOG_ENABLED,M.DEBUG_LOG_LEVELS]);Ce=t[M.DEBUG_LOG_ENABLED]===!0,t[M.DEBUG_LOG_LEVELS]&&(J={...J,...t[M.DEBUG_LOG_LEVELS]})}}catch{}}function Ae(){return Ce}function s(t,e,...n){if(!Ce)return;if(t==="error"){if(!J.error)return}else if(t==="warn"){if(!J.warn)return}else if(!J.verbose)return;let r=`${pt}[${e}]`;console[t](r,...n)}function Y(t){return new Promise(e=>setTimeout(e,t))}async function mt(t,e=3,n=1e3){let r;for(let o=0;o<e;o++)try{return await t()}catch(a){r=a,s("warn","Utils",`Retry ${o+1}/${e} failed:`,a.message),o<e-1&&await Y(n)}throw r}function bt(t,e){let n=0;return function(...r){let o=Date.now();if(o-n>=e)return n=o,t.apply(this,r)}}function H(t=window.location.pathname){let e=t.match(/\/c\/([a-f0-9-]+)/);return e?e[1]:null}var D=null,U=null,V=null;function St(t){let e=document.cookie.split(";");for(let n of e){let[r,o]=n.trim().split("=");if(r===t)return decodeURIComponent(o)}return null}async function Ne(){try{let t=await chrome.storage.local.get(["accessToken","tokenTimestamp","tokenSource"]);if(t.accessToken){let e=Date.now()-(t.tokenTimestamp||0),n=24*60*60*1e3;return e<n?(D=t.accessToken,V=t.tokenSource||"unknown",U=null,s("info","Token","Loaded token from storage",{source:V,length:D.length,age:Math.floor(e/1e3/60)+" minutes"}),!0):(s("warn","Token","Stored token expired (>24h), waiting for auto-capture"),D=null,V=null,!1)}return s("warn","Token","No token found in storage, waiting for auto-capture"),!1}catch(t){return s("error","Token","Failed to load token:",t),!1}}function vt(){chrome.storage.onChanged.addListener((t,e)=>{if(e==="local"&&t.accessToken){let n=t.accessToken.newValue,r=t.tokenSource?.newValue||"auto";n&&n!==D?(D=n,V=r,U=null,s("info","Token","Token auto-updated from storage",{source:V,length:D.length})):n||(D=null,V=null,U=null,s("info","Token","Token cleared from storage"))}}),s("info","Token","Token listener initialized")}function Ie(){return!!D}function ln(){if(U&&Date.now()-U.timestamp<6e4)return U.data;let t={accessToken:D,accountId:St("_account"),deviceId:St("oai-did")};return U={data:t,timestamp:Date.now()},s("info","API","Auth info retrieved:",{hasToken:!!t.accessToken,hasAccountId:!!t.accountId,hasDeviceId:!!t.deviceId,tokenSource:V||"none"}),t}function yt(){U=null,s("info","API","Auth cache cleared")}function Tt(){let t=ln(),e={accept:"*/*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8","oai-language":"zh-CN","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"};return t.accessToken?e.authorization=`Bearer ${t.accessToken}`:s("warn","API","No access token available, request may fail"),t.accountId&&(e["chatgpt-account-id"]=t.accountId),t.deviceId&&(e["oai-device-id"]=t.deviceId),e}async function Et(t,e=!1){s("info","API",`Fetching conversation: ${t}${e?" (retry)":""}`);try{let n=await fetch(`${ht.CONVERSATION}/${t}`,{method:"GET",credentials:"include",headers:Tt()});if(!n.ok){let o="",a=null;try{a=await n.json(),o=JSON.stringify(a)}catch{o=await n.text()}if(n.status===401){if(s("warn","API","Authentication failed (401), clearing auth cache"),yt(),e)throw new Error("Authentication failed (401). Please ensure you are logged into ChatGPT and refresh the page.");return s("info","API","Retrying with fresh auth info..."),await delay(500),await Et(t,!0)}throw n.status===404&&a?.detail?.code==="conversation_not_found"?(s("warn","API",`Conversation not found: ${t}`),new Error("Conversation not found (404). Please visit a valid ChatGPT conversation page.")):(s("error","API",`HTTP ${n.status}:`,o),new Error(`API Error: ${n.status} - ${o}`))}let r=await n.json();return s("info","API","Conversation loaded successfully",{id:r.id||t,title:r.title,mappingSize:Object.keys(r.mapping||{}).length}),r}catch(n){throw s("error","API","Failed to fetch conversation:",n),n}}async function xt(t,e=3){return mt(()=>Et(t),e,1e3)}var dn={image_asset_pointer:t=>{let e=t.asset_pointer||"",n=t.metadata?.dalle?.prompt||t.metadata?.generation?.serialization_title||t.metadata?.image_gen_title||"\u56FE\u7247",r=t.width||t.metadata?.container_pixel_width,o=t.height||t.metadata?.container_pixel_height,a=r&&o?` (${r}x${o})`:"",i=`[\u56FE\u7247: ${n}${a}](${e})`;return s("debug","ContentProcessor","Processed image_asset_pointer:",{title:n,pointer:e,result:i}),i}};function ce(t){if(!t)return s("debug","ContentProcessor","processPart: empty part"),"";if(typeof t=="string")return s("debug","ContentProcessor","processPart: string, length=",t.length),t;if(Array.isArray(t))return s("debug","ContentProcessor","processPart: array, length=",t.length),t.map(ce).filter(e=>e.length>0).join("");if(typeof t=="object"){let e=t.content_type;s("debug","ContentProcessor","processPart: object, content_type=",e,"keys=",Object.keys(t));let n=dn[e];if(n){s("debug","ContentProcessor","processPart: found processor for",e);try{let r=n(t);return s("debug","ContentProcessor","processPart: processor result=",r),r}catch(r){return console.warn("[ContentProcessor] Processor error:",e,r),""}}if(typeof t.text=="string")return s("debug","ContentProcessor","processPart: using text field, length=",t.text.length),t.text;if(Array.isArray(t.parts))return s("debug","ContentProcessor","processPart: has nested parts, length=",t.parts.length),t.parts.map(ce).filter(r=>r.length>0).join("");s("debug","ContentProcessor","processPart: no processor, no text, no parts - returning empty")}return""}function Me(t){if(s("debug","ContentProcessor","processContent called with:",typeof t,t?Object.keys(t):"null"),!t)return s("debug","ContentProcessor","processContent: empty content"),"";if(typeof t=="string")return s("debug","ContentProcessor","processContent: string, length=",t.length),t;if(Array.isArray(t))return s("debug","ContentProcessor","processContent: array, length=",t.length),t.map(ce).filter(e=>e.length>0).join("");if(typeof t=="object"){if(s("debug","ContentProcessor","processContent: object, content_type=",t.content_type,"has parts=",Array.isArray(t.parts)),Array.isArray(t.parts)){s("debug","ContentProcessor","processContent: processing parts array, length=",t.parts.length);let e=t.parts.map(ce).filter(n=>n.length>0).join(`
`);return s("debug","ContentProcessor","processContent: parts result length=",e.length),e}if(typeof t.text=="string")return t.text}return""}function le(t){let e=Me(t);return e&&e.trim().length>0}function de(t,e){s("info","Parser","Parsing mapping..."),s("debug","MappingParser","=== parseMapping START ==="),s("debug","MappingParser","Total mapping entries:",Object.keys(t).length);let n=new Set(["code","execution_output","tether_browsing_display","tether_quote","system_error","model_editable_context"]),r=(b,f=new Set)=>{if(f.has(b))return!1;f.add(b);let v=t[b];if(!v)return!1;for(let w of v.children||[]){let x=t[w];if(!x)continue;let _=x.message?.author?.role;if(_!==P.USER&&(_===P.ASSISTANT&&le(x.message?.content)||r(w,f)))return!0}return!1},o=(b,f=new Set)=>{if(f.has(b))return!1;f.add(b);let v=t[b];if(!v)return!1;for(let w of v.children||[])if(t[w]?.message?.author?.role===P.USER||o(w,f))return!0;return!1},a=b=>{let f=t[b];if(!f?.message)return s("debug","MappingParser",`shouldKeepAsLastReply(${b.substring(0,8)}): no message`),!1;let v=le(f.message.content);if(s("debug","MappingParser",`shouldKeepAsLastReply(${b.substring(0,8)}): hasValidContent=${v}`),!v)return!1;let w=r(b);return s("debug","MappingParser",`shouldKeepAsLastReply(${b.substring(0,8)}): hasAnyReplyDescendant=${w}`),!w},i=(b,f=null)=>{if(!b)return!1;let v=b.author?.role,w=b.content?.content_type,x=f?f.substring(0,8):"null";if(s("debug","MappingParser",`isConversationMessage(${x}): role=${v}, content_type=${w}`),v==="system")return s("debug","MappingParser",`isConversationMessage(${x}): FILTERED - system role`),!1;if(v===P.USER)return s("debug","MappingParser",`isConversationMessage(${x}): KEPT - user role`),!0;if(v===P.ASSISTANT){if(!w||!n.has(w)){let _=le(b.content);return s("debug","MappingParser",`isConversationMessage(${x}): assistant non-tool, hasValidContent=${_}`),_}if(f){let _=a(f);return s("debug","MappingParser",`isConversationMessage(${x}): assistant tool-type, shouldKeepAsLastReply=${_}`),_}return s("debug","MappingParser",`isConversationMessage(${x}): FILTERED - assistant tool-type, no nodeId`),!1}return s("debug","MappingParser",`isConversationMessage(${x}): FILTERED - unknown role: ${v}`),!1},c=b=>t[b]?.message?.author?.role||null,p=b=>{let f=t[b];return f?.message&&i(f.message,b)},d=b=>{let f=t[b]?.parent,v=new Set;for(;f&&!v.has(f);){if(v.add(f),p(f))return f;f=t[f]?.parent}return null},l=b=>{let f=[],v=[...t[b]?.children||[]],w=new Set;for(;v.length>0;){let x=v.shift();if(!w.has(x))if(w.add(x),p(x))f.push(x);else{let _=t[x]?.children||[];v.push(..._)}}return f},h=[],S={user:0,assistant:0,tool:0,system:0,other:0};for(let b in t){let f=t[b]?.message?.author?.role;f==="user"?S.user++:f==="assistant"?S.assistant++:f==="tool"?S.tool++:f==="system"?S.system++:S.other++}s("debug","MappingParser","=== RAW MAPPING STATS ==="),s("debug","MappingParser","Raw role stats:",S);for(let b in t){let f=t[b];if(!f.message||!i(f.message,b))continue;let v=f.message.author.role,w=d(b),x=l(b),_={id:b,conversationId:e,role:v,content:Me(f.message.content)||"",createTime:f.message.create_time||Date.now()/1e3,parent:w,children:x,_rawParent:f.parent||null,_rawChildren:f.children||[],metadata:{status:f.message.status,weight:f.message.weight,endTurn:f.message.end_turn,...f.message.metadata}};h.push(_)}let T=new Set(h.map(b=>b.id)),A=new Map(h.map(b=>[b.id,b])),E=[];for(let b of h)for(let f of b.children){if(!T.has(f))continue;let v=A.get(f);v&&E.push({id:`${e}:${b.id}->${f}`,conversationId:e,source:b.id,target:f,sourceRole:b.role,targetRole:v.role,orderKey:v.createTime||b.createTime||Date.now()/1e3})}let C={user:0,assistant:0,tool:0,other:0};for(let b of h)b.role==="user"?C.user++:b.role==="assistant"?C.assistant++:b.role==="tool"?C.tool++:C.other++;return s("debug","MappingParser","=== parseMapping RESULT ==="),s("debug","MappingParser","Role stats:",C),s("debug","MappingParser","Total nodes:",h.length,"Total edges:",E.length),s("info","Parser",`Parsed ${h.length} nodes, ${E.length} edges`),{nodes:h,edges:E}}function ke(t){let e=new Map;for(let n of t)e.set(n.id,n);return e}function wt(t,e){let n=[],r=t;for(;r&&e.has(r);){let o=e.get(r);n.unshift(o),r=o.parent}return n}function ue(t){let e={total:t.length,user:0,assistant:0,tool:0,maxDepth:0,branchPoints:0};for(let n of t)n.role===P.USER?e.user++:n.role===P.ASSISTANT?e.assistant++:n.role==="tool"&&e.tool++,n.children.length>1&&e.branchPoints++;return e}function _t(t){let e=Number(t?.metadata?.stream_group_part_index);return Number.isFinite(e)?e:Number.MAX_SAFE_INTEGER}function Pe(t){let e=Number(t?.metadata?.timestamp);if(Number.isFinite(e))return e;let n=Number(t?.createTime);return Number.isFinite(n)?n*1e3:0}function Ct(t){return _t(t)===Number.MAX_SAFE_INTEGER?Pe(t):_t(t)}function Le(t,e){let n=Ct(t)-Ct(e);if(n!==0)return n;let r=Pe(t)-Pe(e);return r!==0?r:String(t.id).localeCompare(String(e.id))}function Oe(t){let e=new Set(t.map(c=>c.id)),n=new Map;for(let c of t)!c.parent||!e.has(c.parent)||(n.has(c.parent)||n.set(c.parent,[]),n.get(c.parent).push(c));for(let c of n.values())c.sort(Le);let r=t.filter(c=>!c.parent||!e.has(c.parent)).sort(Le),o=[],a=new Set,i=c=>{if(!(!c||a.has(c.id))){a.add(c.id),o.push(c);for(let p of n.get(c.id)||[])i(p)}};return r.forEach(i),t.slice().sort(Le).forEach(c=>{a.has(c.id)||i(c)}),o}function ge(t){return t?.role==="assistant"}function At(t){return ge(t)&&t.metadata?.is_thinking_preamble_message===!0}function un(t){return t?.metadata?.turn_exchange_id||null}function gn(t){return t.reduce((e,n)=>{let r=(n.content||"").trim();return r?e?e.includes(r)?e:r.includes(e)?r:`${e}

${r}`:r:e},"")}function pn(t,e){let n=new Map(t.map(r=>[r.id,r]));return t.filter(r=>r.parent&&n.has(r.parent)).map(r=>{let o=n.get(r.parent);return{id:`${e}:${r.parent}->${r.id}`,conversationId:e,source:r.parent,target:r.id,sourceRole:o?.role,targetRole:r.role,orderKey:r.createTime||o?.createTime||Date.now()/1e3}})}function hn(t){let e=new Set(t.map(r=>r.id));return Oe(t).find(r=>r.parent&&!e.has(r.parent))?.parent||null}function fn(t,e){let n=Oe(t);if(e===z.MERGE_ALL)return n[0];let r=n.filter(o=>!At(o));return r[r.length-1]||n[n.length-1]}function mn(t){let e=new Map;for(let n of t){if(!ge(n)||n.metadata?.is_incremental!==!0)continue;let r=n.metadata?.stream_group_key||`incremental-parent:${n.parent||"root"}`;e.has(r)||e.set(r,[]),e.get(r).push(n)}return Array.from(e.values()).filter(n=>n.length>1)}function bn(t){let e=new Map;for(let n of t){if(!ge(n))continue;let r=un(n);r&&(e.has(r)||e.set(r,[]),e.get(r).push(n))}return Array.from(e.values()).filter(n=>n.length>1&&n.some(At))}function Sn(t,e,n){let r=e.map(l=>t.get(l.id)).filter(Boolean);if(r.length<=1)return;let o=fn(r,n),a=Oe(r),i=new Set(r.map(l=>l.id)),c=hn(r),p=[];for(let l of r)for(let h of l.children||[])!i.has(h)&&t.has(h)&&!p.includes(h)&&p.push(h);for(let l of r)l.id!==o.id&&t.delete(l.id);let d={...o,parent:c,children:p,metadata:{...o.metadata,stream_part_ids:a.map(l=>l.id),stream_group_part_count:Math.max(o.metadata?.stream_group_part_count||0,r.length)}};n===z.MERGE_ALL&&(d.content=gn(a)),t.set(o.id,d);for(let l of t.values())i.has(l.parent)&&l.id!==o.id&&(l.parent=o.id)}function pe(t,e={}){let n=e.mode||R.mode,r=e.conversationId||"unknown";if(!Array.isArray(t)||t.length===0)return{nodes:[],edges:[]};let o=new Map(t.map(d=>[d.id,{...d,children:Array.isArray(d.children)?[...d.children]:[]}]));for(let d of Array.from(o.values()))ge(d)&&!(d.content||"").trim()&&o.delete(d.id);let a=Array.from(o.values()),i=[...bn(a),...mn(a)];for(let d of i)Sn(o,d,n);let c=Array.from(o.values()),p=new Map(c.map(d=>[d.id,d]));return c.forEach(d=>{d.children=[]}),c.filter(d=>d.parent&&p.has(d.parent)).sort((d,l)=>(d.createTime||0)-(l.createTime||0)).forEach(d=>{let l=p.get(d.parent);l.children.includes(d.id)||l.children.push(d.id)}),{nodes:c,edges:pn(c,r)}}function vn(t){s("info","BranchExtractor","Finding branch points...");let e=[];for(let n of t)n.children&&n.children.length>1&&e.push({nodeId:n.id,role:n.role,content:n.content.substring(0,60)+"...",childrenCount:n.children.length,childrenIds:n.children});return s("info","BranchExtractor",`Found ${e.length} branch points`),e}function Nt(t){return t.filter(e=>!e.children||e.children.length===0)}function Q(t){s("info","BranchExtractor","Extracting branches...");let e=ke(t),n=Nt(t),r=[];for(let o of n){let a=wt(o.id,e);r.push({id:o.id,path:a,messageCount:a.length,depth:a.length})}return s("info","BranchExtractor",`Extracted ${r.length} branches`),r}function he(t){if(s("info","BranchExtractor","Building rounds..."),!t||t.length===0)return[];let e=ke(t),r=t.filter(l=>l.role==="user").slice().sort((l,h)=>(l.createTime||0)-(h.createTime||0)).map((l,h)=>{let S=(l.children||[]).map(T=>e.get(T)).filter(T=>T&&T.role==="assistant")[0]||null;return{id:`round_${l.id}`,conversationId:l.conversationId,roundNumber:h+1,depth:0,userMessage:{id:l.id,role:"user",content:l.content||"",createTime:l.createTime},assistantMessage:S?{id:S.id,role:"assistant",content:S.content||"",createTime:S.createTime}:null,userMessageId:l.id,assistantMessageId:S?S.id:null,parentRoundId:null,createTime:l.createTime}}),o=new Map,a=new Map,i=new Map;r.forEach(l=>{i.set(l.id,l),l.userMessageId&&o.set(l.userMessageId,l.id),l.assistantMessageId&&a.set(l.assistantMessageId,l.id)});for(let l of r){let h=e.get(l.userMessageId);if(!h||!h.parent){l.parentRoundId=null;continue}let S=e.get(h.parent);if(!S){l.parentRoundId=null;continue}S.role==="assistant"?l.parentRoundId=a.get(S.id)||null:S.role==="user"?l.parentRoundId=o.get(S.id)||null:l.parentRoundId=null}let c=new Map,p=new Set,d=l=>{if(!l)return 0;if(c.has(l))return c.get(l);if(p.has(l))return 0;p.add(l);let h=i.get(l);if(!h||!h.parentRoundId)return c.set(l,0),p.delete(l),0;let S=d(h.parentRoundId)+1;return c.set(l,S),p.delete(l),S};return r.forEach(l=>{l.depth=d(l.id)}),s("info","BranchExtractor",`Built ${r.length} rounds`),r}function fe(t){let e=vn(t),n=Q(t),r=Nt(t);return{totalNodes:t.length,branchPointsCount:e.length,branchesCount:n.length,leafNodesCount:r.length,branchPoints:e,branches:n,leafNodes:r}}function It(t,e=5e3){return new Promise(n=>{let r=document.querySelector(t);if(r){n(r);return}let o=new MutationObserver((a,i)=>{let c=document.querySelector(t);c&&(i.disconnect(),n(c))});o.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{o.disconnect(),n(null)},e)})}function me(){return/\/c\/[a-f0-9-]+/.test(window.location.pathname)}var $e=class{constructor(){this.currentUrl=window.location.href,this.currentConversationId=null,this.callback=null,this.pollingInterval=null,this.isRunning=!1}start(e,n=1e3){if(this.isRunning){s("warn","URLObserver","Observer already running");return}this.callback=e,this.currentConversationId=H(),this.isRunning=!0,s("info","URLObserver","Starting URL observer",{initialUrl:this.currentUrl,initialConversationId:this.currentConversationId,pollingInterval:n}),window.addEventListener("popstate",this._handleUrlChange.bind(this)),this._interceptHistoryAPI(),this.pollingInterval=setInterval(()=>{this._checkUrlChange()},n),s("info","URLObserver","URL observer started")}stop(){this.isRunning&&(s("info","URLObserver","Stopping URL observer"),window.removeEventListener("popstate",this._handleUrlChange.bind(this)),this.pollingInterval&&(clearInterval(this.pollingInterval),this.pollingInterval=null),this._restoreHistoryAPI(),this.isRunning=!1,s("info","URLObserver","URL observer stopped"))}_checkUrlChange(){let e=window.location.href;e!==this.currentUrl&&(this.currentUrl=e,this._handleUrlChange())}_handleUrlChange(){if(!chrome.runtime?.id){s("warn","URLObserver","Extension context invalidated, stopping observer"),this.stop();return}if(!me()){s("info","URLObserver","Navigated away from conversation page");return}let e=H();if(e&&e!==this.currentConversationId){let n=this.currentConversationId;if(this.currentConversationId=e,s("info","URLObserver","Conversation switched",{from:n||"(none)",to:e}),this.callback)try{Promise.resolve(this.callback(e,n)).catch(r=>{s("error","URLObserver","Callback error:",r)})}catch(r){s("error","URLObserver","Callback error:",r)}}}_interceptHistoryAPI(){let e=history.pushState,n=history.replaceState;this._originalPushState=e,this._originalReplaceState=n,history.pushState=(...r)=>{e.apply(history,r),this._handleUrlChange()},history.replaceState=(...r)=>{n.apply(history,r),this._handleUrlChange()},s("debug","URLObserver","History API intercepted")}_restoreHistoryAPI(){this._originalPushState&&(history.pushState=this._originalPushState),this._originalReplaceState&&(history.replaceState=this._originalReplaceState),s("debug","URLObserver","History API restored")}getCurrentConversationId(){return this.currentConversationId}isObserving(){return this.isRunning}};function Mt(t,e=1e3){let n=new $e;return n.start(t,e),n}var Re="section[data-turn-id], article",yn=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function kt(t){let e=t.getAttribute("id");if(!e)return null;let n=e.match(/^image-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);return n?n[1]:null}function Lt(t){return window.CSS?.escape?window.CSS.escape(t):String(t).replace(/["\\]/g,"\\$&")}function Tn(t){let e=t?.getAttribute?.("data-turn-id");return e&&yn.test(e)?e:null}function En(t){return t?.querySelector?t.querySelector("[data-message-author-role][data-message-id]")||t.querySelector("[data-message-id]"):null}function ee(t){return!!(t?.matches&&t.matches(Re))}function F(t){return t?ee(t)?t:t.closest?t.closest(Re):null:null}function $(t=document){return t?.querySelectorAll?Array.from(t.querySelectorAll(Re)):[]}function xn(t){return t?t.includes("placeholder"):!1}function Pt(t,e={}){let{allowTurnIdFallback:n=!0}=e;if(!t?.getAttribute)return null;if(t.hasAttribute("data-message-id"))return t.getAttribute("data-message-id");let r=F(t);if(r){let a=En(r);if(a)return a.getAttribute("data-message-id");if(r.hasAttribute("data-message-id"))return r.getAttribute("data-message-id");let i=r.querySelector?.('[id^="image-"]');if(i){let c=kt(i);if(c)return c}if(n){let c=Tn(r);if(c)return c}return n&&s("warn","MessageIdHelper","Message container missing data-message-id attribute"),null}let o=kt(t);return o||null}function X(t){let e=Pt(t,{allowTurnIdFallback:!1});return xn(e)?null:e}function O(t){return Pt(t,{allowTurnIdFallback:!0})}function W(t){if(!t)return null;let e=Lt(t),n=document.querySelector(`[data-message-id="${e}"]`);if(n)return F(n)||n;let r=document.querySelector(`section[data-turn-id="${e}"], article[data-turn-id="${e}"]`);if(r||(r=document.querySelector(`section[data-message-id="${e}"], article[data-message-id="${e}"]`),r))return r;if(r=document.querySelector(`[id="image-${e}"]`),r)return F(r)||r;let o=$();for(let a of o)if(O(a)===t||a.getAttribute("data-turn-id")===t)return a;return null}function Ot(t){if(!t)return!1;let e=Lt(t);return!!(document.querySelector(`[data-message-id="${e}"]`)||document.querySelector(`[data-turn-id="${e}"]`)||document.querySelector(`[id="image-${e}"]`)||W(t))}function Ge(t){return t?.querySelector&&(t.querySelector("[data-message-author-role]")?.getAttribute("data-message-author-role")||t.getAttribute("data-turn"))||null}function wn(t,e){for(let n=e-1;n>=0;n--)if(Ge(t[n])==="user")return t[n];return null}function _n(t,e){if(e!=="assistant")return null;let n=document.querySelector("main")||document,r=$(n),o=r.indexOf(t);if(o===-1&&(o=r.findIndex(T=>T===t||T.contains(t)||t.contains(T))),o===-1)return null;let a=o;for(;a>0&&Ge(r[a-1])==="assistant";)a--;let i=o;for(;i<r.length-1&&Ge(r[i+1])==="assistant";)i++;let c=r.slice(a,i+1),p=O(c[0])||O(t),d=wn(r,a),l=d?O(d):null,h=l||"root",S=p||O(t)||`dom-${a}`;return{key:`${h}:${S}`,parentUserId:l,partIndex:Math.max(0,c.indexOf(t)),partCount:c.length}}function $t(t){let e=F(t);if(!e)return null;try{let n=O(e),r=e.getAttribute("data-turn"),o=e.querySelector("[data-message-author-role]");o&&(r=o.getAttribute("data-message-author-role"));let a=e.getAttribute("data-testid")?.match(/\d+/)?.[0];if(!n||!r)return null;let i="",c=null;if(r==="user"?c=e.querySelector(".whitespace-pre-wrap"):c=e.querySelector(".markdown"),c||(c=e.querySelector("[data-message-author-role] > div")),c)i=c.innerText.trim();else{let S=e.querySelectorAll("div"),T=0;S.forEach(A=>{if(A.tagName==="SCRIPT"||A.style.display==="none")return;let E=A.innerText?.trim()||"";E.length>T&&E.length>5&&(i=E,T=E.length)})}let p=null,d=e.previousElementSibling;for(;d;){if(ee(d)){let S=O(d);if(S){p=S;break}}d=d.previousElementSibling}let l=_n(e,r);return l?.parentUserId&&(p=l.parentUserId),{id:n,role:r,content:i,parent:p,turnNumber:a?parseInt(a):null,streamGroupKey:l?.key||null,streamGroupPartIndex:l?.partIndex??null,streamGroupPartCount:l?.partCount??null,timestamp:Date.now(),source:"dom"}}catch(n){return s("error","MessageExtractor","Failed to extract message:",n),null}}var De=class{constructor(){this.observer=null,this.callback=null,this.isRunning=!1,this.processedMessages=new Set,this.pendingMessages=new Map,this.pendingIdObservers=new WeakMap,this.pendingIdArticles=new Set,this.periodicScanInterval=null}start(e){if(this.isRunning){s("warn","MessageObserver","Observer already running");return}this.callback=e,this.isRunning=!0;let n=$(),r=0;n.forEach(i=>{let c=X(i);c?(this.processedMessages.add(c),r++):this.pendingIdObservers.has(i)||this._watchForMessageId(i)}),s("info","MessageObserver","Starting message observer",{existingMessages:r});let o=document.querySelector("main")||document.body;if(!o){s("error","MessageObserver","Target node (main/body) not found");return}this.observer=new MutationObserver(i=>{this._handleMutations(i)});let a={childList:!0,subtree:!0,attributes:!1,characterData:!1};this.observer.observe(o,a),this._startPeriodicScan(),s("info","MessageObserver","Message observer started")}stop(){this.observer&&(this.observer.disconnect(),this.observer=null),this._stopPeriodicScan(),this.processedMessages.clear(),this.pendingMessages.forEach(e=>clearTimeout(e)),this.pendingMessages.clear(),this._cleanupAllPendingIdObservers(),this.isRunning=!1,s("info","MessageObserver","Message observer stopped")}_handleMutations(e){for(let n of e)n.addedNodes.forEach(r=>{r.nodeType===Node.ELEMENT_NODE&&this._checkForNewMessage(r)})}_checkForNewMessage(e){let n=new Set;ee(e)&&n.add(e);let r=F(e);r&&n.add(r),e.querySelectorAll&&($(e).forEach(o=>n.add(o)),e.querySelectorAll("[data-message-author-role][data-message-id]").forEach(o=>{let a=F(o);a&&n.add(a)})),n.forEach(o=>this._processNewArticle(o))}_processNewArticle(e){let n=X(e);if(!n||n.startsWith("placeholder-")){if(this.pendingIdObservers.has(e))return;this._watchForMessageId(e);return}if(this._cleanupPendingIdObserver(e),this.processedMessages.has(n))return;let r=e.getAttribute("data-turn");if(!r){let o=e.querySelector("[data-message-author-role]");o&&(r=o.getAttribute("data-message-author-role"))}s("info","MessageObserver","New message detected",{id:n.substring(0,8)+"...",role:r||"unknown"}),this.processedMessages.add(n),r==="user"?this._extractAndNotify(e,n):r==="assistant"&&this._waitForAssistantMessage(e,n)}_watchForMessageId(e){let r=new MutationObserver(()=>{let a=X(e);a&&!a.startsWith("placeholder-")&&(this._cleanupPendingIdObserver(e),this._processNewArticle(e))}),o=setTimeout(()=>{this._cleanupPendingIdObserver(e),s("warn","MessageObserver","Timeout waiting for message-id",{turnId:e.getAttribute("data-turn-id")})},1e4);this.pendingIdObservers.set(e,{observer:r,timeoutId:o}),this.pendingIdArticles.add(e),r.observe(e,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["data-message-id","data-turn-id"]}),s("debug","MessageObserver","Started watching for message-id",{turnId:e.getAttribute("data-turn-id")})}_cleanupPendingIdObserver(e){let n=this.pendingIdObservers.get(e);n&&(n.observer.disconnect(),clearTimeout(n.timeoutId),this.pendingIdObservers.delete(e),this.pendingIdArticles.delete(e))}_cleanupAllPendingIdObservers(){for(let e of this.pendingIdArticles){let n=this.pendingIdObservers.get(e);n&&(n.observer.disconnect(),clearTimeout(n.timeoutId))}this.pendingIdArticles.clear()}_waitForAssistantMessage(e,n){this.pendingMessages.has(n)&&clearTimeout(this.pendingMessages.get(n));let r=()=>{if(this._isMessageStreaming(e)){let i=setTimeout(r,1e3);this.pendingMessages.set(n,i)}else s("info","MessageObserver","Message streaming complete",n),this.pendingMessages.delete(n),document.body.contains(e)?this._extractAndNotify(e,n):s("warn","MessageObserver","Message removed from DOM before completion",n)},o=setTimeout(r,500);this.pendingMessages.set(n,o)}_isMessageStreaming(e){return!!(document.querySelector('[data-testid="stop-button"]')||document.querySelector('button[aria-label*="\u505C\u6B62"]')||document.querySelector('button[aria-label*="Stop"]'))}_extractAndNotify(e,n){let r=n||X(e);if(!r){s("warn","MessageObserver","Cannot extract unique ID for notification");return}this.processedMessages.add(r);let o=$t(e);if(!o){s("warn","MessageObserver","Failed to extract message data from DOM");return}if(o.id=r,s("info","MessageObserver","Message extracted successfully",{id:o.id.substring(0,8)+"...",role:o.role,contentLength:o.content?o.content.length:0}),this.callback)try{Promise.resolve(this.callback(o)).catch(a=>{s("error","MessageObserver","Callback execution error:",a)})}catch(a){s("error","MessageObserver","Callback trigger error:",a)}}getProcessedCount(){return this.processedMessages.size}isObserving(){return this.isRunning}_startPeriodicScan(){this._stopPeriodicScan();let e=3e3;this.periodicScanInterval=setInterval(()=>{if(this._isMessageStreaming())return;let n=$(),r=0;n.forEach(o=>{let a=X(o);!a||a.startsWith("placeholder-")||this.processedMessages.has(a)||(r++,this._processNewArticle(o))}),r>0&&s("info","MessageObserver",`Periodic scan found ${r} new message(s)`)},e),s("debug","MessageObserver","Periodic scan started (interval: 3s)")}_stopPeriodicScan(){this.periodicScanInterval&&(clearInterval(this.periodicScanInterval),this.periodicScanInterval=null)}reset(){s("info","MessageObserver","Resetting observer state"),this.processedMessages.clear(),this.pendingMessages.forEach(e=>clearTimeout(e)),this.pendingMessages.clear(),this._cleanupAllPendingIdObservers()}};function Rt(t){let e=new De;try{e.start(t)}catch(n){s("error","MessageObserver","Failed to start observer via factory:",n)}return e}var Be=class{constructor(){this.conversationId=null,this.title=null,this.mapping={},this.nodes=[],this.edges=[],this.rounds=[],this.branches=[],this.analysis=null,this.createTime=null,this.updateTime=null,this.lastUpdateTime=null,this.incrementalCount=0,this.isInitialized=!1,this.assistantStreamSettings={...R}}setAssistantStreamSettings(e={}){let n=e.mode,r=Object.values(z);this.assistantStreamSettings={...R,...e,mode:r.includes(n)?n:R.mode},s("info","State","Assistant stream settings updated",this.assistantStreamSettings)}initialize(e){this.conversationId=e.id,this.title=e.title,this.mapping={...e.mapping},this.nodes=e.nodes,this.edges=e.edges||[],this.rounds=e.rounds,this.branches=e.branches,this.analysis=e.analysis,this.createTime=e.createTime,this.updateTime=e.updateTime,this.lastUpdateTime=Date.now(),this.incrementalCount=0,this.isInitialized=!0,s("info","State","Conversation state initialized",{id:this.conversationId,nodes:this.nodes.length,edges:this.edges.length,rounds:this.rounds.length,branches:this.branches.length})}addIncrementalNode(e){if(!this.isInitialized)return s("warn","State","Cannot add incremental node: state not initialized"),{changed:!1,nodeId:null,action:"not_initialized"};let n=e.id;if(this.mapping[n])return s("debug","State",`Node ${n} already exists, skipping`),{changed:!1,nodeId:n,action:"already_exists"};if(e.role===P.ASSISTANT&&!(e.content||"").trim())return s("debug","State",`Assistant node ${n} has no content, skipping`),{changed:!1,nodeId:n,action:"empty_assistant"};s("info","State","Adding incremental node",{id:n,role:e.role,contentLength:e.content?.length||0,streamGroupKey:e.streamGroupKey||null});let r=this.createIncrementalMappingNode(e),o=e.role===P.ASSISTANT?this.upsertAssistantIncrementalNode(e,r):this.insertMappingNode(r);return o.changed&&(this.reparse(),this.incrementalCount++,this.lastUpdateTime=Date.now(),s("info","State","Incremental node processed successfully",{action:o.action,nodeId:o.nodeId,totalNodes:this.nodes.length,incrementalCount:this.incrementalCount})),o}createIncrementalMappingNode(e){let n=e.id;return{id:n,message:{id:n,author:{role:e.role},content:{content_type:"text",parts:[e.content||""]},create_time:e.timestamp/1e3,metadata:{is_incremental:!0,source:"dom",timestamp:e.timestamp,turn_number:e.turnNumber??null,stream_group_key:e.streamGroupKey||null,stream_group_part_index:e.streamGroupPartIndex??null,stream_group_part_count:e.streamGroupPartCount??null,stream_part_ids:[n]}},parent:e.parent,children:[]}}insertMappingNode(e){return this.mapping[e.id]=e,this.attachToParent(e.id,e.parent),{changed:!0,nodeId:e.id,action:"added"}}upsertAssistantIncrementalNode(e,n){return this.assistantStreamSettings.mode===z.MERGE_ALL?this.mergeAssistantStreamGroup(e,n):this.replaceAssistantStreamGroupWithFinalPart(e,n)}replaceAssistantStreamGroupWithFinalPart(e,n){let r=this.findAssistantStreamGroupNodes(e);if(r.length===0)return this.insertMappingNode(n);let o=this.getStreamPartIndex(n),a=r.reduce((i,c)=>{let p=this.getStreamPartIndex(c);return p>i.index?{node:c,index:p}:p===i.index&&this.getNodeTimestamp(c)>this.getNodeTimestamp(i.node)?{node:c,index:p}:i},{node:r[0],index:this.getStreamPartIndex(r[0])});return o<a.index?(s("debug","State","Skipping older streamed assistant part",{incomingId:n.id,existingId:a.node.id,incomingIndex:o,existingIndex:a.index}),{changed:!1,nodeId:a.node.id,action:"skipped_older_stream_part"}):(r.forEach(i=>this.removeMappingNode(i.id)),this.insertMappingNode(n),{changed:!0,nodeId:n.id,action:"replaced_stream_group"})}mergeAssistantStreamGroup(e,n){let r=this.findAssistantStreamGroupNodes(e);if(r.length===0)return this.insertMappingNode(n);let a=[...[...r,n]].sort((d,l)=>{let h=this.getStreamPartIndex(d)-this.getStreamPartIndex(l);return h!==0?h:this.getNodeTimestamp(d)-this.getNodeTimestamp(l)}),i=a[0],c=this.mergeAssistantStreamContent(a),p=[...new Set(a.map(d=>d.id))];if(r.filter(d=>d.id!==i.id).forEach(d=>this.removeMappingNode(d.id)),i.id===n.id)n.message.content.parts=[c],n.message.metadata.stream_part_ids=p,this.insertMappingNode(n);else{let d=this.mapping[i.id];if(!d)return this.insertMappingNode(n);d.message.content.parts=[c],d.message.metadata={...d.message.metadata,timestamp:e.timestamp,stream_part_ids:p,stream_group_part_count:Math.max(d.message.metadata?.stream_group_part_count||0,e.streamGroupPartCount||0,p.length)}}return{changed:!0,nodeId:i.id,action:"merged_stream_group"}}mergeAssistantStreamContent(e){return e.reduce((n,r)=>{let o=this.getNodeContent(r).trim();return o?n?n.includes(o)?n:o.includes(n)?o:`${n}

${o}`:o:n},"")}findAssistantStreamGroupNodes(e){return Object.values(this.mapping).filter(n=>this.isIncrementalAssistantNode(n)&&this.isSameAssistantStreamGroup(n,e))}isIncrementalAssistantNode(e){return e?.message?.author?.role===P.ASSISTANT&&e.message.metadata?.is_incremental===!0}isSameAssistantStreamGroup(e,n){let o=(e.message?.metadata||{}).stream_group_key,a=n.streamGroupKey;return o||a?o===a:(e.parent||null)===(n.parent||null)}getNodeContent(e){let n=e?.message?.content?.parts;return Array.isArray(n)?n.filter(r=>typeof r=="string").join(`
`):""}getStreamPartIndex(e){let n=Number(e?.message?.metadata?.stream_group_part_index);return Number.isFinite(n)?n:Number.MAX_SAFE_INTEGER}getNodeTimestamp(e){let n=Number(e?.message?.metadata?.timestamp);return Number.isFinite(n)?n:0}attachToParent(e,n){if(n&&this.mapping[n]){let r=this.mapping[n].children;r.includes(e)||(r.push(e),s("debug","State",`Updated parent ${n} children`))}}removeMappingNode(e){let n=this.mapping[e];n&&(n.parent&&this.mapping[n.parent]&&(this.mapping[n.parent].children=(this.mapping[n.parent].children||[]).filter(r=>r!==e)),delete this.mapping[e])}reparse(){try{let{nodes:e,edges:n}=de(this.mapping,this.conversationId),r=pe(e,{mode:this.assistantStreamSettings.mode,conversationId:this.conversationId});this.nodes=r.nodes,this.edges=e.length>0?r.edges:n,this.rounds=he(this.nodes),this.branches=Q(this.nodes),this.analysis=fe(this.nodes);let o=ue(this.nodes);s("debug","State","Reparsed conversation",{...o,edges:this.edges.length})}catch(e){s("error","State","Failed to reparse:",e)}}getFullData(){return{id:this.conversationId,title:this.title,createTime:this.createTime,updateTime:this.updateTime,mapping:this.mapping,nodes:this.nodes,edges:this.edges,rounds:this.rounds,branches:this.branches,analysis:this.analysis,metadata:{lastUpdateTime:this.lastUpdateTime,incrementalCount:this.incrementalCount,isFullyLoaded:this.isInitialized}}}getIncrementalUpdate(e){let n=this.nodes.find(r=>r.id===e);return{type:"incremental",conversationId:this.conversationId,newNode:n,updatedNodes:this.nodes,updatedEdges:this.edges,updatedBranches:this.branches,updatedRounds:this.rounds,updatedAnalysis:this.analysis,timestamp:Date.now()}}getStats(){return{conversationId:this.conversationId,totalNodes:this.nodes.length,totalEdges:this.edges.length,totalRounds:this.rounds.length,totalBranches:this.branches.length,branchPoints:this.analysis?.branchPointsCount||0,incrementalNodes:this.incrementalCount,lastUpdateTime:this.lastUpdateTime,isInitialized:this.isInitialized}}clear(){this.conversationId=null,this.title=null,this.mapping={},this.nodes=[],this.edges=[],this.rounds=[],this.branches=[],this.analysis=null,this.createTime=null,this.updateTime=null,this.lastUpdateTime=null,this.incrementalCount=0,this.isInitialized=!1,s("info","State","Conversation state cleared")}isReady(){return this.isInitialized&&this.conversationId!==null}getNodes(){return this.nodes}},L=new Be;function be(){let t=$();return Array.from(t).map(n=>{let r=O(n);return r||n.getAttribute("data-turn-id")}).filter(n=>n)}function Cn(t){let e=W(t);if(!e)return null;let n=e.querySelector(".tabular-nums");if(!n)return{current:1,total:1};let o=n.innerText.trim().match(/(\d+)\s*\/\s*(\d+)/);return o?{current:parseInt(o[1],10),total:parseInt(o[2],10)}:{current:1,total:1}}function An(t,e){let n=W(t);if(!n)return s("warn","BranchNav",`Article not found for ID: ${t}`),!1;let r=n.querySelector(".tabular-nums");if(!r)return s("warn","BranchNav",`Branch info element (.tabular-nums) not found for ${t}`),!1;let o=null;if(e==="prev"?(o=r.previousElementSibling,o&&o.tagName!=="BUTTON"&&(o=o.querySelector("button")||r.parentElement.firstElementChild)):(o=r.nextElementSibling,o&&o.tagName!=="BUTTON"&&(o=o.querySelector("button")||r.parentElement.lastElementChild)),!o||o.tagName!=="BUTTON"){let a=r.parentElement;if(a){let i=a.querySelectorAll("button");i.length>=2&&(o=e==="prev"?i[0]:i[i.length-1])}}if(!o)return s("error","BranchNav",`Button ${e} not found`),!1;if(o.disabled)return s("warn","BranchNav",`Button ${e} is disabled`),!1;try{return o.click(),!0}catch(a){return s("error","BranchNav",`Click failed: ${a.message}`),!1}}function Nn(t,e=2e3){return new Promise((n,r)=>{let o=Date.now(),a=()=>{if(!Ot(t)){n();return}if(Date.now()-o>e){s("warn","BranchNav",`Timeout waiting for ID ${t} to disappear`),n();return}requestAnimationFrame(a)};requestAnimationFrame(a)})}function In(t,e){let n=[],r=t,o=0,a=1e4;for(;r;){if(n.unshift(r),++o>a){console.error("[buildPathToTarget] Potential cycle detected or path too long");break}r=e.get(r)?.parent||null}return n}function Mn(t,e){let n=e.get(t);if(!n)return[t];let r=[];if(!n.parent)r=Array.from(e.values()).filter(o=>!o.parent);else{let o=e.get(n.parent);if(o&&o.children)r=o.children.map(a=>e.get(a)).filter(a=>a);else return[t]}return r.sort((o,a)=>{let i=o.createTime||0,c=a.createTime||0;return i!==c?i-c:o.id<a.id?-1:o.id>a.id?1:0}),r.map(o=>o.id)}async function Gt(t,e){s("info","BranchNav",`Navigating to message: ${t}`);let n=new Map(e.map(i=>[i.id,i]));if(!n.has(t))return{success:!1,message:`Target node not found: ${t}`};let r=In(t,n);s("info","BranchNav",`Target path: ${r.length} nodes`);let o=be();if(s("info","BranchNav",`Current path: ${o.length} nodes`),o.includes(t))return s("info","BranchNav","Target already in current path"),{success:!0,message:"Already on target branch"};let a=-1;for(let i=0;i<r.length;i++)if(!o.includes(r[i])){a=i;break}if(a===-1)return{success:!1,message:"Unexpected: all target ancestors in current path but target not found"};s("info","BranchNav",`Divergence at index ${a}, node: ${r[a]}`);for(let i=a;i<r.length;i++){let c=r[i],p=n.get(c),d=Mn(c,n);if(d.length<=1){s("info","BranchNav",`Node ${c.substring(0,8)}... has no siblings, skipping`);continue}let l=d.indexOf(c)+1;s("info","BranchNav",`Target sibling index: ${l}/${d.length}`),o=be();let h=null;for(let C of d)if(o.includes(C)){h=C;break}if(!h){s("warn","BranchNav","\u{1F6D1} No sibling found in current path! Debugging context:"),console.group("State Data (Siblings)"),console.groupEnd(),console.group("DOM Data (Current Path)"),console.groupEnd();let C=d.find(b=>o.some(f=>f&&(f.includes(b)||b.includes(f))));console.warn(C?`\u{1F4A1} HINT: Found a potential fuzzy match! State: "${C}" vs DOM. Check ID format.`:"\u274C No fuzzy match found either.")}if(!h){s("warn","BranchNav",`No sibling found in current path for target ${c.substring(0,8)}...`);continue}if(h===c){s("info","BranchNav","Already on target sibling at this level");continue}let S=Cn(h);if(!S){s("warn","BranchNav",`No branch info for ${h.substring(0,8)}...`);continue}s("info","BranchNav",`Switching from ${S.current}/${S.total} to ${l}`);let T=l-S.current;if(T===0){s("info","BranchNav","Already on correct branch index");continue}let A=T>0?"next":"prev",E=Math.abs(T);s("info","BranchNav",`Need ${E} clicks ${A}`);for(let C=0;C<E;C++){o=be();let b=null;for(let f of d)if(o.includes(f)){b=f;break}if(b||(b=o[0]),!An(b,A))return s("error","BranchNav",`Failed to click ${A} at step ${C+1}`),{success:!1,message:`Failed to click ${A} button`};try{await Nn(b,2e3),await new Promise(f=>setTimeout(f,150))}catch(f){return s("error","BranchNav",`Error waiting for change: ${f.message}`),{success:!1,message:f.message}}}await new Promise(C=>setTimeout(C,200))}return o=be(),o.includes(t)?(s("info","BranchNav","Navigation successful!"),{success:!0,message:"Navigation successful"}):(s("warn","BranchNav","Target not in final path after navigation"),{success:!1,message:"Navigation completed but target is still not displayed"})}var Dt=`
/* ==================== \u6298\u53E0\u5BB9\u5668\u6837\u5F0F ==================== */
.chatgpt-graph-collapsible {
  position: relative;
}

.chatgpt-graph-collapsed {
  max-height: 150px;
  overflow-y: auto;
  position: relative;
}

/* \u6EDA\u52A8\u6761\u6837\u5F0F - \u5339\u914D ChatGPT \u539F\u7248 */
.chatgpt-graph-collapsed::-webkit-scrollbar {
  background: transparent;
  width: 16px;
}

.chatgpt-graph-collapsed::-webkit-scrollbar-thumb {
  background: var(--border-medium, #e5e5e5);
  border: 4px solid transparent;
  border-radius: 8px;
  background-clip: padding-box;
}

.chatgpt-graph-collapsed::-webkit-scrollbar-thumb:hover {
  background: var(--border-heavy, #c5c5c5);
  border: 4px solid transparent;
  background-clip: padding-box;
}

/* \u5E95\u90E8\u6E10\u53D8\u906E\u7F69 */
.chatgpt-graph-collapsed::after {
  content: '';
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(to bottom, transparent, var(--main-surface-primary, #ffffff));
  pointer-events: none;
  display: block;
  margin-top: -30px;
}

/* \u6697\u8272\u6A21\u5F0F\u652F\u6301 */
.dark .chatgpt-graph-collapsed::after {
  background: linear-gradient(to bottom, transparent, var(--main-surface-primary, #212121));
}

.dark .chatgpt-graph-collapsed::-webkit-scrollbar-thumb {
  background: var(--border-medium, #444444);
  border: 4px solid transparent;
  background-clip: padding-box;
}

.dark .chatgpt-graph-collapsed::-webkit-scrollbar-thumb:hover {
  background: var(--border-heavy, #666666);
  border: 4px solid transparent;
  background-clip: padding-box;
}

/* ==================== \u6298\u53E0\u6309\u94AE\u6837\u5F0F ==================== */
.chatgpt-graph-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgb(93, 93, 93);
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.chatgpt-graph-collapse-btn:hover {
  background: var(--token-bg-secondary, rgba(0, 0, 0, 0.05));
}

.chatgpt-graph-collapse-btn:active {
  background: var(--token-bg-tertiary, rgba(0, 0, 0, 0.1));
}

.chatgpt-graph-collapse-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* \u6697\u8272\u6A21\u5F0F\u6309\u94AE */
.dark .chatgpt-graph-collapse-btn {
  color: rgb(180, 180, 180);
}

.dark .chatgpt-graph-collapse-btn:hover {
  background: var(--token-bg-secondary, rgba(255, 255, 255, 0.1));
}

/* ==================== \u52A8\u753B\u6548\u679C ==================== */
.chatgpt-graph-collapsible {
  transition: max-height 0.3s ease-out;
}

.chatgpt-graph-collapse-btn svg {
  transition: transform 0.2s ease;
}
`,Ue=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="17 11 12 6 7 11"></polyline>
  <polyline points="17 18 12 13 7 18"></polyline>
</svg>`,Fe=`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="7 13 12 18 17 13"></polyline>
  <polyline points="7 6 12 11 17 6"></polyline>
</svg>`;var B={...ie},qe=null,te=null,Bt=!1,Ut=new WeakMap;async function zt(){try{let e=(await chrome.storage.local.get(M.COLLAPSE_SETTINGS))[M.COLLAPSE_SETTINGS];if(e)return{...ie,...e}}catch(t){s("warn","Collapse","Failed to load settings:",t)}return{...ie}}function kn(){te||(te=document.createElement("style"),te.id="chatgpt-graph-collapse-styles",te.textContent=Dt,document.head.appendChild(te),s("info","Collapse","Styles injected"))}function Ln(t){let e=t.querySelector(".markdown, [data-message-content], .whitespace-pre-wrap");return e?(e.textContent||"").trim().length:0}function Pn(t){let e=t.querySelector("h5"),n=t.querySelector("h6");if(e)return"user";if(n)return"assistant";let r=t.getAttribute("data-message-author-role");return r==="user"?"user":r==="assistant"?"assistant":t.querySelector('[data-message-author-role="user"]')?"user":t.querySelector('[data-message-author-role="assistant"]')?"assistant":null}function On(t){let e=t.querySelector(".markdown");return e||(e=t.querySelector(".whitespace-pre-wrap"),e)||(e=t.querySelector("[data-message-content]"),e)?e:null}function $n(t,e){if(e==="user"){let n=t.querySelector('button[aria-label*="\u590D\u5236"], button[aria-label*="Copy"]');if(n&&n.parentElement)return n.parentElement}if(e==="assistant"){let n=t.querySelector('button[aria-label*="\u66F4\u591A"], button[aria-label*="More"]');if(n&&n.parentElement)return n.parentElement;let r=t.querySelector('button[aria-label*="\u590D\u5236"], button[aria-label*="Copy"]');if(r&&r.parentElement)return r.parentElement}return null}function Rn(t){let e=t.getBoundingClientRect(),n=window.innerHeight||document.documentElement.clientHeight;return e.top>=0&&e.top<n}function Gn(t){t.scrollIntoView({behavior:"smooth",block:"start"})}function ze(t,e){t.innerHTML=e?Fe:Ue,t.className=`chatgpt-graph-collapse-btn ${e?"collapsed":""}`,t.setAttribute("aria-label",e?"Expand":"Collapse"),t.title=e?"Expand":"Collapse"}function Se(t,e){e?t.classList.add("chatgpt-graph-collapsed"):t.classList.remove("chatgpt-graph-collapsed")}function Ft(t){return!(!B.enabled||t==="user"&&!B.autoCollapseQuestion||t==="assistant"&&!B.autoCollapseAnswer)}function Dn(t,e=!1){let n=Ut.get(t);if(n){if(e){let l=Ft(n.messageType);l&&!n.isCollapsed?(n.isCollapsed=!0,Se(n.contentContainer,!0),ze(n.btn,!0)):!l&&n.isCollapsed&&(n.isCollapsed=!1,Se(n.contentContainer,!1),ze(n.btn,!1))}return}let r=Pn(t);if(!r)return;let o=Ln(t);if(o<B.threshold)return;let a=On(t);if(!a)return;let i=$n(t,r);if(!i)return;a.classList.add("chatgpt-graph-collapsible");let c=Ft(r);Se(a,c);let p=document.createElement("button");p.className=`chatgpt-graph-collapse-btn ${c?"collapsed":""}`,p.innerHTML=c?Fe:Ue,p.setAttribute("aria-label",c?"Expand":"Collapse"),p.title=c?"Expand":"Collapse";let d={messageType:r,contentContainer:a,btn:p,isCollapsed:c,textLength:o};if(Ut.set(t,d),p.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),d.isCollapsed=!d.isCollapsed,Se(a,d.isCollapsed),ze(p,d.isCollapsed),d.isCollapsed&&setTimeout(()=>{Rn(t)||Gn(t)},50)}),r==="user")i.appendChild(p);else{let l=i.querySelector('button[aria-label*="\u66F4\u591A"], button[aria-label*="More"]');l?i.insertBefore(p,l):i.appendChild(p)}s("debug","Collapse",`Processed ${r} message (${o} chars, collapsed: ${c})`)}function He(t=!1){document.querySelectorAll("article").forEach(n=>{try{Dn(n,t)}catch(r){s("warn","Collapse","Failed to process message:",r)}})}function Bn(){if(qe)return;let t=document.querySelector("main")||document.body;qe=new MutationObserver(e=>{let n=!1;for(let r of e){if(r.type==="childList"&&r.addedNodes.length>0){for(let o of r.addedNodes)if(o.nodeType===Node.ELEMENT_NODE&&(o.tagName==="ARTICLE"||o.querySelector?.("article"))){n=!0;break}}if(n)break}n&&setTimeout(()=>He(!1),100)}),qe.observe(t,{childList:!0,subtree:!0}),s("info","Collapse","DOM observer started")}async function Ht(){Bt||(s("info","Collapse","Initializing collapse manager..."),B=await zt(),s("info","Collapse","Settings loaded:",B),kn(),He(!1),Bn(),Bt=!0,s("info","Collapse","Collapse manager initialized"))}async function qt(){s("info","Collapse","Updating collapse settings...");let t={...B};B=await zt(),s("info","Collapse","Settings updated:",B),He(!0),s("info","Collapse","Collapse settings applied")}function Vt(){chrome.storage?.onChanged?.addListener((t,e)=>{e==="local"&&t[M.COLLAPSE_SETTINGS]&&(s("info","Collapse","Settings changed from storage"),qt())}),chrome.runtime?.onMessage?.addListener((t,e,n)=>{if(t.type==="COLLAPSE_SETTINGS_CHANGED")return s("info","Collapse","Settings changed from popup"),qt().then(()=>{n({success:!0})}),!0})}var m="__chatgpt_graph_floating_panel__",Wt="__chatgpt_graph_floating_panel_style__",K="chatgpt_graph_floating_panel_state_v1",ne={x:24,y:88,width:420,height:640,opacity:.96,minimized:!1,locked:!1,clickThrough:!1,controlsHidden:!1};function Z(t,e,n){return Math.min(n,Math.max(e,t))}async function Ve(){try{let e=(await chrome.storage.local.get([K]))?.[K];return!e||typeof e!="object"?{...ne}:{...ne,...e,opacity:Z(Number(e.opacity??ne.opacity),.25,1)}}catch{return{...ne}}}var I=bt(async t=>{try{let e=await chrome.storage.local.get([K]),n=e?.[K]&&typeof e[K]=="object"?e[K]:{},r={...ne,...n,...t};await chrome.storage.local.set({[K]:r})}catch{}},120);function Un(){let t=document.getElementById(Wt),e=t||document.createElement("style");e.id=Wt,e.textContent=`
    #${m} {
      position: fixed;
      z-index: 2147483646;
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(0,0,0,.18);
      background: rgba(255,255,255,.86);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      opacity: var(--cgAlpha, 0.96);
      transition: opacity .12s ease;
      overflow: hidden;
      resize: none;
      min-width: 280px;
      min-height: 240px;
      max-width: min(92vw, 840px);
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      transform: translateZ(0);
      user-select: none;
    }
    #${m}.cg-controls-hidden .cg-header {
      display: none;
    }
    #${m}.cg-popover-open {
      overflow: visible;
    }
    #${m}.cg-minimized {
      height: 44px !important;
      min-height: 44px !important;
      resize: none;
      overflow: visible;
    }
    #${m}.cg-locked {
      resize: none;
    }

    /* ============================================================
       Header layout: flex-start + margin-left:auto (no space-between)
       This prevents negative gap / overlap issues at narrow widths.
    ============================================================ */
    #${m} .cg-header {
      height: 40px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--cg-gap, 8px);
      padding: 0 var(--cg-pad, 10px);
      background: rgba(255,255,255,.90);
      border-bottom: 1px solid rgba(15, 23, 42, .08);
      cursor: grab;
      flex-wrap: nowrap;
      white-space: nowrap;
      overflow: hidden;
    }
    #${m}.cg-locked .cg-header {
      cursor: default;
    }
    #${m} .cg-bar-left {
      display: flex;
      align-items: center;
      gap: var(--cg-gap, 6px);
      cursor: default;
      min-width: 0;
      flex-shrink: 0;
    }
    #${m} .cg-bar-right {
      display: flex;
      align-items: center;
      gap: var(--cg-gap, 6px);
      cursor: default;
      min-width: 0;
      flex-shrink: 0;
      margin-left: auto;
    }

    /* ============================================================
       Responsive compact levels (overflow-driven)
       Level 0: default
       Level 1: shrink sizes/gaps
       Level 2: hide refresh
       Level 3: hide refresh + minimap
       Level 4: hide refresh + minimap + opacity
    ============================================================ */
    #${m}[data-cg-compact="1"] {
      --cg-gap: 4px;
      --cg-pad: 8px;
      --cg-btn: 26px;
      --cg-view-btn: 26px;
      --cg-slider: 56px;
    }
    #${m}[data-cg-compact="2"] {
      --cg-gap: 4px;
      --cg-pad: 8px;
      --cg-btn: 26px;
      --cg-view-btn: 26px;
      --cg-slider: 56px;
    }
    #${m}[data-cg-compact="2"] .cg-header [data-action="refresh"] {
      display: none !important;
    }
    #${m}[data-cg-compact="3"] {
      --cg-gap: 4px;
      --cg-pad: 8px;
      --cg-btn: 26px;
      --cg-view-btn: 26px;
      --cg-slider: 56px;
    }
    #${m}[data-cg-compact="3"] .cg-header [data-action="refresh"] {
      display: none !important;
    }
    #${m}[data-cg-compact="3"] .cg-header [data-action="minimap"] {
      display: none !important;
    }
    #${m}[data-cg-compact="4"] {
      --cg-gap: 4px;
      --cg-pad: 6px;
      --cg-btn: 24px;
      --cg-view-btn: 24px;
    }
    #${m}[data-cg-compact="4"] .cg-header [data-action="refresh"] {
      display: none !important;
    }
    #${m}[data-cg-compact="4"] .cg-header [data-action="minimap"] {
      display: none !important;
    }
    #${m}[data-cg-compact="4"] .cg-header .cg-opacity {
      display: none !important;
    }

    /* NOTE: Do NOT hide the view toggle in compact mode.
       Users want Graph/Tree switching always visible, even at minimum size. */

    #${m} .cg-view-toggle {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      background: rgba(241, 245, 249, .92);
      border: 1px solid rgba(15, 23, 42, .10);
      border-radius: 10px;
      flex-shrink: 0;
    }
    #${m} .cg-view-btn {
      width: var(--cg-view-btn, 30px);
      height: var(--cg-view-btn, 30px);
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    }
    #${m} .cg-icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }
    #${m} .cg-btn:hover .cg-icon,
    #${m} .cg-view-btn:hover .cg-icon {
      opacity: 0.9;
    }
    #${m} .cg-btn.cg-active .cg-icon,
    #${m} .cg-view-btn.cg-active .cg-icon {
      opacity: 1;
    }
    #${m} .cg-view-btn:hover {
      background: rgba(255,255,255,0.7);
    }
    #${m} .cg-view-btn.cg-active {
      background: rgba(255,255,255,0.96);
      box-shadow: 0 2px 10px rgba(0,0,0,0.10);
    }
    #${m} .cg-btn {
      width: var(--cg-btn, 28px);
      height: var(--cg-btn, 28px);
      border: 1px solid rgba(15, 23, 42, .10);
      background: rgba(255, 255, 255, .86);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .12s ease, border-color .12s ease;
    }
    #${m} .cg-btn:hover {
      background: rgba(248, 250, 252, .96);
      border-color: rgba(15, 23, 42, .18);
    }
    #${m} .cg-btn.cg-active {
      border-color: rgba(37, 99, 235, .45);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, .14);
    }
    #${m} .cg-opacity {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      border: 1px solid rgba(15, 23, 42, .10);
      border-radius: 999px;
      background: rgba(255,255,255,.86);
      height: var(--cg-btn, 28px);
      /* Allow the opacity control to shrink a bit before we start hiding things. */
      flex: 0 1 auto;
      min-width: 0;
    }
    #${m} .cg-opacity input[type="range"] {
      width: var(--cg-slider, 70px);
      min-width: 56px;
      accent-color: #2563eb;
    }

    #${m} .cg-body {
      flex: 1 1 auto;
      min-height: 0;
    }
    #${m}.cg-minimized .cg-body {
      display: none;
    }
    #${m} iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }

    #${m} .cg-resizer {
      position: absolute;
      right: 4px;
      bottom: 4px;
      width: 18px;
      height: 18px;
      border-radius: 8px;
      cursor: nwse-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.12;
      transition: opacity .12s ease;
      z-index: 2;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(15, 23, 42, .10);
      pointer-events: auto;
    }
    #${m}:hover .cg-resizer {
      opacity: 0.55;
    }
    #${m} .cg-resizer:hover {
      opacity: 0.9;
    }
    #${m} .cg-resizer::before {
      content: '';
      width: 10px;
      height: 10px;
      border-right: 2px solid rgba(15, 23, 42, .35);
      border-bottom: 2px solid rgba(15, 23, 42, .35);
      border-radius: 1px;
      transform: translate(1px, 1px);
    }
    #${m}.cg-locked .cg-resizer,
    #${m}.cg-minimized .cg-resizer,
    #${m}.cg-through .cg-resizer {
      display: none;
    }

    /* Mini bar (when main toolbar hidden) */
    #${m} .cg-mini-bar {
      height: 30px;
      flex: 0 0 auto;
      display: none;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 0 10px;
      background: rgba(255,255,255,.90);
      border-bottom: 1px solid rgba(15, 23, 42, .08);
      cursor: grab;
    }
    #${m}.cg-locked .cg-mini-bar {
      cursor: default;
    }
    #${m}.cg-controls-hidden:not(.cg-tree-search-expanded) .cg-mini-bar {
      display: flex;
    }
    #${m}.cg-through .cg-mini-bar {
      display: none;
    }
    #${m} .cg-mini-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${m} .cg-mini-right {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    #${m} .cg-popover {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 10px;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, .12);
      background: rgba(255,255,255,.94);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 14px 34px rgba(0,0,0,.20);
      display: none;
      z-index: 4;
    }
    #${m}.cg-popover-open .cg-popover {
      display: block;
    }

    #${m} .cg-popover-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    #${m} .cg-popover-row + .cg-popover-row {
      margin-top: 10px;
    }
    #${m} .cg-popover-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 1 auto;
      min-width: 0;
    }
    #${m} .cg-popover-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 0 0 auto;
    }
    #${m} .cg-popover-label {
      font: 600 12px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: rgba(15, 23, 42, .86);
      white-space: nowrap;
    }
    #${m}.cg-through {
      pointer-events: none;
    }
    #${m}.cg-through .cg-peel {
      pointer-events: auto;
    }
    #${m}.cg-through .cg-popover {
      display: none !important;
    }
    #${m} .cg-peel {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      border: 1px solid rgba(15, 23, 42, .12);
      background: rgba(255, 255, 255, .92);
      box-shadow: 0 8px 22px rgba(0,0,0,.18);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }
    #${m}.cg-through .cg-peel {
      display: flex;
    }

  `.trim(),t||document.documentElement.appendChild(e)}function re(){return document.getElementById(m)}function N(t,e){t.style.left=`${e.x}px`,t.style.top=`${e.y}px`,t.style.width=`${e.width}px`,t.style.height=`${e.height}px`,t.style.setProperty("--cgAlpha",String(e.opacity)),t.classList.toggle("cg-minimized",!!e.minimized),t.classList.toggle("cg-locked",!!e.locked),t.classList.toggle("cg-through",!!e.clickThrough);let n=!!e.controlsHidden||!!e.locked||!!e.clickThrough;t.classList.toggle("cg-controls-hidden",n),t.querySelectorAll('[data-action="lock"]').forEach(r=>{r.classList.toggle("cg-active",!!e.locked)}),t.querySelectorAll('[data-action="through"]').forEach(r=>{r.classList.toggle("cg-active",!!e.clickThrough)}),t.querySelectorAll('[data-action="toggleToolbar"]').forEach(r=>{r.classList.toggle("cg-active",!n)}),t.querySelectorAll('input[data-action="opacity"]').forEach(r=>{let o=String(e.opacity);r.value!==o&&(r.value=o)});try{t.__cgAfterApplyState?.(e)}catch{}t.style.resize="none"}function q(t){let e=window.innerWidth,n=window.innerHeight,r=Z(t.width,280,Math.min(840,Math.floor(e*.92))),o=Z(t.height,240,Math.floor(n*.92)),a=Z(t.x,8,Math.max(8,e-r-8)),i=Z(t.y,8,Math.max(8,n-o-8));return{...t,x:a,y:i,width:r,height:o}}function Kt(t,e,n,r){if(!e)return;let o=!1,a=0,i=0,c=0,p=0,d=h=>h?h.closest("button")||h.closest("input")||h.closest("select")||h.closest("a"):!1;e.addEventListener("pointerdown",h=>{let S=n();S.locked||d(h.target)||(o=!0,e.setPointerCapture(h.pointerId),a=h.clientX,i=h.clientY,c=S.x,p=S.y,e.style.cursor="grabbing",h.preventDefault())}),e.addEventListener("pointermove",h=>{if(!o)return;let S=h.clientX-a,T=h.clientY-i,A=q({...n(),x:c+S,y:p+T});r(A),N(t,A)});let l=()=>{if(!o)return;o=!1,e.style.cursor="";let h=n();I({x:h.x,y:h.y})};e.addEventListener("pointerup",l),e.addEventListener("pointercancel",l)}function Fn(t,e,n){let r=!1;new ResizeObserver(()=>{let a=e();if(a.minimized||a.locked)return;let i=t.getBoundingClientRect(),c=Math.round(i.width),p=Math.round(i.height);if(!r&&(r=!0,Math.abs(c-a.width)<2&&Math.abs(p-a.height)<2)||Math.abs(c-a.width)<2&&Math.abs(p-a.height)<2)return;let d=q({...a,width:c,height:p});n(d),N(t,d),I({width:d.width,height:d.height,x:d.x,y:d.y})}).observe(t)}function qn(t,e,n){Un();let r=document.createElement("div");r.id=m,r.setAttribute("role","dialog"),r.setAttribute("aria-label","ChatGPT Graph Floating Panel"),r.dataset.cgCompact="0";let o=document.createElement("div");o.className="cg-header";let a=u=>chrome.runtime.getURL(`assets/${u}`);o.innerHTML=`
    <div class="cg-bar-left">
      <div class="cg-view-toggle" role="tablist" aria-label="View mode">
        <button class="cg-view-btn" data-action="view" data-mode="graph" title="Graph"><img class="cg-icon" src="${a("graph.svg")}" alt="Graph"></button>
        <button class="cg-view-btn" data-action="view" data-mode="tree" title="Tree"><img class="cg-icon" src="${a("tree.svg")}" alt="Tree"></button>
      </div>
      <button class="cg-btn" data-action="refresh" title="Refresh"><img class="cg-icon" src="${a("fresh.svg")}" alt="Refresh"></button>
      <button class="cg-btn cg-minimap-btn" data-action="minimap" title="Toggle minimap" style="display:none;"><img class="cg-icon" src="${a("minimap.svg")}" alt="Minimap"></button>
    </div>
    <div class="cg-bar-right">
      <button class="cg-btn cg-search" data-action="search" title="Search" aria-label="Search" style="display:none;"><img class="cg-icon" src="${a("search.svg")}" alt="Search"></button>
      <div class="cg-opacity" title="Opacity">
        <span style="font-size:12px; opacity:.85;">\u03B1</span>
        <input data-action="opacity" type="range" min="0.25" max="1" step="0.05" value="${t.opacity}">
      </div>
      <button class="cg-btn" data-action="controls" title="Controls"><img class="cg-icon" src="${a("setting.svg")}" alt="Controls"></button>
      <button class="cg-btn" data-action="hideToolbar" title="Hide toolbar"><img class="cg-icon" src="${a("down.svg")}" alt="Hide"></button>
      <button class="cg-btn" data-action="close" title="Close (Esc)"><img class="cg-icon" src="${a("close.svg")}" alt="Close"></button>
    </div>
  `.trim();let i=document.createElement("div");i.className="cg-mini-bar",i.innerHTML=`
    <div class="cg-mini-left">
      <button class="cg-btn cg-mini-search" data-action="search" title="Search" aria-label="Search" style="display:none;"><img class="cg-icon" src="${a("search.svg")}" alt="Search"></button>
    </div>
    <div class="cg-mini-right">
      <button class="cg-btn" data-action="showToolbar" title="Show toolbar" aria-label="Show toolbar"><img class="cg-icon" src="${a("control.svg")}" alt="Show"></button>
      <button class="cg-btn" data-action="close" title="Close"><img class="cg-icon" src="${a("close.svg")}" alt="Close"></button>
    </div>
  `.trim();let c=document.createElement("div");c.className="cg-body";let p=document.createElement("iframe");p.src=chrome.runtime.getURL("src/sidepanel/index.html?embedded=1"),p.loading="lazy",p.allow="clipboard-read; clipboard-write",c.appendChild(p);let d=document.createElement("button");d.className="cg-peel",d.title="Exit click-through (Alt+Shift+T)",d.innerHTML=`<img class="cg-icon" src="${a("transparency.svg")}" alt="Click-through">`;let l=document.createElement("div");l.className="cg-popover",l.innerHTML=`
    <div class="cg-popover-row">
      <div class="cg-popover-left">
        <span class="cg-popover-label">View</span>
        <div class="cg-view-toggle" role="tablist" aria-label="View mode">
          <button class="cg-view-btn" data-action="view" data-mode="graph" title="Graph"><img class="cg-icon" src="${a("graph.svg")}" alt="Graph"></button>
          <button class="cg-view-btn" data-action="view" data-mode="tree" title="Tree"><img class="cg-icon" src="${a("tree.svg")}" alt="Tree"></button>
        </div>
      </div>
      <div class="cg-popover-right">
        <button class="cg-btn" data-action="refresh" title="Refresh"><img class="cg-icon" src="${a("fresh.svg")}" alt="Refresh"></button>
        <button class="cg-btn" data-action="closePopover" title="Close"><img class="cg-icon" src="${a("close.svg")}" alt="Close"></button>
      </div>
    </div>
    <div class="cg-popover-row">
      <div class="cg-popover-left">
        <span class="cg-popover-label">Opacity</span>
        <div class="cg-opacity" title="Opacity">
          <span style="font-size:12px; opacity:.85;">\u03B1</span>
          <input data-action="opacity" type="range" min="0.25" max="1" step="0.05" value="${t.opacity}">
        </div>
      </div>
      <div class="cg-popover-right">
        <button class="cg-btn" data-action="toggleToolbar" title="Toggle toolbar"><img class="cg-icon" src="${a("control.svg")}" alt="Toolbar"></button>
      </div>
    </div>
    <div class="cg-popover-row">
      <div class="cg-popover-left">
        <span class="cg-popover-label">Window</span>
      </div>
      <div class="cg-popover-right">
        <button class="cg-btn" data-action="lock" title="Lock / Unlock (Alt+Shift+L)"><img class="cg-icon" src="${a("stick.svg")}" alt="Lock"></button>
        <button class="cg-btn" data-action="through" title="Click-through (Alt+Shift+T)"><img class="cg-icon" src="${a("transparency.svg")}" alt="Click-through"></button>
        <button class="cg-btn" data-action="minimize" title="Minimize / Restore"><img class="cg-icon" src="${a("minimize.svg")}" alt="Minimize"></button>
        <button class="cg-btn" data-action="close" title="Close (Esc)"><img class="cg-icon" src="${a("close.svg")}" alt="Close"></button>
      </div>
    </div>
  `.trim(),r.appendChild(o),r.appendChild(i),r.appendChild(c),r.appendChild(d);let h=document.createElement("div");h.className="cg-resizer",h.title="Resize",r.appendChild(h),r.appendChild(l);let S=()=>{r.classList.remove("cg-popover-open")},T=()=>{n().clickThrough||r.classList.add("cg-popover-open")},A=()=>{r.classList.contains("cg-popover-open")?S():T()},E=(u,g={})=>{try{if(!p.contentWindow)return;p.contentWindow.postMessage({type:u,payload:g},"*")}catch{}},C=o.querySelector('[data-action="search"]'),b=i.querySelector('[data-action="search"]'),f=o.querySelector('[data-action="minimap"]'),v="graph",w=!1,x=!1,_=0,Te=!1,Qt=14,Je=1,Qe=2,Ee=()=>{let u=r.querySelector(".cg-header");if(!u)return null;let g=u.querySelector(".cg-bar-left"),y=u.querySelector(".cg-bar-right");return{headerEl:u,left:g,right:y}},en=u=>{if(!u)return!1;let{headerEl:g,left:y,right:k}=u;if(g.scrollWidth-g.clientWidth>Je)return!0;if(y&&k){let ut=y.getBoundingClientRect();if(k.getBoundingClientRect().left-ut.right<Qe)return!0}return!1},tn=(u,g)=>{if(!g)return!1;let{headerEl:y,left:k,right:j}=g;if(y.scrollWidth-y.clientWidth>Je)return!1;if(k&&j){let gt=k.getBoundingClientRect();if(j.getBoundingClientRect().left-gt.right<Qe+Qt)return!1}return!0},et=u=>{r.dataset.cgCompact=String(u),_=u},nn=()=>{if(r.classList.contains("cg-controls-hidden")){et(0);return}let u=Ee();if(u){for(r.dataset.cgCompact=String(_),u.headerEl.offsetWidth;_<4;){let g=Ee();if(!en(g))break;et(_+1),g.headerEl.offsetWidth}for(;_>0;){let g=_-1;r.dataset.cgCompact=String(g);let y=Ee();if(!y){r.dataset.cgCompact=String(_);break}if(y.headerEl.offsetWidth,tn(g,y)){_=g;continue}r.dataset.cgCompact=String(_);break}}},se=()=>{Te||(Te=!0,requestAnimationFrame(()=>{Te=!1,nn()}))},tt=new ResizeObserver(()=>{se()});tt.observe(r);let xe=(u=n())=>{let g=!!u.controlsHidden||!!u.locked||!!u.clickThrough,y=v==="tree"&&!!w;C&&(C.style.display=!g&&y?"inline-flex":"none"),b&&(b.style.display=g&&y?"inline-flex":"none")},nt=()=>{f&&(f.style.display=v==="graph"?"inline-flex":"none",f.classList.toggle("cg-active",x))};r.__cgAfterApplyState=u=>{xe(u),se();let g=!!u.controlsHidden||!!u.locked||!!u.clickThrough;E("CG_CONTROLS_STATE",{hidden:g})};let rt=u=>{v=String(u||"graph"),r.querySelectorAll('[data-action="view"]').forEach(g=>{g.classList.toggle("cg-active",g.dataset.mode===v)}),r.classList.toggle("cg-tree-search-expanded",!w&&v==="tree"),xe(),nt(),se()};p.addEventListener("load",()=>{E("CG_REQUEST_VIEW_MODE",{}),E("CG_REQUEST_MINIMAP_STATE",{});let u=n(),g=!!u.controlsHidden||!!u.locked||!!u.clickThrough;E("CG_CONTROLS_STATE",{hidden:g})});let ot=u=>{if(u?.source!==p.contentWindow)return;let g=u.data;if(!(!g||typeof g!="object")){if(g.type==="CG_VIEW_MODE"&&g.payload?.mode){rt(String(g.payload.mode));return}if(g.type==="CG_TREE_TOOLBAR_STATE"&&(w=!!g.payload?.collapsed,r.classList.toggle("cg-tree-search-expanded",!w&&v==="tree"),xe(),se()),g.type==="CG_MINIMAP_STATE"&&(x=!!g.payload?.visible,nt()),g.type==="CG_SHOW_TOOLBAR"){let y=n();if(y.locked)T();else{let k={...y,controlsHidden:!1};e(k),N(r,k),I({controlsHidden:!1})}}g.type==="CG_CLOSE_PANEL"&&ve()}};r.__cgMsgHandler=ot,window.addEventListener("message",ot),r.querySelectorAll('[data-action="close"]').forEach(u=>{u.addEventListener("click",()=>ve())}),r.querySelectorAll('[data-action="minimize"]').forEach(u=>{u.addEventListener("click",()=>{S();let g={...n(),minimized:!n().minimized};e(g),N(r,g),I({minimized:g.minimized})})}),r.querySelectorAll('[data-action="lock"]').forEach(u=>{u.addEventListener("click",()=>{let g={...n(),locked:!n().locked};e(g),S(),N(r,g),I({locked:g.locked})})}),r.querySelectorAll('[data-action="through"]').forEach(u=>{u.addEventListener("click",()=>{let g={...n(),clickThrough:!n().clickThrough};e(g),S(),N(r,g),I({clickThrough:g.clickThrough})})}),d.addEventListener("click",()=>{let u={...n(),clickThrough:!1};e(u),N(r,u),I({clickThrough:!1})}),r.querySelectorAll('[data-action="opacity"]').forEach(u=>{u.addEventListener("input",g=>{let y=Z(Number(g.target.value),.25,1),k={...n(),opacity:y};e(k),N(r,k),I({opacity:y})})}),r.querySelectorAll('[data-action="refresh"]').forEach(u=>{u.addEventListener("click",()=>{S(),E("CG_REFRESH",{})})}),r.querySelectorAll('[data-action="minimap"]').forEach(u=>{u.addEventListener("click",g=>{g.stopPropagation(),E("CG_TOGGLE_MINIMAP",{})})}),r.querySelectorAll('[data-action="view"]').forEach(u=>{u.addEventListener("click",g=>{let y=u.dataset.mode;y&&(rt(y),E("CG_SET_VIEW_MODE",{mode:y}),g.stopPropagation())})}),o.querySelector('[data-action="controls"]')?.addEventListener("click",u=>{u.stopPropagation(),A()}),r.querySelectorAll('[data-action="closePopover"]').forEach(u=>{u.addEventListener("click",g=>{g.stopPropagation(),S()})}),o.querySelector('[data-action="hideToolbar"]')?.addEventListener("click",()=>{S();let u={...n(),controlsHidden:!0};e(u),N(r,u),I({controlsHidden:!0})}),r.querySelectorAll('[data-action="toggleToolbar"]').forEach(u=>{u.addEventListener("click",()=>{let g={...n(),controlsHidden:!n().controlsHidden};e(g),N(r,g),I({controlsHidden:g.controlsHidden})})});let rn=()=>{S(),E("CG_TREE_FOCUS_SEARCH",{})};r.querySelectorAll('[data-action="search"]').forEach(u=>{u.addEventListener("click",g=>{g.stopPropagation(),rn()})}),i.querySelector('[data-action="showToolbar"]')?.addEventListener("click",u=>{u.stopPropagation();let g=n();if(g.locked){T();return}let y={...g,controlsHidden:!1};e(y),N(r,y),I({controlsHidden:!1})});let ae=!1,st=0,at=0,it=0,ct=0,on=u=>{let g=n();if(g.locked||g.minimized||g.clickThrough)return;S(),ae=!0;let y=r.getBoundingClientRect();st=u.clientX,at=u.clientY,it=y.width,ct=y.height;try{h.setPointerCapture(u.pointerId)}catch{}u.preventDefault(),u.stopPropagation()},sn=u=>{if(!ae||u.buttons!==1)return;let g=u.clientX-st,y=u.clientY-at,k=n(),j=q({...k,width:Math.round(it+g),height:Math.round(ct+y)});e(j),N(r,j),u.preventDefault()},we=()=>{if(!ae)return;ae=!1;let u=n();I({width:u.width,height:u.height,x:u.x,y:u.y})};h.addEventListener("pointerdown",on),h.addEventListener("pointermove",sn),h.addEventListener("pointerup",we),h.addEventListener("pointercancel",we),h.addEventListener("lostpointercapture",we);let lt=u=>{if(!r.classList.contains("cg-popover-open")||l.contains(u.target))return;let g=o.querySelector('[data-action="controls"]');g&&g.contains(u.target)||S()};r.__cgDocPointerHandler=lt,document.addEventListener("pointerdown",lt,!0),Kt(r,o,n,e),Kt(r,i,n,e),Fn(r,n,e);let dt=u=>{u.key==="Escape"&&ve()};return r.__cgEscHandler=dt,window.addEventListener("keydown",dt,{capture:!0}),r.__cgPanelResizeObserver=tt,N(r,t),r.__cgGetState=n,r.__cgSetState=e,r}async function zn(){let t=re();if(t)return t;let e=q(await Ve()),o=qn(e,a=>{e=a},()=>e);return document.documentElement.appendChild(o),await I({...e}),s("info","FloatingPanel","Panel created"),o}function ve(){let t=re();if(t){try{t.__cgEscHandler&&window.removeEventListener("keydown",t.__cgEscHandler,{capture:!0}),t.__cgMsgHandler&&window.removeEventListener("message",t.__cgMsgHandler),t.__cgDocPointerHandler&&document.removeEventListener("pointerdown",t.__cgDocPointerHandler,!0),t.__cgPanelResizeObserver&&t.__cgPanelResizeObserver.disconnect()}catch{}t.remove(),s("info","FloatingPanel","Panel closed")}}async function We(){return re()?(ve(),!1):(await zn(),!0)}async function Ke(){let t=re();if(!t)return;let e=t.__cgGetState?t.__cgGetState():q(await Ve()),n=q({...e,clickThrough:!e.clickThrough});t.__cgSetState?.(n),n.clickThrough&&t.classList.remove("cg-popover-open"),N(t,n),await I({clickThrough:n.clickThrough})}async function je(){let t=re();if(!t)return;let e=t.__cgGetState?t.__cgGetState():q(await Ve()),n=q({...e,locked:!e.locked});t.__cgSetState?.(n),n.locked&&t.classList.remove("cg-popover-open"),N(t,n),await I({locked:n.locked})}var Ye=null,oe=null,jt="__chatgptGraphContentInitialized__";async function Ze(){try{let t=await chrome.storage.local.get(M.ASSISTANT_STREAM_SETTINGS);L.setAssistantStreamSettings({...R,...t[M.ASSISTANT_STREAM_SETTINGS]||{}})}catch(t){s("warn","Content","Failed to load assistant stream settings:",t),L.setAssistantStreamSettings(R)}}function Hn(){chrome.storage?.onChanged?.addListener((t,e)=>{e==="local"&&t[M.ASSISTANT_STREAM_SETTINGS]&&Ze()})}function Vn(){chrome.runtime.onMessage.addListener((t,e,n)=>{if(s("debug","Content","Received message:",t.type),t.type===G.SCROLL_TO_MESSAGE){let{messageId:r}=t.payload||{};return r?Wn(r).then(o=>{n({success:o})}).catch(o=>{s("error","Content","scrollToMessage error:",o),n({success:!1,error:o.message})}):n({success:!1,error:"No messageId provided"}),!0}if(t.type===G.TOGGLE_FLOATING_PANEL)return We().then(r=>n({success:!0,opened:r})).catch(r=>n({success:!1,error:r?.message||"Toggle failed"})),!0;if(t.type===G.REFRESH_DATA)return(async()=>{try{let r=t.payload?.conversationId||H();if(!r){n({success:!1,error:"No conversationId"});return}if(s("info","Content",`Manual refresh requested for conversation: ${r}`),!await Ne()||!Ie()){n({success:!1,error:"No valid token configured"});return}await ye(r),n({success:!0})}catch(r){s("error","Content","Manual refresh failed:",r),n({success:!1,error:r.message||"Refresh failed"})}})(),!0;if(t.type===G.UPDATE_FLOATING_PANEL_STATE){let r=t.payload?.action;if(r==="toggleClickThrough")return Ke().then(()=>n({success:!0})).catch(o=>n({success:!1,error:o?.message||String(o)})),!0;if(r==="toggleLock")return je().then(()=>n({success:!0})).catch(o=>n({success:!1,error:o?.message||String(o)})),!0}return t.type===G.ASSISTANT_STREAM_SETTINGS_CHANGED?((async()=>{await Ze();let r=H();r&&await ye(r)})().then(()=>n({success:!0})).catch(r=>n({success:!1,error:r?.message||String(r)})),!0):!1}),s("info","Content","Message listener set up for sidepanel commands")}function Yt(){let t=e=>{if(!e)return!1;let n=(e.tagName||"").toLowerCase();return n==="input"||n==="textarea"||e.isContentEditable};window.addEventListener("keydown",e=>{t(e.target)||!e.altKey||!e.shiftKey||(e.code==="KeyG"?(e.preventDefault(),We()):e.code==="KeyT"?(e.preventDefault(),Ke()):e.code==="KeyL"&&(e.preventDefault(),je()))},{capture:!0})}async function Wn(t){s("info","Content",`Scrolling to message: ${t.substring(0,16)}...`);let e=Zt(t);if(e){let r=await Xt(e);return r?s("info","Content","\u2713 Scrolled to message"):s("warn","Content","Scroll may not have reached exact position"),r}if(s("info","Content","Message not in current branch, attempting branch navigation..."),!L.isReady())return s("warn","Content","Conversation state not initialized, cannot navigate"),!1;let n=L.getNodes();if(!n||n.length===0)return s("warn","Content","No nodes available for navigation"),!1;try{let r=await Gt(t,n);if(r.success)if(await Y(300),e=Zt(t),e){let o=await Xt(e);return s("info","Content",o?"\u2713 Scrolled to message after branch navigation":"Scroll may not have reached exact position after branch navigation"),o}else return s("warn","Content","Message element still not found after navigation"),!1;else return s("warn","Content",`Branch navigation failed: ${r.message}`),!1}catch(r){return s("error","Content","Branch navigation error:",r),!1}}function Kn(t){let e=t.parentElement;for(;e;){let r=window.getComputedStyle(e).overflowY;if((r==="auto"||r==="scroll")&&e.scrollHeight>e.clientHeight)return e;e=e.parentElement}return document.documentElement}function jn(t){let e=t.getBoundingClientRect(),n=window.innerHeight,r=e.top+e.height/2,o=n*.25,a=n*.75;return r>=o&&r<=a}function Yn(t,e=1500){return new Promise(n=>{let r=t.scrollTop,o=0,a=3,i=Date.now(),c=()=>{let p=t.scrollTop;if(Math.abs(p-r)<1){if(o++,o>=a){n();return}}else o=0,r=p;if(Date.now()-i>e){n();return}requestAnimationFrame(c)};requestAnimationFrame(c)})}function Xn(t,e){return new Promise(n=>{let r=!1,o=()=>{r||(r=!0,a.disconnect(),n())},a=new MutationObserver(o);a.observe(t,{childList:!0,subtree:!0,attributes:!1}),setTimeout(o,e)})}async function Xt(t){let i=Kn(t);s("debug","Content",`[Scroll] Container: ${i.tagName}.${i.className.split(" ")[0]}, scrollHeight=${i.scrollHeight}, clientHeight=${i.clientHeight}`);let c=i.scrollTop,p=100,d=0;for(let l=0;l<10;l++){let h=t.getBoundingClientRect(),S=window.innerHeight,T=h.top+h.height/2;if(s("debug","Content",`[Scroll] Attempt ${l+1}: elementCenter=${Math.round(T)}, viewport=${S}, scrollTop=${Math.round(i.scrollTop)}`),jn(t))return s("debug","Content","[Scroll] Element in center zone, done!"),Jt(t),!0;s("debug","Content","[Scroll] Calling scrollIntoView..."),t.scrollIntoView({behavior:"smooth",block:"center"}),await Yn(i),s("debug","Content",`[Scroll] Scroll stopped at ${Math.round(i.scrollTop)}`),await Xn(i,p);let A=i.scrollTop,E=Math.abs(A-c);if(s("debug","Content",`[Scroll] Delta: ${Math.round(E)}px (last=${Math.round(c)}, current=${Math.round(A)})`),E<5){if(d++,p=Math.min(Math.round(p*1.5),1500),s("debug","Content",`[Scroll] Stuck (${d}/3), next wait: ${p}ms`),d>=3)return s("warn","Content","[Scroll] Stuck limit reached"),Jt(t),!1}else d=0,p=100;c=A}return s("warn","Content","[Scroll] Max attempts reached"),!1}function Zt(t){if(!t)return null;let e=window.CSS?.escape?window.CSS.escape(t):t.replace(/["\\]/g,"\\$&"),n=document.querySelector(`[data-message-id="${e}"]`);if(n)return n;let r=W(t);if(r)return n=r.querySelector(`[data-message-id="${e}"]`)||r.querySelector("[data-message-author-role][data-message-id]")||r.querySelector("[data-message-id]")||r,n;let o=5;if(t.length<o)return null;let a=$();for(let i of a){let c=O(i),p=i.getAttribute("data-turn-id"),d=l=>!l||l.length<o?!1:l.includes(t)||t.includes(l);if(d(c)){n=i.querySelector("[data-message-author-role][data-message-id]")||i.querySelector("[data-message-id]")||i;break}if(d(p)){n=i.querySelector("[data-message-author-role][data-message-id]")||i.querySelector("[data-message-id]")||i;break}}return n}function Jt(t){t.style.transition="outline 0.3s ease, outline-offset 0.3s ease",t.style.outline="3px solid #3b82f6",t.style.outlineOffset="2px",setTimeout(()=>{t.style.outline="3px solid transparent",setTimeout(()=>{t.style.removeProperty("outline"),t.style.removeProperty("outline-offset"),t.style.removeProperty("transition")},300)},1500)}async function Zn(){if(await ft(),s("info","Content","Content script loaded"),!chrome.runtime?.id){tr();return}vt(),await Ze(),Hn(),Vn(),Yt(),Yt(),Vt();try{await Ht()}catch(n){s("warn","Content","Failed to initialize collapse manager:",n)}if(!me()){s("debug","Content","Not a conversation page, skipping");return}let t=H();if(!t){s("error","Content","Failed to extract conversation ID");return}if(s("info","Content",`Conversation ID: ${t}`),await rr(),!await Ne()||!Ie()){s("error","Content","No valid token found"),nr();return}s("info","Content","Token loaded successfully"),await Y(_e.API_DELAY),await ye(t),Jn(),Qn()}function Jn(){s("info","Content","Starting URL observer for conversation switching"),Ye&&Ye.stop(),Ye=Mt(async(t,e)=>{s("info","Content",`Conversation switched: ${e} \u2192 ${t}`),L.clear(),oe&&oe.reset(),await Y(_e.API_DELAY),await ye(t)}),s("info","Content","URL observer started")}function Qn(){s("info","Content","Starting message observer for incremental updates"),oe&&oe.stop(),oe=Rt(async t=>{s("info","Content","New message detected",{id:t.id.substring(0,8)+"...",role:t.role}),await er(t)}),s("info","Content","Message observer started")}async function er(t){try{if(!L.isReady()){s("warn","Content","State not initialized, skipping incremental update");return}let e=L.addIncrementalNode(t);if(!e.changed){s("debug","Content","Node already exists or failed to add",e);return}let n=L.getIncrementalUpdate(e.nodeId);s("info","Content","Incremental update prepared",{nodeId:e.nodeId.substring(0,8)+"...",action:e.action,totalNodes:L.getStats().totalNodes});try{await Xe(G.CONVERSATION_INCREMENTAL_UPDATE,n),s("info","Content","\u2713 Incremental update sent to background")}catch(r){s("error","Content","Failed to send incremental update:",r.message)}sr(t,L.getStats())}catch(e){s("error","Content","Failed to handle incremental message:",e)}}function tr(){console.group("\u{1F332} ChatGPT Graph - Extension Reloaded"),console.warn("\u26A0\uFE0F Extension context invalidated"),console.groupEnd()}function nr(){console.group("\u{1F332} ChatGPT Graph - Setup Required"),console.error("\u274C Authentication token not configured"),console.groupEnd()}async function rr(){if(s("info","Content","Waiting for page ready..."),!await It("main",1e4))throw new Error("Page load timeout");s("info","Content","Page ready")}async function ye(t){try{s("info","Content","Fetching conversation data...");let e=await xt(t);if(!e||!e.mapping)throw new Error("Invalid conversation data");s("info","Content","Conversation data received",{title:e.title,mappingSize:Object.keys(e.mapping).length});let n=de(e.mapping,t),r=pe(n.nodes,{mode:L.assistantStreamSettings?.mode||R.mode,conversationId:t}),o=r.nodes,a=n.nodes.length>0?r.edges:n.edges,i=ue(o);s("info","Content","Parsed",{nodes:o.length,edges:a.length,...i});let c=Q(o),p=he(o),d=fe(o);s("info","Content","Branch analysis complete",{branches:c.length,rounds:p.length,branchPoints:d.branchPointsCount});let l={id:t,title:e.title,createTime:e.create_time,updateTime:e.update_time,mapping:e.mapping,nodes:o,edges:a,rounds:p,branches:c,analysis:d};L.initialize(l),s("info","Content","\u2713 Conversation state initialized");try{await Xe(G.CONVERSATION_LOADED,l),s("info","Content","\u2713 Conversation data sent to background")}catch(h){s("error","Content","Failed to send to background (extension may be reloading):",h.message)}or(l)}catch(e){s("error","Content","Failed to process conversation:",e);try{await Xe(G.ERROR,{message:e.message,stack:e.stack})}catch(n){s("warn","Content","Could not send error to background:",n.message)}}}async function Xe(t,e,n=3){if(!chrome.runtime?.id)throw s("error","Content","Extension context invalidated (extension may have been reloaded)"),new Error("Extension context invalidated. Please refresh the page.");for(let r=1;r<=n;r++)try{let o=await new Promise((a,i)=>{chrome.runtime.sendMessage({type:t,payload:e,timestamp:Date.now()},c=>{chrome.runtime.lastError?i(chrome.runtime.lastError):c&&c.error?i(new Error(c.error)):a(c)})});return s("debug","Content",`Message sent successfully on attempt ${r}`),o}catch(o){let a=r===n;if(o.message?.includes("Receiving end does not exist")){if(s("warn","Content",`Background connection failed (attempt ${r}/${n})`),a)throw s("error","Content","Background script not responding. Extension may need to be reloaded."),new Error("Background script not responding. Please reload the extension or refresh the page.");await Y(500*r);continue}else throw o}}function or(t){Ae()&&(console.group("\u{1F332} ChatGPT Graph - Conversation Data"),t.analysis.branchPoints.length>0&&t.analysis.branchPoints.forEach((e,n)=>{}),t.branches.length>0&&(t.branches.slice(0,3).forEach((e,n)=>{}),t.branches.length>3),console.groupEnd())}function sr(t,e){Ae()&&(console.group("\u{1F195} ChatGPT Graph - Incremental Update"),console.groupEnd())}globalThis[jt]?s("warn","Content","Content script already initialized, skipping duplicate bootstrap"):(globalThis[jt]=!0,Zn().catch(t=>{s("error","Content","Fatal error:",t)}));})();
