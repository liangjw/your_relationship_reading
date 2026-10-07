# V2需求与验收矩阵

唯一设计依据：用户下载目录中的 `Relationship_Reading_V2_Game_Design.docx`，2026-10-07。原文及哈希见本目录 `V2-PRD-source.txt` 与 `V2-PRD-source.json`。此前30题v7设计不作为V2需求。

| PRD要求 | 实现位置 | 验证状态 |
| --- | --- | --- |
| 男女路线只预测异性，各20题 | backend/content/prd-questions.json、bank.mjs | 40题原文直接导入；自动检查 |
| A–D四项，连续预测，最后揭晓 | backend/domain/session.mjs、presentation/views.mjs | API检查；320/375/390/430×男女8组160题浏览器检查通过 |
| 研究在后台，不在题后解读 | presentation/views.mjs | 未结束不发送解释或基准 |
| D1–D6六维、加权距离而非单题对错 | domain/assessment.mjs | 自动检查，方向坐标待实样本校准 |
| 固定12型，不让AI分类 | domain/assessment.mjs | 12份完整答卷fixtures可达 |
| 脑补指数，最大误判引用真实作答 | presentation/views.mjs | 自动检查 |
| 报告八项固定结构 | presentation/views.mjs | 人格、理解力、最懂、误判、刻板、脑补、3 Bug/2沟通、损友总结 |
| 无样本不显示玩家百分位 | presentation/views.mjs | 禁止展示实测排名 |
| 正式与彩蛋娱乐声明 | content/research.mjs、presentation/views.mjs | 报告底部均提供 |
| 恋爱杂志、都市editorial漫画、轻动效 | frontend/styles.css、assets | 四张新画板完整展示；移动截图、报告与海报已检查 |
| 首页/普通/微信/张力/结果及12型音乐 | audio构建脚本、后端present | 16条原创18–25秒循环及2短音效；开启/关闭、长度、结果绑定浏览器通过 |
| 结构化Research KB | content/bank.mjs、research.mjs | 每题维度、来源、等级、方向、置信度、pilot空值 |
| AI只负责解释层，事实可追溯 | services/narrative.mjs | 接口、超时/非法文案及1–3句约束通过；真实调用429额度不足，未验证成功 |
| AI动态生成同类新情境 | services/scenario-drafts.mjs、生成/审核CLI | 结构与题族检索通过mock验证；真实调用429，当前无审核变体，不宣称无限新题 |
| 5–10名真实用户语言验证 | 外部测试资料 | 未提供，待完成 |
| 男女真实四选项分布及统计校准 | 外部测试资料 | 未提供，待完成；“各数百名”为PRD建议的统计样本规模 |
| 至少20%反刻板题 | bank.mjs | 两路线各5/20，即25% |

## 明确决策

1. PRD的D6示例“31→越低越好”与人格表“D6高/低”的方向不一致。页面用“性别刻板指数，越低越好”；分类内部使用100减该指数的校准能力，避免方向颠倒。分类阈值属于产品操作规则，需实样本校准。
2. PRD未给四选项真实分布、置信区间和具体权重。实现把选项到研究方向的距离保存为0–1的序位坐标；A=1、B=0.65、C=0.3。它们不是研究报告的百分比或效应量。当前只可称待校准的研究方向试玩基准。
3. 研究出处校正：S5应为Psychological Science (2020)，DOI10.1177/0956797620904154；S8作者应为Cross、Copping、Campbell；S9中所述Facebook情境研究对应Muscanell等(2013)，DOI为10.1089/cyber.2012.0411。保留题目原文和原PRD出处，运行KB使用核定条目。每题增加情境迁移等级/局限，评分使用证据与迁移等级的较低权重；研究不支持唯一优先序的选项使用并列方向。
4. 不伪造真实用户测试、不把程序fixtures当人类样本、不显示未经支持的中国男女比例或“超过X%玩家”。
5. 旧版master与旧Worker保留。V2分支codex/v2-node-game；V2拟部署到独立Worker，最终地址须以实际部署返回值为准。
6. 会话版本3、规则v2-directional-2，开局冻结全部题面、理由、基准和来源。记录实际所选理由，旧答卷不补推新理由；无记录归因与D6为null并显示未评估。旧局重开并保留历史记录；缓存版本失配重算。

## 本轮实现验证

25项自动测试通过，包括20题全程终局揭晓、12种人格合法完整答卷、实际泛化与预测偏离分开、非威胁选项排除、500ms服务端保护、原生双击尾事件拒绝、题族与AI不可改科学字段、按情境分配音乐，以及旧会话/缓存迁移与快照稳定性。浏览器8组160题通过回退、刷新、报告改答、750×1360 PNG、好友新入口、声音和屏宽检查。补测原生dblclick的14答题+14返回组合通过，保留首轮跨题FAIL记录；实际clickCount/time记录见double-tap.json，delay参数不等于两次click事件之间的实际间隔。前端仅传原生event.detail，尾点击拒绝由后端处理。

Cloudflare workerd + SQLite Durable Objects最终本地运行时，男女各20次实际API提交、持久报告、海报与好友新会话通过。断网失败清除未提交高亮，恢复按钮并可重试；统一15秒HTTP超时覆盖JSON/blob消费，首次GET、409同步GET黑洞、海报超时及重试的实际浏览器验证通过。计时文案明确为首次连续作答近似值；音乐由题族与消息情境分配，不依章节序号。三位指定智能体均归档实现PASS：relationship-round3.md、game-experience-final.md、mobile-final.md；前轮问题与最新局部附记均保留，独立审查的浏览器条件和证据范围在报告中说明。微信真机、实际听感和真人样本仍未验证。Wrangler dry-run与本地运行时通过不代表已部署。

Git实现已推送 `codex/v2-node-game`；原远程master仍为e781e25。Cloudflare OAuth账号可用，最终dry-run已通过。真实用户语言、男女选项分布、AI实调用与审核后新情境仍缺证据，当前未正式部署V2，旧Worker继续服务原版。

2026-10-07 10:33 UTC再次实调用AI同族M05草稿：429 credit_balance_exhausted，仍无成功AI产物，已记录ai-status.json。不把mock约束测试当实模型验证。

## 发布门禁

2026-10-07 用户明确要求“更新设计后，继续部署到cl上”，并授权本会话继续执行至项目完成。本次将可试玩的V2设计版本发布到独立Worker，原master和原版Worker保留。Cloudflare部署成功，版本33bde3ed-018c-4d41-b821-971cbbefbc27，地址https://your-relationship-reading-v2.fliedwolf.workers.dev/。真实人群校准、语言测试与微信真机验证继续保留为未完成事项，不因本次发布而改为通过。

发布后公网复测通过：男女路线各20题、服务器持久报告、分享SVG、好友独立入口；实际浏览器完成20题并成功保存750×1360 PNG。12型角色报告在320和390px共24组布局及全部内嵌PNG验证通过；本地完整男女路线在320、375、390、430px共8组通过。分享图QA改用Canvas读取PNG，避免Cloudflare CSP限制脚本fetch(blob:)导致验证误报。25项规则与交互测试继续通过。更新后的12页Word Proposal包含当前V2规格和全局视觉要求，所有页面已通过docx-preview视觉检查；本机bundled LibreOffice缺失，未核验原生Word分页。

2026-10-07 用户补充视觉与文案修改：人格标识改为12只独立的可爱卡通动物，报告、人格图鉴与分享卡统一使用；删除面向玩家的研究基准、待校准、PRD证据等级和AI回退状态等技术文案。此改动覆盖此前人格视觉要求，不改变题库、评分或分类规则，也不补足上述真实样本证据。图像通过内置imagegen生成，透明WebP每张53–93KB，分享SVG内嵌对应图像以确保保存PNG时角色不丢失。提示词与素材清单见artwork/personality-v2/manifest.json。

代码、API、移动流程、视觉、12型、分享与三位指定智能体审查完成后，才提交发布。按严格PRD正式上线仍需真实用户测试和样本校准证据。用户如选择先上线待校准试玩版，该豁免需在会话与此记录中明确保留。

## 2026-10-07 场景、声音与抽卡体验更新

依据用户的四项优化：增加轻量操作音效与翻页动画；当前40题各绑定一张专属动物漫画分镜；终局报告增加约2.8秒卡背旋转、柔和闪光、角色揭晓演出，支持跳过、Esc及减少动态效果；观察地图和分享PNG统一改为六维雷达图。性别刻板指数在雷达上反向显示为性别校准，原始指数仍保留；未知值不补0。默认静音，声音关闭及切出页面同时停止背景音乐与短音效。刷新报告不重复抽卡，题后仍无解读。

28项自动测试通过，新增40张素材与原文情境的逐项对应、文件哈希无重复、雷达方向和缺值、预加载不泄露未来题面等检查。移动浏览器320/375/390/430px×男女路线8组160题通过；12型报告24组布局和全部750×1360 PNG通过。专项两条路线40张实际加载、上一题还原、真实CSS旋转矩阵、自动结束/跳过、320×568小屏、声音开启/全静音、刷新无重播、减少动态效果、6轴雷达及实际PNG导出均通过。截图和结果见artifacts/v2-review/effects，最新视觉规范见V2-VISUAL-STYLE.md。本轮未改变评分、分类或研究数据。

公网首轮专项发现音频时序问题：开启声音后切换入口音乐，旧play()被中断产生AbortError，旧catch误将声音偏好改为静音，后续揭晓音效未触发。保留失败记录public-audio-failure.json。已修正为仅当前音源的NotAllowedError会回到静音；正常换曲、手动暂停和切出页面引起的中断不改变用户设置。专项注入AbortError/NotAllowedError及用户重试回归通过，见audio-race.json。

最终发布版本4ccae00f-a415-4125-ba47-3175b57bd54a，公网地址https://your-relationship-reading-v2.fliedwolf.workers.dev/。公网两条路线40张图、声音及揭晓、回退、刷新、减少动态效果、6轴雷达、小屏抽卡和PNG导出全部通过；音轨中断专项也通过。结果见effects/browser.json与effects/audio-race.json。Worker启动3ms，上传1229.48KiB/gzip855.48KiB。原master仍为e781e25d8f83055ab87d3fc0ca9ec1ee954106f8。

## 标题与揭晓节奏调整

用户要求主标题改为“你真的懂TA吗？”，入口、浏览器标题、OG分享标题与原生分享标题已同步，标题不再使用“异性”。随后按用户反馈将揭晓从约2.8秒放慢为5.2秒，主旋转4.8秒，翻面后留约1.5秒观看卡片；光晕、星光和原创揭晓音效同步延长。跳过、Esc与减少动态效果仍支持。两条路线专项浏览器复测已通过，实际CSS动画时长核验为4.8秒。

标题及慢速揭晓最终线上版本4fd353cf-ad23-4ff5-9e1c-53fbc3c3e7ba；公网两条路线、4.8秒真实CSS旋转、自动结束、跳过、小屏和分享PNG复测通过，记录见effects-slow/browser.json。原截图目录出现一次本地文件写入错误，使用独立输出目录完成复测。主标题的线上HTML和入口API也已检查。

## dramame.ai 自定义域名

用户要求绑定 dramame.ai，并告知已在 GoDaddy 设置游戏子域名 CNAME。GoDaddy 已切换到 Cloudflare 分配的 lochlan.ns.cloudflare.com 与 summer.ns.cloudflare.com，界面确认使用自定义域名服务器。Cloudflare 已导入现有记录；用户单独确认删除根域名原网站两条 A 记录后，完成 dramame.ai 和 your-relationship-reading.dramame.ai 的 Worker Custom Domain 绑定。原记录备份见 artifacts/v2-review/domain-dns-backup.json。其他导入记录保留。

wrangler.jsonc 持久保存两个绑定，并明确 workers_dev=true，PUBLIC_URL=https://dramame.ai 用于报告分享链接及二维码。发布版本 7611bed1-9ee0-480e-a723-0d6d95b5e776，启动 2ms，无新素材上传。Cloudflare API 和正式域名列表均确认两个主机名已绑定到 your-relationship-reading-v2，原 workers.dev 地址保留。

当前 Cloudflare zone 状态仍为 pending，GoDaddy 的服务器更新正在传播，已触发 Cloudflare 检测。新域名的 HTTPS 尚未通过，不能视为已公网验收。绑定记录和检查结果位于 artifacts/v2-review/domain。DNS 激活及证书签发后应再次在两个 HTTPS 主机名核验入口、API、完整答题、报告和分享图。

域名绑定后原 workers.dev 实际完成20题、报告和分享SVG生成已通过；返回的分享链接确认为 https://dramame.ai/?from=report。最终公网查询仍返回 GoDaddy NS，根域名仍加载原网站，游戏子域名 TLS 握手未完成。这是当前新域名未通过访问验收的具体状态，并非游戏 Worker 或额度故障。结果见 domain/verification.json。
