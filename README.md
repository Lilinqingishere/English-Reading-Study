# English Reading Academy

> 专为四六级与雅思备考者打造的极简英语阅读分析平台

## 🌐 在线访问

**(http://120.55.96.7/English-Reading-Study/analysis)/)**

## ✨ 功能介绍

- **阅读分析**：输入英文段落，获取中英对照、核心词汇解析、长难句拆解
- **阅读拓展**：精选外刊文章，涵盖科技、环境、社会等多个领域
- **词汇复习**：生词本功能，基于 FSRS 间隔重复算法智能排期

## 🛠 技术栈

- **前端框架**：React + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **状态管理**：Zustand
- **部署**：GitHub Pages + GitHub Actions

## 🚀 本地运行

```bash
git clone https://github.com/Lilinqingishere/English-Reading-Study.git
cd English-Reading-Study
npm install
npm run dev
```

## 🔗 本地前后端联调

在 `backend/` 目录执行：

```powershell
pip install -r requirements.txt
python -m app.services.seed
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

在项目根目录执行：

```powershell
npm install
$env:VITE_BACKEND_URL = "http://127.0.0.1:8001"
npm run dev
```

前端会通过 Vite `/api` 代理访问后端，避免浏览器跨域问题。
