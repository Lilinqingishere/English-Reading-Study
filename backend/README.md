# English Reading Academy Backend

FastAPI 后端，覆盖阅读分析、文章、收藏、生词本、FSRS 复习和个人统计接口。

## 1. 本地启动

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

访问：

- `GET http://localhost:8000/healthz`
- `GET http://localhost:8000/docs`

初始化阅读拓展真实来源文章：

```powershell
python -m app.services.seed
```

联调前检查数据库质量：

```powershell
python scripts\check_db_quality.py
```

该脚本会检查当前 `DB_URL` 指向的数据库是否满足联调门槛：

- SQLite 外键是否启用
- `busy_timeout` 是否生效
- 核心表是否存在
- 常用复合索引是否补齐
- 阅读拓展文章是否带真实来源字段
- 文章详情依赖的核心词和长难句是否存在

## 2. 当前已实现接口

### `GET /healthz`

用于后端健康检查。

响应示例：

```json
{
  "status": "ok",
  "appName": "English Reading Academy",
  "env": "dev",
  "modelName": "qwen-turbo",
  "databaseReady": true
}
```

### `GET /api/stats`

用于个人中心统计卡片。

响应字段统一使用 camelCase，方便 React 直接消费。

```json
{
  "totalStudyTimeSeconds": 0,
  "streakDays": 0,
  "totalArticlesAnalyzed": 0,
  "collectedArticleCount": 0,
  "totalVocabCount": 0,
  "lastStudyDate": null
}
```

### `POST /api/stats/study-time`

用于前端定期上报学习时长。

请求：

```json
{
  "seconds": 1
}
```

约束：

- `seconds > 0`
- `seconds <= 3600`

响应：同 `GET /api/stats`。

### `POST /api/analyze`

用于阅读分析的非流式降级接口。前端 S2 可先接这个接口，S3 再升级
`POST /api/analyze/stream`。

请求：

```json
{
  "text": "Transportation is estimated to account for ...",
  "hintDifficulty": "CET6"
}
```

约束：

- `text` 长度：1 到 8000 字符
- `hintDifficulty` 可选：`CET4` / `CET6` / `IELTS`
- 后端内部使用 snake_case，API 出口统一 camelCase

响应示例：

```json
{
  "articleId": "analysis_xxx",
  "title": "城市交通与可持续",
  "difficulty": "CET6",
  "wordCount": 42,
  "originalText": "Transportation is estimated ...",
  "translation": "据估计，交通运输……",
  "coreVocabulary": [
    {
      "id": "vocab_xxx",
      "word": "sustainable",
      "phonetic": "/səˈsteɪnəbl/",
      "translation": "可持续的",
      "exampleEn": "Sustainable energy is important.",
      "exampleZh": "可持续能源很重要。"
    }
  ],
  "longSentences": [
    {
      "id": "sentence_xxx",
      "english": "Transportation is estimated ...",
      "chinese": "据估计……",
      "analysis": "主语 Transportation，谓语 is estimated..."
    }
  ],
  "tokensUsed": 1200,
  "durationMs": 3200,
  "analysisModel": "qwen-turbo"
}
```

如果没有配置 `DASHSCOPE_API_KEY`，接口会返回：

```json
{
  "detail": "模型服务未配置，请先在后端 .env 中设置 DASHSCOPE_API_KEY"
}
```

### 真实模型 smoke test

配置 `.env` 后，可以先运行最小 smoke test，确认 DashScope Key、模型权限、Prompt
和 JSON 解析链路全部可用：

```powershell
python scripts\smoke_analyze.py
```

成功时只输出结构化摘要，不输出 API Key 或完整模型内容：

```json
{
  "title": "每日阅读提升词汇和理解力",
  "difficulty": "CET4",
  "wordCount": 13,
  "vocabCount": 5,
  "sentenceCount": 1,
  "tokensUsed": 895,
  "durationMs": 4032,
  "analysisModel": "qwen-turbo"
}
```

如果返回 `statusCode=403`，通常表示当前 Key 未开通或无权访问 `MODEL_NAME`
指定的模型，需要到阿里云百炼控制台确认模型权限。

### `POST /api/analyze/stream`

SSE 假流式阅读分析接口。当前实现先完成一次非流式模型分析，再按固定事件顺序推送，
便于前端先实现流式 UI，后续再升级为真正边生成边解析。

事件顺序：

1. `meta`
2. `translation`
3. `vocab`
4. `sentence`
5. `done`

### `GET /api/articles`

获取阅读拓展文章或收藏文章。

查询参数：

- `difficulty`: `CET4` / `CET6` / `IELTS`
- `collected`: `true` 时获取收藏文章；不传时默认获取阅读拓展文章
- `limit`: 1 到 100
- `offset`: 分页偏移

### `GET /api/articles/{articleId}`

获取文章详情，包含原文、译文、核心词汇、长难句，以及真实来源追踪字段：

- `sourceName`
- `sourceUrl`
- `sourceLicense`
- `attributionText`
- `analysisModel`

### `POST /api/articles/{articleId}/collect`

收藏或取消收藏文章。

```json
{
  "isCollected": true
}
```

### `GET /api/vocab`

获取生词本列表。

### `POST /api/vocab`

加入或重新加入生词本。

```json
{
  "word": "sustainable",
  "phonetic": "/səˈsteɪnəbl/",
  "translation": "可持续的",
  "exampleEn": "Sustainable transport matters.",
  "exampleZh": "可持续交通很重要。",
  "sourceArticleId": "article_xxx"
}
```

### `DELETE /api/vocab/{vocabId}`

移出生词本。后端使用软删除，保留复习历史，方便未来 FSRS 参数优化。

### `GET /api/review/today`

获取今日复习队列。`nextReviewAt` 为空的新词会自动进入今日队列。

### `POST /api/review/{vocabId}`

提交 FSRS 四档反馈。

```json
{
  "rating": "good"
}
```

`rating` 可选：`again` / `hard` / `good` / `easy`。

## 3. 前端对接说明

前端开发环境建议在 `vite.config.ts` 增加代理：

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8000', changeOrigin: true },
  },
}
```

当前可先把 `Layout.tsx` 的本地 `addStudyTime(1)` 后续替换为调用：

```ts
POST /api/stats/study-time
{ "seconds": 1 }
```

## 4. 数据库

默认 SQLite 文件：`backend/data/app.db`。

启动时会自动：

1. 创建表结构
2. 初始化 `demo_user(id=1)`
3. 初始化 `user_stats(user_id=1)`
4. 开启 SQLite WAL 模式

数据库文件已被根目录 `.gitignore` 排除，不要提交。

当前 SQLite 运行参数：

- `journal_mode=WAL`
- `synchronous=NORMAL`
- `busy_timeout=5000`
- `foreign_keys=ON`

这些设置用于提升本地演示时的读写并发稳定性，并尽早暴露外键顺序问题。

## 5. 质量与可观测性

后端已补充以下质量加固：

- 请求级 `X-Trace-Id`，响应头会回传同一个 trace id。
- `structlog` 结构化日志会绑定 `trace_id / method / path / duration_ms`。
- 全局异常处理：
  - 请求校验失败：`422`
  - 数据约束冲突：`409`
  - 数据库不可用：`503`
  - 未预期错误：`500`
- `/healthz` 会执行真实数据库探活。
- DashScope 调用包含超时、重试、权限错误映射。
- 模型 JSON 输出使用 Pydantic schema 严格校验。
- 请求输入会 strip 后校验，避免纯空格脏数据。
- 请求作用域数据库会话遇到数据库异常会 rollback，避免污染后续请求。
- 生词来源文章会先做业务校验，避免把外键异常暴露成 500。
- Seed 数据会校验来源白名单、禁止来源、必填字段、重复 URL 和详情依赖数据。
- 当前内置阅读拓展 seed 已扩充到 9 篇 Project Gutenberg 公版片段，覆盖 `CET4 / CET6 / IELTS`。

真实阅读拓展来源清单样例位于：

```text
backend/data/seeds/reading_sources.sample.json
```

该文件只保存可公开的来源元数据，不保存密钥，也不保存演示数据库文件。

## 6. 测试

```powershell
python -m pytest -q
python scripts\check_db_quality.py
python -c "import compileall, sys; ok=compileall.compile_dir('.', quiet=1); print('compileall', ok); sys.exit(0 if ok else 1)"
```
