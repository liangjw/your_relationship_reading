# 心动译码 V2

基于用户的《Relationship_Reading_V2_Game_Design.docx》，20题单人异性行为预测游戏。女性路线全部预测男性，男性路线全部预测女性；全程不揭晓，结束才生成固定12型报告、六维指标、脑补指数、异性使用说明书和分享长卡。

当前实现使用待校准的研究方向试玩基准。PRD要求的真实用户语言验证、男女选项分布采集尚未提供；建议的男女各数百名统计校准也未完成。不能把方向吻合度称作实测预测准确率，不展示玩家百分位。AI需要服务器配置；真实调用目前返回429 `credit_balance_exhausted`，无配置或失败时使用引用实际答卷的模板总结。

## 运行

Node.js 22.12或更高版本。

```sh
npm ci
npm run build
npm start
# http://localhost:4174
npm test
node scripts/qa-v2.mjs
npm run dev:cloudflare
```

浏览器验证脚本使用当前工作环境的 Playwright 和 Edge。它是验收工具，不是游戏运行依赖；换机器时调整脚本的工具位置。

## 架构

- `frontend/`：HTML、CSS、DOM适配、媒体播放、HTTP、分享和PNG导出。没有题库、答案、评分、人格规则或流程计算。
- `backend/content/`：从PRD直接导入的40题、Research KB、维度及待校准基准。
- `backend/domain/`：服务器会话、顺序、回退、计时、加权距离评分、固定12型分类。
- `backend/services/`：API用例、并发控制、报告润色。
- `backend/presentation/`：后端生成当前题页、完整报告、二维码和750×1360分享SVG。
- `backend/repositories/`：本地原子文件存储；`backend/cloudflare/`使用SQLite-backed Durable Objects持久化同一套业务服务。
- `dist/client/`：唯一公开目录。任何后端代码、基准、密钥、会话文件均不进入该目录。
- `legacy/v7/`：原版源码归档；Git `master` 保留原版提交。

请求使用HttpOnly会话标识，答案留在服务器。操作检查同源、会话版本、当前题ID和有效选项；重复请求不会跳题。每题顺序由后端随机一次并随会话持久化。刷新、回退保持原顺序和答案，改答覆盖旧记录。分享链接仅含`?from=report`，好友从入口开始。

原生双击次数作为界面事件数据传给服务器，后端统一拒绝start/answer/back尾点击，另保留500ms新幕保护。客户端HTTP请求统一15秒截止，覆盖JSON与海报blob读取；409同步和海报下载挂起也能恢复重试。计时为服务端首次连续作答近似值，会扣后台停留、排除回看，但不冒称精确的屏幕反应速度。

开局冻结20题的情境、选项、理由、基准及研究来源，后来审核的新变体不改变已开始的一局。答卷保存实际选中理由和版本，不会为旧答卷补推新理由；缺少理由时归因与D6记为未评估。旧会话升级后保留原始答卷并提示重开；旧报告缓存版本失配后重算。规则版本 `v2-directional-2`，会话版本3。

AI内容草稿由 `scripts/generate-v2-scenario.mjs` 生成，结构校验后仍需人工审阅；`scripts/publish-v2-scenario.mjs` 收录审核后的变体。题族、维度、来源和四个选项不可由AI修改，只有解释层可润色，不参与人格分类。当前审核变体列表为空。

## 配置

本地环境变量：`PORT`、`SESSION_DIR`、`PUBLIC_URL`、`OPENAI_API_KEY`、`OPENAI_REPORT_MODEL`。AI密钥只在服务器使用，不会被写入HTML或构建产物。`PUBLIC_URL`默认从请求取得，用于分享卡二维码。

Cloudflare配置在`wrangler.jsonc`，独立Worker名`your-relationship-reading-v2`，保留原版Worker。静态资源走Assets，所有`/api/*`走后端，匿名会话用SQLite Durable Objects存储。Wrangler固定为4.147.0。

```sh
npm run build
npx --yes wrangler@4.147.0 deploy --dry-run
# 完成PRD门禁并核对后再部署
npm run deploy
```

## 内容及声音

4张V2都市editorial manga为内置imagegen生成，柔和线稿、生活物件、成年普通人、跨格分镜；40题复用3种场景板，封面单独一张。图片完整显示，没有宣称逐题独立绘制。提示词与图片来源见`artwork/V2-PROMPTS.md`。

音乐由`scripts/compose-v2-audio.mjs`创作并在构建时生成，共4条阅读氛围循环、12条人格循环及typing/notification短音效，每条循环18–25秒，普通和人格曲加入吉他泛音。没有商业录音采样。默认静音，由用户主动开启；隐藏页面暂停。曲目、音量和人格绑定由后端决定，前端只播放文件。素材生成后无需外部音乐服务。

## 验收依据

最新PRD文字和文件哈希在`docs/V2-PRD-source.*`。需求矩阵、已知差异和上线前真实样本门禁在`docs/V2-ACCEPTANCE.md`。用户数据、密钥与本地原始画稿不提交Git；测试fixtures是可重复的程序答卷，不是真实用户样本。
