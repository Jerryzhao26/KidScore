import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // GitHub Gist API proxy endpoint
  app.post("/api/sync/github", async (req, res) => {
    const { action, token, gistId, payload } = req.body;
    if (!token) {
      return res.status(400).json({ error: "未检测到 GitHub Token" });
    }

    const cleanToken = token.trim();
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${cleanToken}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "User-Agent": "KidsGoldSync-App"
    };

    try {
      if (action === "test") {
        const response = await fetch(`https://api.github.com/user?t=${Date.now()}`, { headers });
        if (!response.ok) {
          if (response.status === 401) {
            return res.status(401).json({ error: "Token 密钥无效或已过期 (401)！请检查 Token 字符串是否复制完整。" });
          }
          return res.status(response.status).json({ error: `连接 GitHub 账户失败 (状态码 ${response.status})` });
        }
        const data = await response.json() as { login: string };

        // Also test Gist read/write permission
        const gistTestRes = await fetch(`https://api.github.com/gists?per_page=1&t=${Date.now()}`, { headers });
        if (!gistTestRes.ok) {
          if (gistTestRes.status === 403 || gistTestRes.status === 401) {
            return res.status(403).json({
              error: `已识别用户 [${data.login}]，但 Token 缺少 gist 权限 (403)！请重新申请 Token 并确保勾选 gist 权限。`
            });
          }
        }

        return res.json({ success: true, login: data.login });
      }

      if (action === "createGist") {
        const response = await fetch("https://api.github.com/gists", {
          method: "POST",
          headers,
          body: JSON.stringify({
            description: "✨ 儿童金币积分星球 - 云同步数据存档",
            public: false,
            files: {
              "kids_gold_space.json": {
                content: JSON.stringify(payload, null, 2),
              },
            },
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          if (response.status === 403 || response.status === 401) {
            return res.status(response.status).json({
              error: "创建 Gist 失败 (403/401)：当前 Token 缺少 gist 权限！请去 GitHub 重新生成包含 gist 权限的 Token。"
            });
          }
          return res.status(response.status).json({ error: `创建 Gist 失败 (状态码 ${response.status}): ${text}` });
        }
        const data = await response.json() as { id: string };
        return res.json({ success: true, id: data.id });
      }

      if (action === "updateGist") {
        const cleanGistId = (gistId || "").trim();
        if (!cleanGistId) {
          return res.status(400).json({ error: "未指定有效 Gist ID" });
        }
        const response = await fetch(`https://api.github.com/gists/${cleanGistId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            files: {
              "kids_gold_space.json": {
                content: JSON.stringify(payload, null, 2),
              },
            },
          }),
        });
        if (!response.ok) {
          if (response.status === 404) {
            return res.status(404).json({ error: `找不到 Gist ID [${cleanGistId}] (404)！可能该 Gist 已被删除或 ID 填写错误。您可以点击“在云端自动建新 Gist”重新生成。` });
          }
          if (response.status === 403 || response.status === 401) {
            return res.status(response.status).json({ error: "更新 Gist 失败 (403)：当前 Token 无权修改该 Gist 或缺少 gist 权限！" });
          }
          return res.status(response.status).json({ error: `更新云端 (Gist) 失败: 状态码 ${response.status}` });
        }
        return res.json({ success: true });
      }

      if (action === "getGist") {
        const cleanGistId = (gistId || "").trim();
        if (!cleanGistId) {
          return res.status(400).json({ error: "未指定有效 Gist ID" });
        }
        const response = await fetch(`https://api.github.com/gists/${cleanGistId}?t=${Date.now()}`, { headers });
        if (response.status === 404) {
          return res.status(404).json({ error: `找不到 Gist ID [${cleanGistId}] (404)！可能 ID 填写错误或在 GitHub 上已被删除。` });
        }
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            return res.status(response.status).json({ error: "读取 Gist 失败 (403/401)：当前 Token 密钥无效或缺少 gist 读取权限！" });
          }
          return res.status(response.status).json({ error: `获取云端 (Gist) 失败: 状态码 ${response.status}` });
        }
        const data = await response.json() as { files: Record<string, { filename: string; truncated: boolean; raw_url: string; content: string }> };
        const file = data.files["kids_gold_space.json"] || Object.values(data.files).find((f: any) => f.filename.endsWith(".json"));
        if (!file) {
          return res.status(400).json({ error: "Gist 中未找到 kids_gold_space.json 或任何 JSON 配置文件" });
        }

        let content = file.content;
        if ((file.truncated || !content) && file.raw_url) {
          const rawUrl = file.raw_url.includes("?") ? `${file.raw_url}&t=${Date.now()}` : `${file.raw_url}?t=${Date.now()}`;
          const rawRes = await fetch(rawUrl, { headers });
          if (rawRes.ok) {
            content = await rawRes.text();
          } else {
            const fallbackRes = await fetch(rawUrl, { headers: { "Cache-Control": "no-cache" } });
            if (fallbackRes.ok) {
              content = await fallbackRes.text();
            } else {
              return res.status(500).json({ error: "无法从 Gist Raw URL 拉取完整数据" });
            }
          }
        }
        return res.json({ success: true, payload: JSON.parse(content) });
      }

      return res.status(400).json({ error: `未知指令: ${action}` });
    } catch (e: any) {
      console.error("Express GitHub proxy error:", e);
      return res.status(500).json({ error: `网络中转请求 GitHub 失败提示: ${e.message || e}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
