(() => {
  const MSG = {
    SUBMIT_PROMPT: "CG_SUBMIT_BRANCH_PROMPT",
    EDIT_USER_PROMPT: "CG_EDIT_USER_PROMPT",
    SCROLL: "SCROLL_TO_MESSAGE",
    REFRESH: "REFRESH_DATA",
  };
  const STORAGE = {
    ACTIVE: "cg_enhancer_active_message",
    DOM_CHANGED: "cg_enhancer_dom_changed",
    CHAT_HIDDEN: "cg_enhancer_chat_hidden",
  };

  const state = {
    data: null,
    nodes: [],
    byId: new Map(),
    parentById: new Map(),
    children: new Map(),
    roots: [],
    userChildren: new Map(),
    userRoots: [],
    activeId: null,
    activeContent: "",
    activeUserId: null,
    lastKnownActiveUserId: null,
    hoverTimer: null,
    popupPinned: false,
    sending: false,
    refreshTimer: null,
    chatHidden: false,
  };

  const text = (value) => (value || "").replace(/\s+/g, " ").trim();
  const compactText = (value) => text(value).replace(/\s/g, "");
  const shortId = (id) => (id ? id.slice(0, 8) : "unknown");
  const activeTab = () => new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs?.[0] || null)));

  async function sendToActiveTab(message) {
    const tab = await activeTab();
    if (!tab?.id) throw new Error("No active ChatGPT tab");
    const send = () => new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        const error = chrome.runtime.lastError;
        error ? reject(error) : resolve(response);
      });
    });
    try {
      return await send();
    } catch (error) {
      if (!String(error?.message || error).includes("Receiving end does not exist")) throw error;
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["dist/content.js", "dist/content-enhancer.js"],
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await send();
    }
  }

  function buildIndex(data) {
    state.data = data || window.__conversationData || null;
    state.nodes = Array.isArray(state.data?.nodes) ? state.data.nodes.slice() : [];
    state.nodes.sort((a, b) => (a.createTime || 0) - (b.createTime || 0) || String(a.id).localeCompare(String(b.id)));
    state.byId = new Map(state.nodes.map((node) => [node.id, node]));
    state.parentById = new Map();
    for (const node of state.nodes) {
      if (node.parent && state.byId.has(node.parent)) state.parentById.set(node.id, node.parent);
    }
    const edges = Array.isArray(state.data?.edges) ? state.data.edges.slice() : [];
    edges
      .sort((a, b) => (a.orderKey || 0) - (b.orderKey || 0))
      .forEach((edge) => {
        if (edge?.source && edge?.target && state.byId.has(edge.source) && state.byId.has(edge.target)) {
          state.parentById.set(edge.target, edge.source);
        }
      });
    state.children = new Map();
    for (const node of state.nodes) {
      const parent = parentOf(node.id);
      if (!parent) continue;
      if (!state.children.has(parent)) state.children.set(parent, []);
      state.children.get(parent).push(node.id);
    }
    state.roots = state.nodes.filter((node) => !parentOf(node.id)).map((node) => node.id);
    state.userChildren = new Map();
    state.userRoots = [];
    for (const node of state.nodes) {
      if (node.role !== "user") continue;
      const parentUser = nearestAncestorUserId(parentOf(node.id));
      if (parentUser) {
        if (!state.userChildren.has(parentUser)) state.userChildren.set(parentUser, []);
        state.userChildren.get(parentUser).push(node.id);
      } else {
        state.userRoots.push(node.id);
      }
    }
    for (const childIds of state.userChildren.values()) {
      childIds.sort((a, b) => (state.byId.get(a)?.createTime || 0) - (state.byId.get(b)?.createTime || 0));
    }
    state.userRoots.sort((a, b) => (state.byId.get(a)?.createTime || 0) - (state.byId.get(b)?.createTime || 0));
  }

  function parentOf(id) {
    return state.parentById.get(id) || null;
  }

  function nearestAncestorUserId(id) {
    let current = id;
    const seen = new Set();
    while (current && state.byId.has(current) && !seen.has(current)) {
      seen.add(current);
      const node = state.byId.get(current);
      if (node?.role === "user") return node.id;
      current = parentOf(current);
    }
    return null;
  }

  function userFocusId(id) {
    const node = state.byId.get(id);
    if (!node) return null;
    return node.role === "user" ? node.id : nearestAncestorUserId(parentOf(id));
  }

  function matchUserByContent(content) {
    const target = compactText(content);
    if (!target || target.length < 2) return null;
    let best = null;
    let bestScore = 0;
    for (const node of state.nodes) {
      if (node.role !== "user") continue;
      const candidate = compactText(node.content);
      if (!candidate) continue;
      let score = 0;
      if (candidate === target) score = 1000;
      else if (candidate.includes(target) || target.includes(candidate)) score = Math.min(candidate.length, target.length);
      else {
        const shortTarget = target.slice(0, 80);
        const shortCandidate = candidate.slice(0, 80);
        if (shortTarget && shortCandidate && (shortCandidate.includes(shortTarget) || shortTarget.includes(shortCandidate))) {
          score = Math.min(shortCandidate.length, shortTarget.length);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = node.id;
      }
    }
    return bestScore >= 6 ? best : null;
  }

  function resolveActiveUserId(active = null) {
    const id = active?.id || state.activeId;
    const content = active?.content || state.activeContent;
    if (active?.content) state.activeContent = active.content;
    if (active?.role === "user" && state.byId.has(id)) return id;
    return userFocusId(id) || matchUserByContent(content);
  }

  function ensureShell() {
    let main = document.querySelector(".main-content");
    if (!main) return null;
    document.documentElement.classList.add("cgx-enhancer-active");
    main.classList.add("cgx-hidden-original");
    main.style.position = main.style.position || "relative";
    let shell = main.querySelector(".cgx-shell");
    if (shell) return shell;
    shell = document.createElement("section");
    shell.className = "cgx-shell";
    shell.innerHTML = `
      <div class="cgx-map"><div class="cgx-tree"></div></div>
      <aside class="cgx-chat">
        <div class="cgx-chat-head">
          <div>
            <div class="cgx-title">聊天查看</div>
            <div class="cgx-meta">跟随网页当前聚焦提示词；点击小圆只跳转</div>
          </div>
          <div class="cgx-head-actions">
            <button class="refresh-btn cgx-toggle-chat" title="隐藏聊天板块">▾</button>
            <button class="refresh-btn cgx-refresh" title="刷新">↻</button>
          </div>
        </div>
        <div class="cgx-viewer">
          <div class="cgx-card"><div class="cgx-card-label">网页聚焦提示词</div><div class="cgx-card-content" data-role="current"></div></div>
          <div class="cgx-card"><div class="cgx-card-label">下级提示词</div><div class="cgx-card-content" data-role="selected"></div></div>
        </div>
        <div class="cgx-compose">
          <textarea class="cgx-input" placeholder="输入新的提示词内容，用于改写当前Q或下级Q并生成新分支"></textarea>
          <div class="cgx-send-stack">
            <button class="cgx-send" data-target="current">改当前Q</button>
            <button class="cgx-send" data-target="child">改下级Q</button>
          </div>
        </div>
      </aside>
      <div class="cgx-popup" hidden></div>
    `;
    main.appendChild(shell);
    applyChatHidden(shell);
    shell.querySelector(".cgx-toggle-chat").addEventListener("click", toggleChatPanel);
    shell.querySelector(".cgx-refresh").addEventListener("click", refresh);
    shell.querySelectorAll(".cgx-send").forEach((button) => {
      button.addEventListener("click", () => submitPrompt(button.dataset.target));
    });
    shell.querySelector(".cgx-input").addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submitPrompt("current");
    });
    return shell;
  }

  function applyChatHidden(shell = ensureShell()) {
    if (!shell) return;
    shell.classList.toggle("cgx-chat-hidden", !!state.chatHidden);
    const button = shell.querySelector(".cgx-toggle-chat");
    if (button) {
      button.textContent = state.chatHidden ? "▴" : "▾";
      button.title = state.chatHidden ? "显示聊天板块" : "隐藏聊天板块";
    }
  }

  function toggleChatPanel() {
    state.chatHidden = !state.chatHidden;
    applyChatHidden();
    try {
      chrome.storage.local.set({ [STORAGE.CHAT_HIDDEN]: state.chatHidden });
    } catch {}
  }

  function nodeContent(node) {
    if (!node) return "";
    return (node.content || "").trim() || "(空内容)";
  }

  function showPopup(node, target, pinned = false) {
    const shell = ensureShell();
    if (!shell || !node) return;
    const popup = shell.querySelector(".cgx-popup");
    const rect = target.getBoundingClientRect();
    popup.innerHTML = `
      <div class="cgx-popup-head">
        <span>${node.role === "user" ? "用户提示词" : node.role === "assistant" ? "系统回答" : node.role} · ${shortId(node.id)}</span>
        <span>${pinned ? "点击空白关闭" : "悬停预览"}</span>
      </div>
      <div class="cgx-popup-body"></div>
    `;
    popup.querySelector(".cgx-popup-body").textContent = nodeContent(node);
    popup.hidden = false;
    const left = Math.min(Math.max(12, rect.left + 14), window.innerWidth - 372);
    const top = Math.min(Math.max(12, rect.bottom + 8), window.innerHeight - 280);
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    state.popupPinned = pinned;
  }

  function hidePopup(force = false) {
    if (state.popupPinned && !force) return;
    const popup = document.querySelector(".cgx-popup");
    if (popup) popup.hidden = true;
    state.popupPinned = false;
  }

  function answerChildrenForUser(userId) {
    return (state.children.get(userId) || [])
      .map((id) => state.byId.get(id))
      .filter((node) => node?.role === "assistant");
  }

  function preferredSendTarget(userId) {
    const answers = answerChildrenForUser(userId);
    if (!answers.length) return userId;
    return answers[answers.length - 1].id;
  }

  function promptWithAnswer(userId) {
    const node = state.byId.get(userId);
    if (!node) return "";
    const answers = answerChildrenForUser(userId);
    const answerText = answers.map((answer, index) => `回答 ${index + 1}:\n${nodeContent(answer)}`).join("\n\n");
    return `[Q] ${shortId(node.id)}\n\n${nodeContent(node)}${answerText ? `\n\n${answerText}` : "\n\n暂无回答"}`;
  }

  function childPromptFor(userId) {
    const children = state.userChildren.get(userId) || [];
    return children[0] || null;
  }

  function renderNode(id) {
    const node = state.byId.get(id);
    if (!node || node.role !== "user") return document.createTextNode("");
    const wrap = document.createElement("div");
    wrap.className = "cgx-node-wrap";
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `cgx-dot user${id === state.activeUserId ? " cgx-active" : ""}`;
    dot.title = `用户提示词 ${shortId(id)}`;
    dot.addEventListener("mouseenter", () => {
      clearTimeout(state.hoverTimer);
      state.hoverTimer = setTimeout(() => showPopup(node, dot), 1000);
    });
    dot.addEventListener("mouseleave", () => {
      clearTimeout(state.hoverTimer);
      hidePopup();
    });
    dot.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        await chrome.runtime.sendMessage({ type: MSG.SCROLL, payload: { messageId: id } });
      } catch {}
    });
    wrap.appendChild(dot);
    const childIds = state.userChildren.get(id) || [];
    if (childIds.length) {
      const children = document.createElement("div");
      children.className = `cgx-children ${childIds.length === 1 ? "cgx-children-single" : "cgx-children-multi"}`;
      childIds.forEach((childId) => children.appendChild(renderNode(childId)));
      wrap.appendChild(children);
    }
    return wrap;
  }

  function renderViewer() {
    const shell = ensureShell();
    if (!shell) return;
    const activeUser = state.activeUserId || userFocusId(state.activeId);
    const baseUser = activeUser;
    const childUser = childPromptFor(baseUser);
    const currentEl = shell.querySelector('[data-role="current"]');
    const selectedEl = shell.querySelector('[data-role="selected"]');
    currentEl.textContent = activeUser ? promptWithAnswer(activeUser) : "等待网页聚焦到某个提示词。";
    selectedEl.textContent = childUser ? promptWithAnswer(childUser) : "当前聚焦提示词没有下级提示词。";
    shell.querySelectorAll(".cgx-send").forEach((button) => {
      const targetId = button.dataset.target === "child" ? childUser : baseUser;
      const hasTarget = !!targetId;
      button.disabled = state.sending || !hasTarget;
      button.title = hasTarget
        ? button.dataset.target === "child"
          ? `编辑下级提示词 ${shortId(childUser)} 并生成新分支`
          : `编辑当前提示词 ${shortId(baseUser)} 并生成新分支`
        : "暂无可发送目标";
    });
  }

  function render() {
    const shell = ensureShell();
    if (!shell) return;
    const tree = shell.querySelector(".cgx-tree");
    buildIndex(window.__conversationData);
    const nextActiveUserId = resolveActiveUserId();
    if (nextActiveUserId) {
      state.activeUserId = nextActiveUserId;
      state.lastKnownActiveUserId = nextActiveUserId;
    } else if (!state.nodes.length && !state.activeUserId && state.lastKnownActiveUserId && state.byId.has(state.lastKnownActiveUserId)) {
      state.activeUserId = state.lastKnownActiveUserId;
    } else if (state.nodes.length) {
      state.activeUserId = null;
    }
    const focus = state.activeUserId;
    tree.innerHTML = "";
    const level = document.createElement("div");
    level.className = "cgx-level";
    if (state.userRoots.length === 0) {
      level.textContent = "暂无树状数据，等待插件读取当前对话。";
    } else {
      state.userRoots.forEach((id) => level.appendChild(renderNode(id)));
    }
    tree.appendChild(level);
    renderViewer();
    if (focus) {
      requestAnimationFrame(() => {
        const activeDot = tree.querySelector(".cgx-dot.cgx-active");
        activeDot?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      });
    }
  }

  async function refresh() {
    try {
      const id = window.__conversationData?.id;
      await sendToActiveTab({ type: MSG.REFRESH, payload: { conversationId: id } });
    } catch {}
    setTimeout(render, 900);
  }

  function scheduleRefresh(delay = 1600) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => {
      refresh();
    }, delay);
  }

  async function submitPrompt(targetKind = "active") {
    const shell = ensureShell();
    if (!shell || state.sending) return;
    const input = shell.querySelector(".cgx-input");
    const buttons = Array.from(shell.querySelectorAll(".cgx-send"));
    const prompt = input.value.trim();
    if (!prompt) return;
    const baseUser = state.activeUserId;
    const targetUserId = targetKind === "child" ? childPromptFor(baseUser) : baseUser;
    if (!targetUserId) return;
    state.sending = true;
    buttons.forEach((button) => {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "发送中";
    });
    try {
      if (targetUserId) {
        await chrome.runtime.sendMessage({ type: MSG.SCROLL, payload: { messageId: targetUserId } });
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      const response = await sendToActiveTab({ type: MSG.EDIT_USER_PROMPT, payload: { prompt, targetMessageId: targetUserId } });
      if (!response?.success) throw new Error(response?.error || "提交失败");
      input.value = "";
      setTimeout(refresh, 1600);
    } catch (error) {
      input.value = `${prompt}\n\n[插件提交失败：${error?.message || String(error)}]`;
    } finally {
      state.sending = false;
      buttons.forEach((button) => {
        button.disabled = false;
        button.textContent = button.dataset.originalText || "发送";
      });
      renderViewer();
    }
  }

  function setupRuntime() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "UPDATE_NOTIFICATION" || message?.type === "DATA_READY") {
        setTimeout(render, 350);
        if (message?.type === "UPDATE_NOTIFICATION") scheduleRefresh(1800);
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      const active = changes[STORAGE.ACTIVE]?.newValue;
      if (active?.id) {
        state.activeId = active.id;
        state.activeContent = active.content || "";
        const nextActiveUserId = resolveActiveUserId(active);
        if (nextActiveUserId) {
          state.activeUserId = nextActiveUserId;
          state.lastKnownActiveUserId = nextActiveUserId;
        } else if (state.nodes.length) {
          state.activeUserId = null;
        }
        render();
      }
      if (changes[STORAGE.DOM_CHANGED]) {
        setTimeout(render, 350);
        scheduleRefresh(2200);
      }
    });
    chrome.storage.local.get([STORAGE.ACTIVE]).then((stored) => {
      if (stored?.[STORAGE.ACTIVE]?.id) {
        state.activeId = stored[STORAGE.ACTIVE].id;
        state.activeContent = stored[STORAGE.ACTIVE].content || "";
        const nextActiveUserId = resolveActiveUserId(stored[STORAGE.ACTIVE]);
        if (nextActiveUserId) {
          state.activeUserId = nextActiveUserId;
          state.lastKnownActiveUserId = nextActiveUserId;
        } else if (state.nodes.length) {
          state.activeUserId = null;
        }
        render();
      }
    }).catch(() => {});
    chrome.storage.local.get([STORAGE.CHAT_HIDDEN]).then((stored) => {
      state.chatHidden = !!stored?.[STORAGE.CHAT_HIDDEN];
      applyChatHidden();
    }).catch(() => {});
  }

  function boot() {
    ensureShell();
    setupRuntime();
    const root = document.getElementById("root") || document.body;
    new MutationObserver(() => {
      if (!document.querySelector(".main-content .cgx-shell")) {
        ensureShell();
        render();
      } else {
        document.querySelector(".main-content")?.classList.add("cgx-hidden-original");
      }
    }).observe(root, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      if (!event.target.closest?.(".cgx-popup") && !event.target.closest?.(".cgx-dot")) hidePopup(true);
    });
    let lastSignature = "";
    setInterval(() => {
      const data = window.__conversationData;
      const signature = `${data?.id || ""}:${data?.updatedAt || ""}:${data?.nodes?.length || 0}`;
      if (signature !== lastSignature) {
        lastSignature = signature;
        render();
      }
    }, 700);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
