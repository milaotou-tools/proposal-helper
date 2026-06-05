# proposal-helper 开发注意事项

## 项目架构
- Next.js 15 App Router，无 basePath
- Tailwind CSS，设计色系：`#FAF9F6` 背景，`#141413` 文字，`#E8E6E1` 边框
- AI：DeepSeek V4 Pro，通过 `lib/ai-client.ts` 调用
- 数据采集：`lib/data-collection.ts`，JSONL 格式

## 代码改动规则
- 文案改动：改组件源码（主要在 `components/ProposalHelperApp.tsx`），然后部署 + 清 Nginx 缓存
- Prompt 改动：改 `lib/prompts/*.ts`，然后部署，不需要清缓存
- API 路由改动：改 `app/api/*/route.ts` + `lib/route-helpers.ts`
- 数据采集的 `inputSummary` 必须包含用户原文，不只是 metadata
- 避免静态页面缓存问题：必要时加 `export const dynamic = "force-dynamic"`

## 部署
- 服务器：阿里云 116.62.220.255，BT Panel
- 端口：外网 8083 → 内网 3005
- PM2 进程：proposal-helper
- 路径：`/www/wwwroot/proposal-helper`
- 数据：`/www/wwwdata/proposal-helper/{collection,feedback}/`
- 部署 workflow：`Deploy via SCP (bypass git)`（服务器连不上 GitHub，从 runner 推）

### 部署后必须做的事
1. `find /www/server/nginx/proxy_cache_dir -type f -delete` 清 Nginx 缓存
2. `nginx -s reload`
3. 带随机参数验证页面：`curl "http://116.62.220.255:8083/?t=$(date +%s)"`

## 常见坑
- **Nginx 缓存**：BT Panel 默认 proxy_cache 1 年，改文字后不更新 → 每次部署后清
- **502 Bad Gateway**：PM2 重启间隙，等几秒
- **"Unexpected token '<'"**：Nginx 超时返回 HTML 而非 JSON，前端已加自动重试
- **PM2 重复实例**：部署前先 `pm2 delete` + `fuser -k`
- **.next 删不干净**：先停 PM2 再 `rm -rf .next`
- **GitHub Actions workflow YAML**：用 Bash heredoc 写，不要用编辑器直接写（可能编码问题导致 `workflow_dispatch` 无法识别）
