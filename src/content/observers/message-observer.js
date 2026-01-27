/**
 * 消息 DOM 观察器
 * 使用 MutationObserver 监听新消息的添加
 */

import { log } from '../../shared/utils.js';
import { extractMessageFromDOM } from '../extractors/message-extractor.js';

/**
 * 消息观察器类
 */
export class MessageObserver {
  constructor() {
    this.observer = null;
    this.callback = null;
    this.isRunning = false;
    this.processedMessages = new Set(); // 防止重复处理
    this.pendingMessages = new Map();   // 等待完成的消息
  }

  /**
   * 启动观察器
   * @param {Function} callback - 检测到新消息时的回调 (messageData) => void
   */
  start(callback) {
    if (this.isRunning) {
      log('warn', 'MessageObserver', 'Observer already running');
      return;
    }

    this.callback = callback;
    this.isRunning = true;

    // 记录当前已存在的消息
    const existingMessages = document.querySelectorAll('article[data-turn-id]');
    existingMessages.forEach(article => {
      const turnId = article.getAttribute('data-turn-id');
      if (turnId) {
        this.processedMessages.add(turnId);
      }
    });

    log('info', 'MessageObserver', `Starting message observer`, {
      existingMessages: this.processedMessages.size
    });

    // 创建 MutationObserver
    const targetNode = document.querySelector('main');
    if (!targetNode) {
      log('error', 'MessageObserver', 'Main element not found');
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      this._handleMutations(mutations);
    });

    // 观察配置
    const config = {
      childList: true,       // 监听子节点变化
      subtree: true,         // 监听所有后代节点
      attributes: false,     // 不监听属性变化
      characterData: false   // 不监听文本内容变化
    };

    this.observer.observe(targetNode, config);
    log('info', 'MessageObserver', 'Message observer started');
  }

  /**
   * 停止观察器
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 清除等待中的消息
    this.pendingMessages.forEach(timer => clearTimeout(timer));
    this.pendingMessages.clear();

    this.isRunning = false;
    log('info', 'MessageObserver', 'Message observer stopped');
  }

  /**
   * 处理 DOM 变化
   * @private
   */
  _handleMutations(mutations) {
    for (const mutation of mutations) {
      // 检查新增的节点
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this._checkForNewMessage(node);
        }
      });
    }
  }

  /**
   * 检查是否是新消息
   * @private
   */
  _checkForNewMessage(node) {
    // 检查节点本身
    if (node.tagName === 'ARTICLE' && node.hasAttribute('data-turn-id')) {
      this._processNewArticle(node);
    }

    // 检查子节点中的 article 元素
    if (node.querySelectorAll) {
      const articles = node.querySelectorAll('article[data-turn-id]');
      articles.forEach(article => this._processNewArticle(article));
    }
  }

  /**
   * 处理新的 article 元素
   * @private
   */
  _processNewArticle(article) {
    const turnId = article.getAttribute('data-turn-id');

    // 检查是否已处理过
    if (this.processedMessages.has(turnId)) {
      return;
    }

    const role = article.getAttribute('data-turn');

    log('info', 'MessageObserver', `New message detected`, {
      id: turnId.substring(0, 8) + '...',
      role: role
    });

    // User 消息立即处理，Assistant 消息需要等待完成
    if (role === 'user') {
      this._extractAndNotify(article);
    } else if (role === 'assistant') {
      this._waitForAssistantMessage(article);
    }
  }

  /**
   * 等待 Assistant 消息完成
   * @private
   */
  _waitForAssistantMessage(article) {
    const turnId = article.getAttribute('data-turn-id');

    // 如果已在等待列表中，清除之前的定时器
    if (this.pendingMessages.has(turnId)) {
      clearTimeout(this.pendingMessages.get(turnId));
    }

    // 延迟检查（给流式输出时间完成）
    const checkComplete = () => {
      // 检查是否还在流式输出
      const isStreaming = this._isMessageStreaming();

      if (isStreaming) {
        // 还在输出，继续等待
        log('debug', 'MessageObserver', 'Message still streaming, waiting...');
        const timer = setTimeout(checkComplete, 1000);
        this.pendingMessages.set(turnId, timer);
      } else {
        // 输出完成，提取并通知
        log('info', 'MessageObserver', 'Message streaming complete');
        this.pendingMessages.delete(turnId);
        this._extractAndNotify(article);
      }
    };

    // 首次检查延迟 500ms（给初始渲染时间）
    const timer = setTimeout(checkComplete, 500);
    this.pendingMessages.set(turnId, timer);
  }

  /**
   * 检查是否有消息正在流式输出
   * @private
   * @returns {boolean}
   */
  _isMessageStreaming() {
    // 检查是否有"停止生成"按钮
    const stopButton = document.querySelector('[data-testid*="stop-button"]')
                    || document.querySelector('button[aria-label*="停止"]')
                    || document.querySelector('button[aria-label*="Stop"]');

    return !!stopButton;
  }

  /**
   * 提取消息并通知
   * @private
   */
  _extractAndNotify(article) {
    const turnId = article.getAttribute('data-turn-id');

    // 标记为已处理
    this.processedMessages.add(turnId);

    // 提取消息数据
    const messageData = extractMessageFromDOM(article);

    if (!messageData) {
      log('warn', 'MessageObserver', 'Failed to extract message data');
      return;
    }

    log('info', 'MessageObserver', 'Message extracted successfully', {
      id: messageData.id.substring(0, 8) + '...',
      role: messageData.role,
      contentLength: messageData.content.length
    });

    // 触发回调
    if (this.callback) {
      try {
        Promise.resolve(this.callback(messageData)).catch(error => {
          log('error', 'MessageObserver', 'Callback error:', error);
        });
      } catch (error) {
        log('error', 'MessageObserver', 'Callback error:', error);
      }
    }
  }

  /**
   * 获取已处理的消息数量
   * @returns {number}
   */
  getProcessedCount() {
    return this.processedMessages.size;
  }

  /**
   * 检查观察器是否正在运行
   * @returns {boolean}
   */
  isObserving() {
    return this.isRunning;
  }

  /**
   * 清空已处理消息列表（用于对话切换时）
   */
  reset() {
    log('info', 'MessageObserver', 'Resetting observer state');
    this.processedMessages.clear();
    this.pendingMessages.forEach(timer => clearTimeout(timer));
    this.pendingMessages.clear();
  }
}

/**
 * 创建并启动消息观察器
 * @param {Function} callback - 新消息回调
 * @returns {MessageObserver}
 */
export function createMessageObserver(callback) {
  const observer = new MessageObserver();
  observer.start(callback);
  return observer;
}
