# 项目更新部署流程

## 前端更新

1. 本地修改代码
2. 构建：
   ```bash
   cd oneyear-fronte
   npm run build
   ```
3. 将 `dist/` 目录下的所有文件上传覆盖到服务器 `/www/wwwroot/oneyear-front/`
4. **无需重启**，刷新浏览器即生效

---

## 后端更新

1. 本地修改代码
2. 将源码上传到服务器 `/www/wwwroot/oneyear-back/`（无需上传 `node_modules/`）
3. 如果 `package.json` 有变动（新增了依赖），在服务器上运行：
   ```bash
   cd /www/wwwroot/oneyear-back
   npm install --omit=dev
   ```
4. 用 PM2 重启后端：
   ```bash
   pm2 restart oneyear-back
   ```

---

## 推荐方式：使用 Git 管理

手动上传文件容易出错，推荐将项目推到 GitHub，服务器上直接拉取更新。

### 后端更新（服务器端）

```bash
cd /www/wwwroot/oneyear-back
git pull
npm install --omit=dev   # 仅在新增依赖时需要
pm2 restart oneyear-back
```

### 前端更新（服务器端）

```bash
cd /www/wwwroot/oneyear-fronte
git pull
npm run build
cp -r dist/* /www/wwwroot/oneyear-front/
```

---

## 服务器信息

| 项目       | 路径 / 地址                        |
|------------|-----------------------------------|
| 前端静态文件 | `/www/wwwroot/oneyear-front/`     |
| 后端源码   | `/www/wwwroot/oneyear-back/`      |
| 后端端口   | `3000`                            |
| 服务器 IP  | `43.129.171.53`                   |
| 域名       | `oneyearoneyear.com`              |

## 常用命令

```bash
pm2 list                  # 查看所有进程状态
pm2 restart oneyear-back  # 重启后端
pm2 logs oneyear-back     # 查看后端日志
pm2 stop oneyear-back     # 停止后端
```

---

## GitHub Actions 自动发布（推荐）

已支持：

1. 推送 `main` 且修改 `oneyear-fronte/` 时，自动构建并发布前端
2. 推送 `main` 且修改 `oneyear-back/` 时，自动同步后端并重启 PM2

工作流文件：

1. `.github/workflows/deploy-frontend.yml`
2. `.github/workflows/deploy-backend.yml`

### 1) 在 GitHub 仓库配置 Secrets

进入：`Settings -> Secrets and variables -> Actions -> New repository secret`

必填项：

1. `SERVER_HOST`：服务器 IP（例如 `43.129.171.53`）
2. `SERVER_PORT`：SSH 端口（通常 `22`）
3. `SERVER_USER`：SSH 用户（例如 `root` 或部署用户）
4. `SERVER_SSH_KEY`：私钥内容（建议专用 deploy key）
5. `FRONTEND_DEPLOY_PATH`：前端目录（`/www/wwwroot/oneyear-front`）
6. `BACKEND_DEPLOY_PATH`：后端目录（`/www/wwwroot/oneyear-back`）
7. `BACKEND_PM2_APP`：PM2 进程名（`oneyear-back`）

### 2) 服务器首次准备

确保服务器可用：

```bash
node -v
npm -v
pm2 -v
rsync --version
```

如果缺少 PM2：

```bash
npm i -g pm2
```

首次启动后端（仅第一次需要）：

```bash
cd /www/wwwroot/oneyear-back
npm install --omit=dev
pm2 start src/server.js --name oneyear-back
pm2 save
```

### 3) 触发自动发布

1. 提交并推送到 `main`
2. 进入 GitHub `Actions` 页面查看发布日志
3. 后端可在服务器用 `pm2 logs oneyear-back` 验证
