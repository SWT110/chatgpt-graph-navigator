/**
 * Token 管理模块
 * 从 chrome.storage 读取用户在 setup 页面配置的 token
 */

import { log } from '../../shared/utils.js';

// Token 缓存
let capturedToken = null;
let cachedAuthInfo = null;

/**
 * 获取 Cookie 值
 * @param {string} name - Cookie 名称
 * @returns {string|null}
 */
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * 从 chrome.storage 加载用户配置的 token
 * @returns {Promise<boolean>} 是否成功加载有效 token
 */
export async function loadToken() {
  try {
    const result = await chrome.storage.local.get(['accessToken', 'tokenTimestamp']);
    if (result.accessToken) {
      // 检查 token 是否过期（24小时）
      const age = Date.now() - (result.tokenTimestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      if (age < maxAge) {
        capturedToken = result.accessToken;
        cachedAuthInfo = null; // 清除缓存，强制使用新 token
        log('info', 'Token', 'Loaded stored token from chrome.storage', {
          length: capturedToken.length,
          age: Math.floor(age / 1000 / 60) + ' minutes'
        });
        return true;
      } else {
        log('warn', 'Token', 'Stored token expired (>24h)');
        return false;
      }
    }
    log('warn', 'Token', 'No token found in storage');
    return false;
  } catch (error) {
    log('error', 'Token', 'Failed to load stored token:', error);
    return false;
  }
}

/**
 * 获取当前 token
 * @returns {string|null}
 */
export function getToken() {
  return capturedToken;
}

/**
 * 检查是否有 token
 * @returns {boolean}
 */
export function hasToken() {
  return !!capturedToken;
}




/**
 * 获取认证信息，包括 token、accountId、deviceId
 * @returns {Object}
 */
function getAuthInfo() {
  if (cachedAuthInfo && Date.now() - cachedAuthInfo.timestamp < 60000) {
    return cachedAuthInfo.data;
  }

  const authInfo = {
    accessToken: capturedToken,
    accountId: getCookie('_account'),
    deviceId: getCookie('oai-did')
  };

  cachedAuthInfo = {
    data: authInfo,
    timestamp: Date.now()
  };

  log('info', 'API', 'Auth info retrieved:', {
    hasToken: !!authInfo.accessToken,
    hasAccountId: !!authInfo.accountId,
    hasDeviceId: !!authInfo.deviceId,
    tokenSource: authInfo.accessToken ? 'main-world' : 'none'
  });

  return authInfo;
}

export function clearAuthCache() {
  cachedAuthInfo = null;
  log('info', 'API', 'Auth cache cleared');
}

/**
 * 构建包含 token 的请求头
 * @returns {Object}
 */
export function buildAuthHeaders() {
  const authInfo = getAuthInfo();

  const headers = {
    'accept': '*/*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'oai-language': 'zh-CN',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
  };

  if (authInfo.accessToken) {
    headers['authorization'] = `Bearer ${authInfo.accessToken}`;
  } else {
    log('warn', 'API', 'No access token available, request may fail');
  }

  if (authInfo.accountId) {
    headers['chatgpt-account-id'] = authInfo.accountId;
  }

  if (authInfo.deviceId) {
    headers['oai-device-id'] = authInfo.deviceId;
  }

  return headers;
}
