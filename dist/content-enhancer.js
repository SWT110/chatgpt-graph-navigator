(() => {
  const MSG = {
    GET_FOCUS: "CG_GET_ACTIVE_MESSAGE",
    SUBMIT_PROMPT: "CG_SUBMIT_BRANCH_PROMPT",
    EDIT_USER_PROMPT: "CG_EDIT_USER_PROMPT",
  };
  const STORAGE = {
    ACTIVE: "cg_enhancer_active_message",
    DOM_CHANGED: "cg_enhancer_dom_changed",
  };

  const SELECTORS = {
    turns: 'section[data-turn-id], article',
    message: '[data-message-author-role][data-message-id], [data-message-id]',
    composer:
      '#prompt-textarea, div[contenteditable="true"][data-virtualkeyboard], div[contenteditable="true"][aria-label], textarea',
    send:
      'button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="发送"]',
    editButton:
      'button[aria-label*="Edit"], button[aria-label*="编辑"], button[title*="Edit"], button[title*="编辑"], button[data-testid*="edit"]',
    saveEdit:
      'button[aria-label*="Send"], button[aria-label*="Submit"], button[aria-label*="Save"], button[aria-label*="发送"], button[aria-label*="提交"], button[aria-label*="保存"], button[data-testid*="send"], button[data-testid*="submit"]',
  };

  let active = null;
  let lastSent = "";
  let scanTimer = null;
  let mutationTimer = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isChatPage = () => /\/c\/[0-9a-f-]+/i.test(location.pathname);
  const conversationId = () => location.pathname.match(/\/c\/([0-9a-f-]+)/i)?.[1] || null;

  function turnId(el) {
    if (!el) return null;
    if (el.hasAttribute("data-message-id")) return el.getAttribute("data-message-id");
    const message = el.querySelector?.(SELECTORS.message);
    if (message?.getAttribute("data-message-id")) return message.getAttribute("data-message-id");
    const rawTurn = el.getAttribute?.("data-turn-id");
    return rawTurn && !rawTurn.includes("placeholder") ? rawTurn : null;
  }

  function roleFor(el) {
    return (
      el?.querySelector?.("[data-message-author-role]")?.getAttribute("data-message-author-role") ||
      el?.getAttribute?.("data-turn") ||
      null
    );
  }

  function textFor(el) {
    const preferred =
      el?.querySelector?.(".markdown") ||
      el?.querySelector?.(".whitespace-pre-wrap") ||
      el?.querySelector?.("[data-message-author-role] > div");
    const text = (preferred?.innerText || el?.innerText || "").trim();
    return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  }

  function centerScore(el) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return Infinity;
    const center = rect.top + rect.height / 2;
    const composer = findComposer();
    const composerTop = composer?.getBoundingClientRect?.().top || innerHeight;
    const readableBottom = Math.min(composerTop - 24, innerHeight - 64);
    const target = Math.max(120, readableBottom * 0.45);
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(readableBottom, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityPenalty = visibleHeight < Math.min(36, rect.height * 0.35) ? 1000 : 0;
    return Math.abs(center - target) + visibilityPenalty;
  }

  function visibleTurnItems() {
    return Array.from(document.querySelectorAll(SELECTORS.turns))
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        return { el, id: turnId(el), role: roleFor(el), rect, index };
      })
      .filter((item) => {
        if (!item.id) return false;
        const style = getComputedStyle(item.el);
        return item.rect.width > 0 && item.rect.height > 0 && item.rect.bottom > 0 && item.rect.top < innerHeight && style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function activeUserTurn() {
    const items = visibleTurnItems();
    const users = items.filter((item) => item.role === "user");
    if (!users.length) return null;
    const composer = findComposer();
    const composerTop = composer?.getBoundingClientRect?.().top || innerHeight;
    const usableBottom = Math.min(composerTop - 24, innerHeight - 64);
    const candidates = users
      .filter((item) => item.rect.top < usableBottom && item.rect.bottom > 48)
      .sort((a, b) => centerScore(a.el) - centerScore(b.el));
    return candidates[0] || users.sort((a, b) => centerScore(a.el) - centerScore(b.el))[0] || null;
  }

  function findActive() {
    if (!isChatPage()) return null;
    const best = activeUserTurn();
    if (!best) return null;
    return {
      id: best.id,
      messageId: best.id,
      role: "user",
      content: textFor(best.el),
      conversationId: conversationId(),
      url: location.href,
      timestamp: Date.now(),
    };
  }

  function notifyActive(next) {
    if (!next?.id) return;
    const key = `${next.conversationId}:${next.id}`;
    active = next;
    if (key === lastSent) return;
    lastSent = key;
    try {
      chrome.storage.local.set({ [STORAGE.ACTIVE]: next });
    } catch {}
  }

  function scheduleScan(delay = 80) {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => notifyActive(findActive()), delay);
  }

  function notifyDomChanged() {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      try {
        chrome.storage.local.set({
          [STORAGE.DOM_CHANGED]: { conversationId: conversationId(), timestamp: Date.now() },
        });
      } catch {}
      scheduleScan(50);
    }, 700);
  }

  function setComposerValue(el, value) {
    el.focus();
    if (el.tagName === "TEXTAREA") {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter ? setter.call(el, value) : (el.value = value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, value);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
  }

  function findComposer() {
    const candidates = Array.from(document.querySelectorAll(SELECTORS.composer));
    return candidates.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 10 && getComputedStyle(el).visibility !== "hidden";
    });
  }

  function findSendButton() {
    const buttons = Array.from(document.querySelectorAll(SELECTORS.send));
    return buttons.find((button) => !button.disabled && button.getAttribute("aria-disabled") !== "true");
  }

  async function scrollTurnIntoView(turn) {
    turn.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(700);
    turn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: innerWidth / 2, clientY: innerHeight / 2 }));
    turn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, clientX: innerWidth / 2, clientY: innerHeight / 2 }));
    await sleep(250);
  }

  function isEnabledButton(button) {
    return !!button && !button.disabled && button.getAttribute("aria-disabled") !== "true";
  }

  function findEditButtonForTurn(turn) {
    const scopes = [turn, turn.parentElement, turn.closest("article"), turn.closest("section")].filter(Boolean);
    for (const scope of scopes) {
      const direct = Array.from(scope.querySelectorAll(SELECTORS.editButton)).find(isEnabledButton);
      if (direct) return direct;
    }
    const buttons = Array.from(document.querySelectorAll("button")).filter(isEnabledButton);
    const rect = turn.getBoundingClientRect();
    return buttons.find((button) => {
      const label = `${button.getAttribute("aria-label") || ""} ${button.getAttribute("title") || ""} ${button.textContent || ""}`;
      if (!/edit|编辑/i.test(label)) return false;
      const b = button.getBoundingClientRect();
      return Math.abs((b.top + b.bottom) / 2 - (rect.top + rect.bottom) / 2) < Math.max(90, rect.height);
    }) || null;
  }

  function editableInTurn(turn) {
    const local = turn.querySelector('textarea, div[contenteditable="true"], [role="textbox"]');
    if (local) return local;
    return document.querySelector('textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="true"]');
  }

  function findSaveEditButton(turn) {
    const scopes = [turn, turn.parentElement, turn.closest("article"), turn.closest("section")].filter(Boolean);
    for (const scope of scopes) {
      const buttons = Array.from(scope.querySelectorAll("button")).filter(isEnabledButton);
      const submit = buttons.find((button) => {
        const label = `${button.getAttribute("aria-label") || ""} ${button.getAttribute("title") || ""} ${button.textContent || ""}`;
        return /send|submit|save|发送|提交|保存/i.test(label) && !/cancel|取消/i.test(label);
      });
      if (submit) return submit;
    }
    return null;
  }

  async function editUserPrompt(targetMessageId, prompt) {
    if (!targetMessageId) return { success: false, error: "No target prompt selected" };
    if (!prompt?.trim()) return { success: false, error: "Prompt is empty" };
    const turn = findTurnById(targetMessageId);
    if (!turn) return { success: false, error: `没有在当前网页分支找到目标提示词 ${String(targetMessageId).slice(0, 8)}` };
    if (roleFor(turn) !== "user") return { success: false, error: "目标不是用户提示词，不能编辑成新分支" };
    await scrollTurnIntoView(turn);
    const editButton = findEditButtonForTurn(turn);
    if (!editButton) return { success: false, error: "没有找到该提示词的编辑按钮。请把鼠标移到该提示词附近，确认 ChatGPT 显示编辑入口后重试。" };
    editButton.click();
    await sleep(450);
    const editor = editableInTurn(turn);
    if (!editor) return { success: false, error: "打开编辑后没有找到输入框" };
    setComposerValue(editor, prompt.trim());
    await sleep(250);
    const saveButton = findSaveEditButton(turn);
    if (!saveButton) return { success: false, error: "没有找到编辑提交按钮" };
    saveButton.click();
    notifyDomChanged();
    return { success: true, mode: "edit", targetMessageId };
  }

  function messageIdMatches(a, b) {
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
  }

  function findTurnById(id) {
    if (!id) return null;
    const turns = Array.from(document.querySelectorAll(SELECTORS.turns));
    return turns.find((turn) => messageIdMatches(turnId(turn), id)) || null;
  }

  function visibleTurns() {
    return Array.from(document.querySelectorAll(SELECTORS.turns)).filter((turn) => {
      const id = turnId(turn);
      if (!id) return false;
      const rect = turn.getBoundingClientRect();
      const style = getComputedStyle(turn);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function lastConversationTurnBeforeComposer() {
    const composer = findComposer();
    const composerTop = composer ? composer.getBoundingClientRect().top : Infinity;
    const candidates = visibleTurns().filter((turn) => turn.getBoundingClientRect().top < composerTop - 8);
    return candidates[candidates.length - 1] || null;
  }

  async function waitForTargetAsLeaf(targetId, timeoutMs = 2500) {
    if (!targetId) return { ok: true };
    const start = Date.now();
    let lastTarget = null;
    let lastLeaf = null;
    while (Date.now() - start < timeoutMs) {
      const target = findTurnById(targetId);
      const leaf = lastConversationTurnBeforeComposer();
      lastTarget = target ? turnId(target) : null;
      lastLeaf = leaf ? turnId(leaf) : null;
      if (target && leaf && messageIdMatches(lastLeaf, targetId)) return { ok: true, targetId: lastTarget, leafId: lastLeaf };
      await sleep(120);
    }
    return {
      ok: false,
      targetId: lastTarget,
      leafId: lastLeaf,
      error: lastTarget
        ? `目标 ${lastTarget.slice(0, 8)} 不是当前分支末端，已阻止误发到底部。请先切到该节点所在的末端分支，或选择更靠后的提示词。`
        : `当前网页没有找到目标消息 ${String(targetId).slice(0, 8)}，已阻止发送。`,
    };
  }

  async function submitPrompt(prompt, targetMessageId) {
    if (!prompt?.trim()) return { success: false, error: "Prompt is empty" };
    const targetCheck = await waitForTargetAsLeaf(targetMessageId);
    if (!targetCheck.ok) return { success: false, error: targetCheck.error, targetCheck };
    const composer = findComposer();
    if (!composer) return { success: false, error: "ChatGPT composer not found" };
    setComposerValue(composer, prompt.trim());
    for (let i = 0; i < 20; i += 1) {
      const button = findSendButton();
      if (button) {
        button.click();
        notifyDomChanged();
        return { success: true };
      }
      await sleep(100);
    }
    composer.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    notifyDomChanged();
    return { success: true, fallback: "enter" };
  }

  function setupMessages() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === MSG.GET_FOCUS) {
        const current = findActive() || active;
        sendResponse({ success: true, data: current });
        return false;
      }
      if (message?.type === MSG.SUBMIT_PROMPT) {
        submitPrompt(message.payload?.prompt, message.payload?.parentMessageId)
          .then(sendResponse)
          .catch((error) => sendResponse({ success: false, error: error?.message || String(error) }));
        return true;
      }
      if (message?.type === MSG.EDIT_USER_PROMPT) {
        editUserPrompt(message.payload?.targetMessageId, message.payload?.prompt)
          .then(sendResponse)
          .catch((error) => sendResponse({ success: false, error: error?.message || String(error) }));
        return true;
      }
      return false;
    });
  }

  function setupObservers() {
    addEventListener("scroll", () => scheduleScan(), { passive: true, capture: true });
    addEventListener("resize", () => scheduleScan(120), { passive: true });
    const root = document.querySelector("main") || document.body;
    if (root) {
      root.addEventListener("scroll", () => scheduleScan(), { passive: true, capture: true });
      new MutationObserver(notifyDomChanged).observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    document.querySelectorAll("main, [class*=scroll], [class*=overflow], [data-radix-scroll-area-viewport]").forEach((el) => {
      el.addEventListener("scroll", () => scheduleScan(), { passive: true });
    });
    setInterval(() => scheduleScan(0), 1500);
    scheduleScan(500);
  }

  if (!globalThis.__chatgptGraphEnhancerInitialized) {
    globalThis.__chatgptGraphEnhancerInitialized = true;
    setupMessages();
    setupObservers();
  }
})();
