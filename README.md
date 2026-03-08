<p align="center">
<img src="https://github.com/KayChung17/GachaDaily/blob/main/img/title.png" alt="Gacha Daily" width="200">
</p>
<h1 align="center">Gacha Daily</h1>

基于RSS订阅的抽卡体验，让枯燥的日常任务变成二游日活
一个本地运行的「任务清单 + 抽卡」网页应用。  

## 界面

<img src="https://github.com/KayChung17/GachaDaily/blob/main/img/demo_1.png" width="200" height="150"><img src="https://github.com/KayChung17/GachaDaily/blob/main/img/demo_5.png" width="200" height="150">

<img src="https://github.com/KayChung17/GachaDaily/blob/main/img/demo_2.png" width="200" height="150"><img src="https://github.com/KayChung17/GachaDaily/blob/main/img/demo_3.png" width="200" height="150">

<img src="https://github.com/KayChung17/GachaDaily/blob/main/img/demo_4.png" width="200" height="150">

## 本机运行

1. 启动前端：

```powershell
python -m http.server 3000 # 端口可自定义
```

2. 浏览器打开页面

```text
http://localhost:3000
```

3. （可选）启动 RSS 代理：

```powershell
$env:RSS_TARGET_URL="<你的RSS链接>"
$env:RSS_PROXY_PORT="8787"
python rss_proxy.py
```

4. （可选）启动同步服务：

```powershell
$env:SYNC_PORT="8788"
$env:SYNC_TOKEN="<你的同步令牌>"
$env:SYNC_ALLOW_ORIGIN="http://localhost:3000"
python sync_server.py
```

## TODO

- [ ] 卡池自定义稀有度
- [ ] 统一UI设计(AI还是少点意思）
- [ ] 取消对RSS的依赖，用其他途径爬取图片
