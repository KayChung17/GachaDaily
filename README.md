<p align="center">
  <img src="./frontend/public/img/title.png" alt="Gacha Daily" width="200" />
</p>
<h1 align="center">Gacha Daily</h1>

基于 RSS-pixiv 订阅的抽卡体验，把日常任务做成「任务清单 + 抽卡」应用。

## 新架构（Vue 3 + FastAPI）

```text
GachaDaily/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/routes/         # 路由层
│   │   ├── core/               # 配置层
│   │   ├── schemas/            # Pydantic 模型
│   │   ├── services/           # 业务服务
│   │   └── main.py             # 应用入口
│   ├── data/                   # 持久化数据（sync_data.json）
│   ├── .env.example
│   └── requirements.txt
├── frontend/                   # Vue3 + Vite 前端
│   ├── public/img/             # 静态图片资源
│   ├── src/
│   │   ├── assets/styles.css   # 样式
│   │   ├── components/         # Vue 页面与通用组件
│   │   ├── composables/        # 业务逻辑与状态管理
│   │   ├── store/              # 应用级状态注入入口
│   │   ├── types/              # 前端领域模型与 API 类型
│   │   ├── App.vue
│   │   └── main.ts
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── legacy/                     # 原始单页实现备份
└── start.sh                    # 一键并行启动前后端
```

## 后端 API

- `GET /api/rss`：RSS 代理（可通过 `?url=` 临时覆盖目标 URL）
- `GET /api/sync`：拉取同步数据
- `PUT /api/sync`：上传同步数据
- `GET /healthz`：健康检查

## 本地开发

1. 安装后端依赖

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

2. 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

3. 启动（推荐）

```bash
./start.sh
```

默认地址：
- 前端：`http://localhost:5175`
- 后端：`http://127.0.0.1:8056`

## 环境变量

后端支持：
- `SYNC_DATA_PATH`
- `RSS_TARGET_URL`
- `CORS_ORIGINS`
- `API_HOST` / `API_PORT`

前端支持：
- `VITE_API_BASE_URL`（可选；本地默认直连 `http://127.0.0.1:8056`）
