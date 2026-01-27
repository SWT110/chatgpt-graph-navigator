/**
 * 消息提取器
 * 从 ChatGPT 页面的 DOM 中提取消息信息
 */

import { log } from '../../shared/utils.js';

/**
 * 从 DOM article 元素提取消息信息
 * @param {HTMLElement} article - article 元素
 * @returns {Object|null} 提取的消息数据
 */
export function extractMessageFromDOM(article) {
  if (!article || article.tagName !== 'ARTICLE') {
    return null;
  }

  try {
    // 提取关键属性
    const turnId = article.getAttribute('data-turn-id');
    const role = article.getAttribute('data-turn'); // "user" or "assistant"
    const turnNumber = article.getAttribute('data-testid')?.match(/\d+/)?.[0];

    if (!turnId || !role) {
      log('debug', 'MessageExtractor', 'Missing required attributes', {
        turnId, role
      });
      return null;
    }

    // 提取内容 - 查找包含实际内容的 div
    let content = '';

    // 尝试多种选择器
    const contentSelectors = [
      '.markdown',                                    // Markdown 内容
      '[data-message-author-role] + div',            // 角色标记后的 div
      'div > div > div'                               // 通用深层 div
    ];

    for (const selector of contentSelectors) {
      const contentDiv = article.querySelector(selector);
      if (contentDiv && contentDiv.textContent.trim().length > 0) {
        content = contentDiv.textContent.trim();
        break;
      }
    }

    // 如果以上方法都失败，遍历所有 div 找最长的文本
    if (!content) {
      const allDivs = article.querySelectorAll('div');
      let maxLength = 0;

      allDivs.forEach(div => {
        const text = div.textContent?.trim() || '';
        // 排除按钮文本等短文本
        if (text.length > maxLength && text.length > 20) {
          content = text;
          maxLength = text.length;
        }
      });
    }

    // 推断父节点（上一个 article）
    let parent = null;
    let prevElement = article.previousElementSibling;

    // 向前查找最近的 article 元素
    while (prevElement) {
      if (prevElement.tagName === 'ARTICLE' && prevElement.hasAttribute('data-turn-id')) {
        parent = prevElement.getAttribute('data-turn-id');
        break;
      }
      prevElement = prevElement.previousElementSibling;
    }

    const messageData = {
      id: turnId,
      role: role,
      content: content,
      parent: parent,
      turnNumber: turnNumber ? parseInt(turnNumber) : null,
      timestamp: Date.now(),
      source: 'dom'
    };

    log('debug', 'MessageExtractor', 'Extracted message', {
      id: turnId.substring(0, 8) + '...',
      role: role,
      contentLength: content.length,
      hasParent: !!parent
    });

    return messageData;

  } catch (error) {
    log('error', 'MessageExtractor', 'Failed to extract message:', error);
    return null;
  }
}

/**
 * 获取当前页面所有消息
 * @returns {Array<Object>} 消息数组
 */
export function getAllMessagesFromDOM() {
  const main = document.querySelector('main');
  if (!main) {
    log('warn', 'MessageExtractor', 'Main element not found');
    return [];
  }

  const articles = main.querySelectorAll('article[data-turn-id]');
  log('info', 'MessageExtractor', `Found ${articles.length} messages in DOM`);

  return Array.from(articles)
    .map(extractMessageFromDOM)
    .filter(Boolean);
}

/**
 * 查找最后一条消息
 * @returns {Object|null}
 */
export function getLastMessageFromDOM() {
  const messages = getAllMessagesFromDOM();
  return messages[messages.length - 1] || null;
}

/**
 * 根据 ID 查找消息
 * @param {string} messageId - 消息 ID
 * @returns {Object|null}
 */
export function getMessageByIdFromDOM(messageId) {
  const article = document.querySelector(`article[data-turn-id="${messageId}"]`);
  if (!article) {
    return null;
  }
  return extractMessageFromDOM(article);
}
