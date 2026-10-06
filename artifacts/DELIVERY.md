# v7 交付与发布核验

完成单人30幕轻游戏、12型人格报告与分享带新流程，选答后直接推进，仅终局解读。

本轮修订：
- 上一题可回退，保留后续选择，原选择轻标记，修改覆盖；首幕返回入口可续同路线，报告可返回改答。
- 生育题替换为大扫除分工与搬家档期；旧Q25提交及待提交答案强制重答，其余29条保留。
- 8张built-in imagegen Galgame二次元画稿，3:2完整展示，人物/手机/纸/手跨格。封面+7氛围板映射30题，关键事实图下HTML。
- 回看和再答题不参与速度分类，最终报告及分享按最新答案计算，旧AI响应不能覆盖新答卷。

22项自动测试PASS；完整两路线浏览器QA PASS。三位专家最终PASS：reviews/game-experience-v7-round1.md、relationship-v7-round1.md、mobile-v7-round1.md。

移动独立实测四宽度×两路线240幕、24组双击、报告改答分享同步、刷新、全部8图离线缓存、旧v4/v6迁移与未提交Q25选择失效。探针见reviews/mobile-v7-*.json/mjs。内容四组合与导航独立审查见reviews/v7-content-audit.mjs及v7-navigation-audit.mjs。

npm run build生成dist；node scripts/audit-v7.mjs核对源文件与生产输出、8画稿、60案例及三位PASS。12型可达性来自合法合成答卷，不是人群样本验证。

按用户授权推送liangjw/your_relationship_reading并部署Cloudflare Workers静态资源，配置wrangler.jsonc；线上地址和版本见DEPLOYMENT.md。

可选AI服务与微信SDK签名未启用，当前本地计算报告和保存分享卡完整可用。真实微信真机与菜单分享签名仍需后续接入验收。
