import { log } from '../../shared/utils.js';

/**
 * 从节点中提取 ID
  * @param {Element} node - DOM 节点
  * @returns {string|null}
 */
export function getUniqueMessageId(node) {
  // 1. 如果节点本身就是 article，尝试查找内部的 message-id
  if (node.tagName === 'ARTICLE') {
    const innerMessage = node.querySelector('[data-message-id]');
    if (innerMessage) return innerMessage.getAttribute('data-message-id');
    if (node.hasAttribute('data-message-id')) return node.getAttribute('data-message-id');
    log('warn', 'MessageIdHelper', 'Article element missing data-message-id attribute');
    return null;
  }
  
  // 2. 如果节点是 article 内部的某个元素（比如 message div）
  if (node.hasAttribute('data-message-id')) {
    return node.getAttribute('data-message-id');
  }

  return null;
}

/**
 * 从 DOM 节点提取最准确的 UUID
 * 优先级：内部 Message ID > 自身 Message ID > Turn ID
 * @param {Element} article - 消息元素
 * @returns {string} 消息唯一 ID
 */
export function resolveMessageId(article) {
  // 1. 查找内部包含 data-message-id 的元素 (最准确，对应 User/Assistant 内容块)
  const innerMsg = article.querySelector('[data-message-id]');
  if (innerMsg) {
    return innerMsg.getAttribute('data-message-id');
  }

  // 2. 查找 article 自身的 data-message-id (兼容旧版)
  if (article.hasAttribute('data-message-id')) {
    return article.getAttribute('data-message-id');
  }

  // 3. 返回空
  return null;
}