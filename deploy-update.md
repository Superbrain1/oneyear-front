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
