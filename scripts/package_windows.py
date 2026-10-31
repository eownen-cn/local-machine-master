from pathlib import Path
import re, zipfile
root=Path(__file__).resolve().parents[1]
dist=root/'dist'; target=root/'build-windows';target.mkdir(exist_ok=True)
html=(dist/'index.html').read_text()
html=re.sub(r'<script type="module" crossorigin src="([^"]+)"></script>',lambda m:'<script type="module">'+(dist/m[1].lstrip('/')).read_text().replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'<link rel="stylesheet" crossorigin href="([^"]+)">',lambda m:'<style>'+(dist/m[1].lstrip('/')).read_text()+'</style>',html)
html=re.sub(r'<link rel="manifest"[^>]*>|<script id="vite-plugin-pwa:register-sw"[^>]*></script>','',html)
(target/'EnglishGrove.html').write_text(html)
(target/'Start.ps1').write_text((root/'scripts/Start.ps1').read_text(),encoding='utf-8-sig')
(target/'Start.cmd').write_bytes(b'@echo off\r\ncd /d "%~dp0"\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start.ps1"\r\npause\r\n')
(target/'使用说明.txt').write_text('''拾语 English Grove 0.2 — Windows 局域网学习版

1. 解压整个 ZIP。升级时解压到新文件夹，再将旧版本的 grove-data 文件夹复制过来（若存在），先保留备份。不要覆盖运行中的服务。
2. 双击 Start.cmd，Windows 自带 PowerShell 即可启动，不需要安装 Node.js。浏览器自动打开。窗口显示本机地址、局域网地址和随机配对码。
3. 手机和平板连接同一个可信家庭 Wi-Fi，打开窗口显示的 http://电脑IPv4地址:5173 。不要在手机上输入 localhost。Windows 防火墙如提示，仅允许专用网络。访客 Wi-Fi、VPN、AP 隔离可能阻止访问。
4. 每台设备点右上角 L → 输入配对码 → 连接并同步。保持电脑窗口开启。连接后约每 10 秒合并课程、生词、错题、复习、个人文字教材和草稿。重启服务后需要新的配对码。请不要把端口暴露到公网；本版没有独立用户账号。
5. 数据保存在服务器所在文件夹的 grove-data/learning.json；个人音频只存在各自浏览器。建议定期在设置导出完整学习备份。

内容：成长路径包含 8 个原创分级单元 × 4 种练习；A2、B1、B2、雅思阅读策略各 2 单元。首页仍保留第一版体验课与旧进度；新版课程进度和统计在成长路径与学习足迹。
功能：分句/变速/英美语音/循环、听写、阅读解析、翻译草稿自查、语法微课、生词本、自动错题、独立复习调度、个人课程 JSON 导入、个人音频导入、数据合并备份、局域网共享同步。

边界：课程均为原创，不包含新概念原文或 BBC/NPR/VOA 转载，广播提供官方来源。合成语音取决于设备英语语音，不是真人音频。IELTS 是策略入门而非官方模拟考试，无雅思分数预测，无口语/写作自动评分。HTTP 局域网版不验证 PWA 安装；完整 PWA 构建位于源码项目中，需 HTTPS 部署。网页和共享 API 已在 Linux Chromium 与 Node 服务测试，Windows 启动方式与 iOS/Android 音频仍需实际设备验收；如系统限制 PowerShell，请保留报错文字反馈。

遇到问题：端口占用请先关闭旧窗口。进度不同步先检查所有设备都连接同一台电脑的地址、配对码与服务窗口；数据仍在本机，重新点同步可合并。未连接服务时可单机使用，或用完整备份文件手动迁移。
''',encoding='utf-8-sig')
(root/'downloads').mkdir(exist_ok=True)
with zipfile.ZipFile(root/'downloads/EnglishGrove-Windows.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['EnglishGrove.html','Start.ps1','Start.cmd','使用说明.txt']: z.write(target/name,'EnglishGrove-Windows/'+name)
print('Created downloads/EnglishGrove-Windows.zip')
