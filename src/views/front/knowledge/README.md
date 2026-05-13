# 知识库管理功能说明

## 功能概述

极简版知识库管理系统，支持创建知识库、上传文档和智能问答。

## 文件结构

```
src/
├── api/
│   └── knowledge.js              # API 接口定义
├── views/
│   └── front/
│       └── knowledge/
│           ├── index.vue         # 知识库列表页
│           ├── upload.vue        # 文档上传页
│           └── qa.vue            # 问答页面
└── router/
    └── index.js                  # 已添加路由配置
```

## 访问路径

- 知识库列表：`/front/knowledge`
- 上传文档：`/front/knowledge/upload/:id`
- 知识库问答：`/front/knowledge/qa/:id`

## 主要功能

### 1. 知识库列表页 (index.vue)
- ✅ 展示所有知识库（名称、描述、文档数量）
- ✅ 新建知识库（弹窗输入名称和描述）
- ✅ 每个知识库提供"上传文档"和"问答"按钮

### 2. 文档上传页 (upload.vue)
- ✅ 拖拽或点击上传文件
- ✅ 支持格式：.pdf, .docx, .txt, .md
- ✅ 文件大小限制：50MB
- ✅ 上传成功后自动解析文档
- ✅ 显示解析状态和分块数量
- ✅ 解析完成后可跳转到问答页面

### 3. 问答页面 (qa.vue)
- ✅ 聊天式界面（上方历史，下方输入）
- ✅ 支持普通模式（POST /rag/ask）
- ✅ 支持流式模式（EventSource 实时输出）
- ✅ Ctrl+Enter 快捷发送
- ✅ 自动滚动到底部

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/test/rag/list` | GET | 获取知识库列表 |
| `/test/rag/create` | POST | 创建知识库 |
| `/rag/document/upload` | POST | 上传文档 |
| `/rag/document/parse/{id}` | POST | 解析文档 |
| `/rag/ask` | POST | 普通问答 |
| `/rag/ask/stream` | GET | 流式问答 |

## 注意事项

1. **userId 固定为 1**：由于项目还未完善登录用户获取，暂时硬编码传 `userId: 1`
2. **Token 认证**：上传文档时会自动从 localStorage 获取 `Admin-Token`
3. **环境变量**：确保 `.env` 文件中配置了 `VITE_APP_BASE_API`
4. **流式输出**：默认开启，可在问答页面取消勾选

## 快速开始

1. 启动项目：`pnpm run dev`
2. 访问：`http://localhost:8080/front/knowledge`
3. 创建知识库 → 上传文档 → 开始问答

## 技术栈

- Vue 3 + Composition API
- Element Plus UI 组件库
- Vue Router 路由管理
- EventSource 流式数据传输
