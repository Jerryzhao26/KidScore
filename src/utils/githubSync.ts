/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Child, Task, Penalty, Reward, Transaction } from '../types';

export interface SyncDataPayload {
  children: Child[];
  tasks: Task[];
  penalties?: Penalty[];
  rewards: Reward[];
  transactions: Transaction[];
  updatedAt: string;
  deviceInfo?: string;
}

/**
 * Detects whether the app should contact GitHub API directly from the browser
 * or proxy through the custom express backend server.
 */
function useDirectGitHub(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const isExpressBackendAvailable = hostname === 'localhost' || 
                                    hostname === '127.0.0.1' || 
                                    hostname === '0.0.0.0' || 
                                    hostname.endsWith('.run.app');
  return !isExpressBackendAvailable;
}

/**
 * Base Headers helper for direct GitHub requests.
 * NOTE: Do NOT send 'Cache-Control' or 'Content-Type' on GET requests,
 * as custom headers trigger CORS preflight checks that GitHub API blocks on web browsers.
 */
function getHeaders(token: string, isJsonBody = false) {
  const cleanToken = token.trim();
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
  };
  if (cleanToken) {
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }
  if (isJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/**
 * Helper to fetch content from a raw file URL bypassing cache
 */
async function fetchRawUrl(rawUrl: string, token: string): Promise<string> {
  const cacheBusterUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const cleanToken = token.trim();
  
  try {
    const res = await fetch(cacheBusterUrl, {
      headers: cleanToken ? { 'Authorization': `Bearer ${cleanToken}` } : {}
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    console.warn('Fetch raw Gist URL with Auth failed, trying plain fetch...', e);
  }

  const fallbackRes = await fetch(cacheBusterUrl);
  if (!fallbackRes.ok) {
    throw new Error(`无法从 Gist Raw URL 拉取完整数据: 状态码 ${fallbackRes.status}`);
  }
  return await fallbackRes.text();
}

/**
 * Direct GitHub API calls
 */
async function testGitHubTokenDirect(token: string): Promise<string> {
  const cleanToken = token.trim();
  const res = await fetch(`https://api.github.com/user?t=${Date.now()}`, {
    headers: getHeaders(cleanToken, false),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token 密钥验证失败 (401)，请检查 Token 字符串是否无误');
    }
    throw new Error(`连接 GitHub 账号失败 (状态码 ${res.status})`);
  }
  const data = await res.json();

  // Check Gist scope
  const gistTestRes = await fetch(`https://api.github.com/gists?per_page=1&t=${Date.now()}`, {
    headers: getHeaders(cleanToken, false),
  });
  if (!gistTestRes.ok && (gistTestRes.status === 403 || gistTestRes.status === 401)) {
    throw new Error(`已登录用户 [${data.login}]，但 Token 缺少 gist 权限 (403)！请去 GitHub 重新生成勾选了 gist 权限的 Token。`);
  }

  return data.login;
}

/**
 * Validates a GitHub Personal Access Token
 */
export async function testGitHubToken(token: string): Promise<string> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('请先输入有效的 GitHub Personal Access Token (PAT) 密钥！');
  }

  if (useDirectGitHub()) {
    return await testGitHubTokenDirect(cleanToken);
  } else {
    try {
      const res = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', token: cleanToken }),
      });
      if (res.status === 404) {
        // Backend API route missing, fallback to direct GitHub
        return await testGitHubTokenDirect(cleanToken);
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `连接 GitHub 发生错误 (${res.status})`);
      }
      const data = await res.json();
      return data.login;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        // Express endpoint not available, fallback to direct
        return await testGitHubTokenDirect(cleanToken);
      }
      throw err;
    }
  }
}

async function createGistDirect(cleanToken: string, payload: SyncDataPayload): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: getHeaders(cleanToken, true),
    body: JSON.stringify({
      description: '✨ 儿童金币积分星球 - 云同步数据存档',
      public: false,
      files: {
        'kids_gold_space.json': {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('创建 Gist 失败 (401/403)：Token 密钥无效或缺少 gist 权限！');
    }
    const errorText = await res.text().catch(() => '');
    throw new Error(`创建 Gist 失败: 状态码 ${res.status} (${errorText})`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Gist Core: Create a brand new secret Gist with preloaded data
 */
export async function createGist(token: string, payload: SyncDataPayload): Promise<string> {
  const cleanToken = token.trim();
  if (useDirectGitHub()) {
    return await createGistDirect(cleanToken, payload);
  } else {
    try {
      const res = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createGist', token: cleanToken, payload }),
      });

      if (res.status === 404) {
        return await createGistDirect(cleanToken, payload);
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `创建 Gist 失败: 状态码 ${res.status}`);
      }

      const data = await res.json();
      return data.id;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        return await createGistDirect(cleanToken, payload);
      }
      throw err;
    }
  }
}

async function updateGistDirect(cleanToken: string, cleanGistId: string, payload: SyncDataPayload): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${cleanGistId}`, {
    method: 'PATCH',
    headers: getHeaders(cleanToken, true),
    body: JSON.stringify({
      files: {
        'kids_gold_space.json': {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`找不到 Gist ID [${cleanGistId}] (404)！可能已被删除或 ID 填写错误。`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('更新 Gist 失败 (401/403)：Token 无权修改此 Gist 或缺少 gist 权限！');
    }
    throw new Error(`更新云端 (Gist) 失败: 状态码 ${res.status}`);
  }
}

/**
 * Gist Core: Update an existing Gist
 */
export async function updateGist(token: string, gistId: string, payload: SyncDataPayload): Promise<void> {
  const cleanToken = token.trim();
  const cleanGistId = gistId.trim();

  if (!cleanGistId) {
    throw new Error('未指定有效 Gist ID');
  }

  if (useDirectGitHub()) {
    await updateGistDirect(cleanToken, cleanGistId, payload);
  } else {
    try {
      const res = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateGist',
          token: cleanToken,
          gistId: cleanGistId,
          payload,
        }),
      });

      if (res.status === 404) {
        await updateGistDirect(cleanToken, cleanGistId, payload);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `更新云端 (Gist) 失败: 状态码 ${res.status}`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        await updateGistDirect(cleanToken, cleanGistId, payload);
        return;
      }
      throw err;
    }
  }
}

async function getGistDirect(cleanToken: string, cleanGistId: string): Promise<SyncDataPayload | null> {
  const res = await fetch(`https://api.github.com/gists/${cleanGistId}?t=${Date.now()}`, {
    headers: getHeaders(cleanToken, false),
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('读取 Gist 失败 (401/403)：当前 Token 密钥无效或缺少 gist 读取权限！');
    }
    throw new Error(`获取云端 (Gist) 失败: 状态码 ${res.status}`);
  }

  const data = await res.json();
  const file = data.files['kids_gold_space.json'] || Object.values(data.files).find((f: any) => f.filename?.endsWith('.json'));
  if (!file) {
    throw new Error('Gist 中未找到 kids_gold_space.json 或任何 JSON 配置文件');
  }

  if ((file.truncated || !file.content) && file.raw_url) {
    const rawContent = await fetchRawUrl(file.raw_url, cleanToken);
    return JSON.parse(rawContent);
  }

  return JSON.parse(file.content);
}

/**
 * Gist Core: Retrieve data from a Gist with strict cache busting
 */
export async function getGist(token: string, gistId: string): Promise<SyncDataPayload | null> {
  const cleanToken = token.trim();
  const cleanGistId = gistId.trim();

  if (!cleanGistId) return null;

  if (useDirectGitHub()) {
    return await getGistDirect(cleanToken, cleanGistId);
  } else {
    try {
      const res = await fetch('/api/sync/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getGist',
          token: cleanToken,
          gistId: cleanGistId,
        }),
      });

      if (res.status === 404) {
        return await getGistDirect(cleanToken, cleanGistId);
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `获取云端 (Gist) 失败: 状态码 ${res.status}`);
      }

      const data = await res.json();
      return data.payload;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        return await getGistDirect(cleanToken, cleanGistId);
      }
      throw err;
    }
  }
}
