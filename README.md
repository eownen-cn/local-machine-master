# 拾语 · English Grove 0.2

保持第一版的自然绿色、轻量学习界面，提供电脑、手机和平板自适应英语学习。A2 → B1 → B2 → 雅思阅读策略入门。

## Windows 下载即测

下载仓库 `downloads/EnglishGrove-Windows.zip`，解压后双击 `Start.cmd`。不需要 Node.js 或 Python。窗口显示局域网地址与配对码；手机、平板连接同一可信 Wi-Fi，用浏览器打开该地址。

每台设备在右上角 L → 设置中填写配对码，点击“连接并同步”。电脑须保持运行，之后约每 10 秒合并一次学习记录。关闭窗口后服务停止；每次重启配对码变化。Windows 防火墙只允许可信的专用网络。访客 Wi-Fi、VPN 或路由器设备隔离可能阻止访问。

这是单一共享学习档案、配对码保护的家庭局域网服务，不是公网账号系统。不要把 HTTP 端口暴露到公网。服务器持久数据位于包目录 `grove-data/learning.json`，上一版保存在浏览器里的首页体验课数据继续保留。升级前保留旧目录，将已有的 `grove-data` 复制到新版目录，或在设置导出/导入完整备份。

## 已实现

- 8 个原创分级单元（A2 / B1 / B2 / IELTS 策略各 2 个），每单元听、读、译、语法共 **32 节**。
- 分句合成朗读、英美口音、语速、单句循环、全文朗读、逐句听写对照；系统声音由设备提供。
- 阅读选择题逐题解析、错误重试、翻译草稿保存与参考自查、碎片语法。
- 自动错题本、生词收藏/手工录入、每张卡片独立到期安排与间隔增长。
- 可见且有焦点时计时，完成课程后保存实际专注时间、七日统计与学习历史。首页旧体验课估算分钟不混入新版统计。
- 个人文字教材 JSON 模板下载、结构校验与导入/删除。个人音频存入设备 IndexedDB（最大 50 MB），支持原生播放器。
- 完整新版学习档案 JSON 备份/合并；按记录时间合并，保留删除标记，支持离线修改后重连。
- Node 和 PowerShell 两种局域网服务，配对码校验、请求体上限、来源检查、原子持久化；同一档案跨设备同步。
- 生产 PWA 应用壳离线缓存。局域网 Windows 单文件包不注册 PWA；安装与 HTTPS 离线能力需使用完整生产构建。

## 开发与构建

Node.js 22.18+（已在 Node 24 验证）：

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
npm run serve:lan
```

`serve:lan` 运行完整 dist，同时提供共享 API。数据默认 `.grove-data/learning.json`。可用 `PORT`、`GROVE_DATA_DIR` 指定端口及数据目录；配对码默认随机生成。服务均需每次启动，不能依赖环境发布保留进程。

重新打包 Windows 版（仅构建阶段需要 Python 3）：

```sh
npm run build
npm run package:windows
```

```sh
node scripts/test-server.mjs
node scripts/test-cross-device.mjs
```

PowerShell Core 可用时，设置 `PWSH` 为其可执行文件路径，再对两条命令添加 `--powershell` 验证 Windows 包同一服务脚本。Playwright 默认 Linux 系统 Chromium；可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定本机浏览器，或安装 Playwright Chromium 后使用默认浏览器路径。

## 验证边界

自动检查包含内容结构、合并与复习逻辑、电脑/平板/手机视口、32 节课程交互、草稿/导入/错题/复习、PWA 离线应用壳及两个独立浏览器的双向共享流程。Node 和 PowerShell 服务均在 Linux 环境实跑；PowerShell Core 运行的是与下载包相同的脚本，但 Windows 自带 PowerShell 5.1 启动链、Windows 防火墙和 iOS/Android 声音仍需真机验收。听力可在无声音环境通过原文与题目测试，但这不等于验证真人听感。

## 内容与后续接入

这是一个有明确范围的学习版本，不是覆盖所有雅思课程的完成品。新概念用于学习路线参考，没有转载教材原文/音频；课程均为原创。BBC / VOA / NPR 链接到官方来源，无隶属关系。

尚未接入：公网独立账号与云数据库、授权新概念课程及广播音频、AI 译文点评、口语与写作评分、官方雅思模考。当前翻译为参考自查，小测不输出正式 CEFR 或雅思分数。公网账号服务需要实际托管及凭据，授权内容需要相应素材，不能用模拟数据冒充完成。
