# OpenStudy - 开放学习平台

## 项目简介

OpenStudy 是一个追求**开源、灵活、自由度高**的在线学习平台，致力于为在校学生打造一个高效、专注、个性化的自主学习环境。系统深度集成 AI 能力，降低学习门槛，采用**若依前后端分离框架**作为基础架构，前端使用 Vue3 + Vite 构建。

### 核心特性

- **开源透明**：代码开放，架构清晰，便于二次开发
- **高自由度**：模块化设计，功能可插拔，灵活扩展
- **AI 集成**：深度融合大模型能力，支持智能问答、OCR 识别、AI 出题等
- **低门槛设计**：简洁易用的界面，降低用户学习成本

### 技术选型

| 层级 | 技术栈 | 版本 |
|------|--------|------|
| 后端框架 | Spring Boot 3 | 3.5.11 |
| 安全框架 | Spring Security | 6.x |
| ORM | MyBatis-Plus | 3.0.5 |
| 分页 | PageHelper | 2.1.1 |
| 前端框架 | Vue 3 + Composition API | 3.4.0 |
| 构建工具 | Vite | 5.0.4 |
| UI 组件 | Element Plus | 2.13.7 |
| 状态管理 | Pinia | 2.1.7 |
| 路由 | Vue Router | 4.2.5 |
| 样式 | SCSS | 1.69.5 |

### 未来规划

- **Redis Stack 向量化**：计划引入 Redis Stack 实现全文检索和向量相似度匹配，增强 RAG 能力

---

## 项目结构

```
d:\OpenStudy\
├── .vscode/                      # VSCode 配置
├── logs/                         # 日志文件
├── openstudy-server-springboot3/  # 后端项目（Spring Boot 3）
│   ├── openstudy-admin/          # 主应用模块
│   │   └── src/main/java/com/openstudy/
│   │       ├── ai/               # AI 模块（RAG、问答、出题）
│   │       ├── carousel/         # 轮播图模块
│   │       ├── courses/          # 课程模块
│   │       ├── favoriteBank/     # 收藏题库模块
│   │       ├── favoriteQuestion/  # 收藏题目模块
│   │       ├── noteCategory/      # 笔记分类模块
│   │       ├── noteImage/         # 笔记图片模块
│   │       ├── notes/             # 笔记模块
│   │       ├── ocr/               # OCR 识别模块
│   │       ├── questionBank/      # 题库模块
│   │       ├── questionError/     # 错题模块
│   │       ├── questionMain/       # 题目模块
│   │       ├── questionMarked/     # 标记题目模块
│   │       ├── sensitiveWord/      # 敏感词模块
│   │       ├── system/             # 系统模块（用户、角色、字典）
│   │       └── web/                # Web 层（通用上传、监控）
│   ├── openstudy-common/         # 通用模块
│   ├── openstudy-framework/      # 框架模块
│   ├── openstudy-generator/      # 代码生成器
│   ├── openstudy-quartz/         # 定时任务模块
│   ├── openstudy-system/          # 系统模块（若依原有）
│   └── sql/                      # SQL 脚本
│
└── openstudy-vue3/               # 前端项目（Vue 3）
    ├── src/
    │   ├── api/                  # API 接口定义
    │   │   ├── ai/               # AI 相关接口
    │   │   ├── carousel/          # 轮播图接口
    │   │   ├── english/           # 英语学习接口
    │   │   ├── favoriteBank/      # 收藏题库接口
    │   │   ├── favoriteQuestion/  # 收藏题目接口
    │   │   ├── knowledge/        # 知识库接口
    │   │   ├── notes/            # 笔记接口
    │   │   ├── questionBank/     # 题库接口
    │   │   ├── questionError/    # 错题接口
    │   │   ├── questionMain/      # 题目接口
    │   │   ├── questionMarked/    # 标记题目接口
    │   │   ├── system/           # 系统接口（用户、角色、字典）
    │   │   ├── wordBooks/         # 单词本接口
    │   │   ├── words/             # 单词接口
    │   │   └── ...
    │   ├── assets/               # 静态资源
    │   ├── components/           # 公共组件
    │   │   ├── AiAssistant/      # AI 悬浮助手
    │   │   ├── CommentSection/    # 评论组件
    │   │   ├── Dictation/         # 听写组件
    │   │   ├── ImageUpload/       # 图片上传组件
    │   │   ├── MyQuestion/        # 题目管理组件
    │   │   ├── OcrRecognizer/     # OCR 识别组件
    │   │   ├── PracticeComponent/ # 练习组件
    │   │   └── ...
    │   ├── composables/          # 组合式函数
    │   ├── directive/            # 自定义指令
    │   ├── layout/               # 布局组件
    │   │   ├── front.vue         # 前台布局（keep-alive）
    │   │   └── index.vue          # 后台布局
    │   ├── plugins/              # 插件配置
    │   ├── router/               # 路由配置
    │   ├── store/                # Pinia 状态管理
    │   │   └── modules/
    │   │       ├── frontPageCache.js  # 前台页面缓存
    │   │       ├── user.js            # 用户状态
    │   │       ├── permission.js      # 权限状态
    │   │       └── ...
    │   ├── utils/                # 工具函数
    │   │   ├── request.js        # Axios 封装
    │   │   ├── permission.js     # 权限判断
    │   │   ├── auth.js           # 认证工具
    │   │   └── ...
    │   └── views/
    │       ├── front/            # 前台页面
    │       │   ├── english/      # 英语学习
    │       │   ├── knowledge/    # 知识库
    │       │   ├── myQuestion/   # 我的题目
    │       │   ├── notes/        # 学习分享
    │       │   └── studio/       # 工作室
    │       └── admin/            # 后台页面
    ├── .env.development         # 开发环境变量
    └── package.json
```

---

## 环境配置

### 前端环境变量 (.env.development)

```bash
VITE_APP_BASE_API=http://localhost:8080
VITE_PORT=8081
```

### 后端配置 (application.yml)

```yaml
ruoyi:
  name: RuoYi
  version: 3.9.2
  copyrightYear: 2026
  profile: D:/ruoyi/uploadPath  # 文件上传路径

ai:
  default-provider: zhipuai
  fallback-provider: deepseek
  providers:
    zhipuai:
      name: 智谱AI
      model: glm-4-plus
      enabled: true
    deepseek:
      name: DeepSeek
      model: deepseek-chat
      enabled: true
```

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 8081 | Vue Dev Server |
| 后端 | 8080 | Spring Boot |
| Redis | 6379 | 缓存、向量化（规划） |

---

## 快速开始

### 安装依赖

```bash
# 前端
cd openstudy-vue3
pnpm install

# 后端（使用 Maven）
cd openstudy-server-springboot3
mvn clean install
```

### 启动项目

```bash
# 前端开发模式
cd openstudy-vue3
pnpm run dev

# 后端启动（IDE 中运行或使用 mvn spring-boot:run）
```

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 普通用户 | common | 123456 |

---

## ⚠️ 重要开发规范（AI 必读）

### 1. 若依框架 API 响应格式 ⚠️

本系统后端接口遵循若依框架规范，**不同类型接口返回格式不同**：

#### 分页列表接口（TableDataInfo）

```json
{
  "code": 200,
  "rows": [...],
  "total": 100
}
```

**前端取值**：`res.rows`、`res.total`

#### 详情/非分页接口（AjaxResult）

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

**前端取值**：`res.data`

#### 判断规则

| Controller 返回类型 | 取值方式 |
|---------------------|----------|
| `TableDataInfo` 或调用 `startPage()` | `res.rows` |
| `AjaxResult` | `res.data` |
| `AjaxResult.success(pageInfo)` | `res.data.list`（PageHelper） |

#### 常见错误

```javascript
// ❌ 错误：分页接口数据在 res.rows，不是 res.data
const notes = res.data || []

// ✅ 正确：分页接口
const notes = res.rows || []

// ⚠️ 注意：评论接口返回的是 res.data.list（PageHelper）
const commentList = res.data?.list || []
```

---

### 2. 用户信息获取规范

#### 正确方式

```javascript
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()

// 获取用户 ID（兼容多种字段名）
const userId = userStore.id || userStore.userId || userStore.user_id

// 获取用户名
const userName = userStore.name

// 获取头像（自动处理路径前缀）
const avatar = userStore.avatar
```

#### 用户信息字段说明

| Pinia 字段 | 说明 |
|-----------|------|
| `id` | 用户 ID |
| `name` | 用户名 |
| `avatar` | 头像 URL（已拼接前缀） |
| `roles` | 角色数组 |
| `permissions` | 权限标识数组 |
| `token` | 登录令牌 |

#### ⚠️ 重要：传递 userId 到后端

**凡是调用需要用户个人配置的 API（如 AI 接口调用用户的自定义 API Key），必须传递 `userId`**：

```javascript
// ✅ 正确：传递 userId，后端能获取用户配置的 AI key
const res = await generateQuestionsSync({
  knowledgePoint: 'Java 线程',
  questionType: 'single',
  count: 3,
  provider: 'deepseek',
  userId: userStore.id  // 必须传递！
})

// ❌ 错误：不传 userId，后端只能获取到 userId=0，导致使用配置文件中的无效 key
const res = await generateQuestionsSync({
  knowledgePoint: 'Java 线程',
  questionType: 'single',
  count: 3,
  provider: 'deepseek'
  // 缺少 userId！
})
```

**常见需要传 userId 的场景**：
- AI 出题接口
- AI 聊天接口
- 任何需要用户个人 AI 配置的接口

---

### 3. 图片上传与路径处理规范

#### ImageUpload 组件使用

```vue
<template>
  <ImageUpload v-model="imageUrl" :limit="3" :fileSize="5" />
</template>

<script setup>
import ImageUpload from '@/components/ImageUpload/index.vue'
const imageUrl = ref('')
</script>
```

#### 路径前缀处理规则

**上传时**：组件自动处理，存储时**不带前缀**

**展示时**：组件内部自动拼接 `VITE_APP_BASE_API` 前缀

**手动处理图片路径**：

```javascript
const baseUrl = import.meta.env.VITE_APP_BASE_API

// 存储时：移除前缀
const pathToSave = imageUrl.replace(baseUrl, '')

// 展示时：确保有前缀
const pathToShow = imageUrl.includes(baseUrl) ? imageUrl : baseUrl + imageUrl
```

---

### 4. 前端页面缓存规范（keep-alive + Pinia）

#### 核心问题

使用 `keep-alive` 缓存的组件，当路由参数变化时，`onMounted` 不会重新执行，需要同时使用 `onActivated` 和 `watch`。

#### 标准模板（带参数路由）

```javascript
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const detailData = ref({})

const fetchData = async () => {
    const id = route.params.id
    if (!id) return
    const res = await getDetail(id)
    detailData.value = res.data || {}
}

onMounted(() => {
    fetchData()
})

onActivated(() => {
    const newId = route.params.id
    if (!newId) return
    if (detailData.value.id !== Number(newId)) {
        fetchData()
    }
})

// ⚠️ 同一页面内参数变化（如上下篇导航）
watch(() => route.params.id, (newId, oldId) => {
    if (newId && newId !== oldId) {
        fetchData()
    }
})
```

#### 三个钩子分工

| 钩子 | 触发场景 |
|------|----------|
| `onMounted` | 首次进入页面 |
| `onActivated` | 从其他模块切换回来（keep-alive 恢复） |
| `watch route.params.id` | 同一页面内参数变化（上下篇切换） |

#### 已应用此方案的页面

- `src/views/front/notes/detail.vue` - 笔记详情
- `src/views/front/english/vocabulary/detail.vue` - 词库详情
- `src/views/front/knowledge/docs.vue` - 知识库文档

---

### 5. 防重复提交规范

#### Axios 请求拦截器自动处理

`request.js` 已实现防重复提交机制：

```javascript
// 同一请求 1 秒内重复提交会被拦截
const interval = 1000
if (s_data === requestObj.data && requestObj.time - s_time < interval) {
    return Promise.reject(new Error('数据正在处理，请勿重复提交'))
}
```

#### 手动禁用防重复提交

```javascript
// 在特定接口中禁用
export function someAction(data) {
  return request({
    url: '/some/action',
    headers: {
      repeatSubmit: false  // 禁用防重复提交
    },
    method: 'post',
    data: data
  })
}
```

---

### 6. 权限判断规范

#### 角色权限判断

```javascript
import { checkRole } from '@/utils/permission'

const isAdmin = computed(() => checkRole(['admin']))
const isUser = computed(() => checkRole(['admin', 'common']))
```

#### 操作权限判断

```javascript
import { checkPermi } from '@/utils/permission'

const canEdit = computed(() => checkPermi(['system:user:edit']))
```

#### 模板中使用

```vue
<!-- 角色控制 -->
<el-button v-hasRole="['admin']">仅管理员可见</el-button>

<!-- 权限控制 -->
<el-button v-hasPermi="['system:user:add']">添加用户</el-button>
```

---

### 7. 样式规范 ⚠️

#### 核心原则

| 原则 | 说明 |
|------|------|
| 背景颜色 | 与 `front.vue` 整体背景保持一致，不额外加灰色背景 |
| 按钮颜色 | 普通按钮白底细边框，删除按钮允许红色 |
| 禁止 | 大面积灰色背景、高饱和蓝紫绿橙背景色 |

#### 按钮规范

```scss
// 普通按钮
.el-button {
    border-radius: 8px;
    font-weight: 500;
    padding: 6px 14px;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    &:hover {
        transform: translateY(-2px);
        border-color: #b3b3b3;
        color: #4b5563;
    }
}

// 删除按钮（允许红色）
.el-button--danger {
    background: #fef2f2;
    border-color: #e5d0d0;
    color: #b45353;
}
```

#### 卡片规范

```scss
.el-card {
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    background: #fff;
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
}
```

#### 输入框规范

```scss
.el-input__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb;
    &:hover { box-shadow: 0 0 0 1px #d1d5db; }
    &.is-focus { box-shadow: 0 0 0 1px #b3b3b3; }
}
```

#### 颜色参考

```
标题文字:  #1f2937
正文文字:  #6b7280
浅色文字:  #9ca3af
边框颜色:  #e5e7eb
分割线:    #f3f4f6
```

#### 样式生效优先级

1. **优先使用类名覆盖**
2. **修改 Element Plus 内部元素时使用 `:deep()` 穿透**
3. **使用不带 `scoped` 的 `<style lang="scss">` 块**

---

### 8. 页面布局一致性规范 ⚠️

#### 同一模块布局必须统一

**英语学习模块**（`english/`）：
- `home/index.vue`
- `listening/index.vue`
- `ocr/index.vue`
- `vocabulary/index.vue`
- `vocabulary/detail.vue`
- `reading/index.vue`

**知识库模块**（`knowledge/`）：
- `home.vue`
- `list.vue`
- `upload.vue`
- `qa.vue`
- `docs.vue`

**我的题目模块**（`myQuestion/`）：
- `myBank/index.vue`
- `myFavoriteBank/index.vue`
- `myFavoriteQuestion/index.vue`
- `myMistakes/index.vue`
- `myMarked/index.vue`

#### 统一做法

1. 选定一个页面作为**基准页面**（如 `knowledge/list.vue`）
2. 其他页面**复制基准页面的标题样式、卡片样式、间距、圆角**
3. 最终效果：同一模块下切换子路由，视觉上毫无违和感

---

### 9. 模块导航防重复跳转

`front.vue` 中的模块导航使用自定义点击函数，避免重复跳转：

```javascript
const goToModule = (moduleKey, defaultPath) => {
    if (isModuleActive(moduleKey)) return  // 已在模块内，不重复跳转
    const lastVisited = cacheStore.getLastVisited(moduleKey, defaultPath)
    router.push(`/front/${moduleKey}/${lastVisited}`)
}
```

---

### 10. remark 字段规范 ⚠️

所有系统通知（`sys_notice` 表）的 `remark` 字段存储 JSON，统一包含以下 key：

| key | 类型 | 说明 |
|-----|------|------|
| `type` | string | 通知类型：`comment`（评论笔记）、`reply`（回复评论）、`mention`（@通知） |
| `fromUserId` | long | 触发通知的用户 ID（谁发的评论/@） |
| `toUserId` | long | 接收通知的用户 ID（谁被通知） |
| `noteId` | long | 关联笔记 ID |
| `commentId` | long | 关联评论 ID |

#### 示例

```json
// 评论笔记通知
{"type":"comment","fromUserId":1,"toUserId":2,"noteId":1,"commentId":1}

// 回复评论通知
{"type":"reply","fromUserId":3,"toUserId":1,"noteId":1,"commentId":2}

// @mention 通知
{"type":"mention","fromUserId":1,"toUserId":4,"noteId":1,"commentId":3}
```

#### 兼容旧数据

- 管理员公告的 `remark` 为 `null` 或空字符串
- 旧通知（无 `type` 字段）默认显示在系统通知页

---

### 11. 前台普通用户 API 权限规范

前台页面（`/front/*`）调用的接口需使用 `@ss.hasRole('common')`，**禁止使用 `system:xxx:list` 等后台权限注解**。

| 接口 | URL | 权限注解 | 用途 |
|------|-----|----------|------|
| `listUserFront` | `/system/user/frontList` | `@ss.hasRole('common')` | @ 功能用户搜索 |
| `listTopNotice` | `/system/notice/list` | - | 系统通知列表 |
| `getConversations` | `/system/chat/conversations` | `@ss.hasRole('common')` | 获取会话列表 |
| `getChatHistory` | `/system/chat/history/{userId}` | `@ss.hasRole('common')` | 获取聊天记录 |
| `sendMessage` | `/system/chat/send` | `@ss.hasRole('common')` | 发送消息 |
| `markRead` | `/system/chat/markRead/{userId}` | `@ss.hasRole('common')` | 标记消息已读 |
| `deleteMessage` | `/system/chat/message/{id}` | `@ss.hasRole('common')` | 删除消息 |
| `deleteConversation` | `/system/chat/conversation/{userId}` | `@ss.hasRole('common')` | 删除会话 |
| `getUnreadCount` | `/system/chat/unreadCount` | `@ss.hasRole('common')` | 获取未读消息数 |
| `searchUsers` | `/system/chat/users` | `@ss.hasRole('common')` | 搜索用户（发起私信） |

**原则**：
1. 前台接口不走后台 RBAC 权限（`system:xxx:xxx`）
2. 前台接口只检查角色（`common` / `admin`）
3. 新增前台接口时，Controller 方法上使用 `@PreAuthorize("@ss.hasRole('common')")`

---

## 常见问题与解决方案

### 1. 深层路由缓存失效

**问题**：连续点击导航导致路由跳回模块根路径，子页面内容消失。

**原因**：`router-link` 每次点击都导航到根路径。

**解决**：顶部导航改为自定义点击，已在模块内时直接忽略。

### 2. 评论功能数据不显示

**问题**：接口正常返回，但页面空白。

**排查**：检查 Network 响应，`res.rows` vs `res.data.list`。

**解决**：评论列表使用 `res.data.list`，总数使用 `res.data.total`。

### 3. 图片路径不显示

**问题**：上传后图片不显示或显示空白。

**排查**：检查存储的路径是否带前缀，组件会自动拼接 `VITE_APP_BASE_API`。

### 4. 缓存页面数据不更新

**问题**：详情页切换不同条目，内容不更新。

**解决**：详情页必须同时使用 `onMounted` + `onActivated` + `watch route.params.id`。

---

## 已修复的 Bug 记录

| 日期 | 页面 | 问题 | 解决方案 |
|------|------|------|----------|
| 2026-04-28 | list.vue | 评论列表取值 `res.data?.records` | 改为 `res.rows` |
| 2026-04-28 | detail.vue | 上下篇导航不更新内容 | 添加 `watch route.params.id` |
| 2026-04-28 | editor.vue | 编辑模式切换笔记不更新 | 添加 query 检测 + `watch route.query.id` |
| 2026-05-02 | QuestionBuilder.vue | AI 生成题目时 userId=0，导致使用配置文件的脱敏 key | 调用 AI 接口时传递 `userId: userStore.id` |

---

## 技术栈详情

### 前端核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| vue | 3.4.0 | 核心框架 |
| element-plus | 2.13.7 | UI 组件库 |
| pinia | 2.1.7 | 状态管理 |
| vue-router | 4.2.5 | 路由管理 |
| axios | 0.27.2 | HTTP 客户端 |
| vue-advanced-cropper | 2.8.9 | 图片裁剪 |
| vuedraggable | 4.1.0 | 拖拽排序 |
| echarts | 5.4.3 | 图表 |
| md-editor-v3 | 4.0.0 | Markdown 编辑器 |

### 后端核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| spring-boot | 3.5.11 | 核心框架 |
| mybatis-spring-boot | 3.0.5 | ORM 框架 |
| pagehelper | 2.1.1 | 分页插件 |
| spring-ai | 1.0.0-M5 | AI 集成 |
| druid | 1.2.28 | 数据库连接池 |
| fastjson | 2.0.61 | JSON 处理 |

---

## 私信聊天功能

### 功能概述

私信聊天模块提供用户间的实时私信功能，采用 Redis 缓存 + MySQL 持久化的混合存储架构。

### 架构设计

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端      │────▶│   Redis     │────▶│   MySQL     │
│  (Vue3)     │     │  (缓存)      │     │  (持久化)    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     │                    │ 定时同步           │ 启动时加载
     │                    │ 关闭时同步         │ 热点数据
     └────────────────────┴────────────────────┘
```

### Redis 缓存策略

| Key 模式 | 类型 | 说明 | 过期时间 |
|---------|------|------|----------|
| `chat:messages:{uid1}:{uid2}:` | Hash | 聊天消息缓存 | 30天 |
| `chat:conversations:{userId}` | List | 会话列表缓存 | 30天 |
| `chat:pending:{userId}` | List | 待持久化消息队列 | 30天 |
| `chat:unread:{userId}` | String | 未读消息数 | 实时更新 |

### 数据持久化策略

1. **定时同步**：每 5 分钟自动同步待持久化消息
2. **关闭同步**：系统关闭时自动触发 `@PreDestroy` 同步所有待持久化消息
3. **实时持久化**：新消息先缓存，异步批量写入数据库

### 数据库表结构

```sql
-- chat_message 表
CREATE TABLE `chat_message` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `sender_name` VARCHAR(100) NOT NULL,
  `sender_nickname` VARCHAR(100) NOT NULL,
  `sender_avatar` VARCHAR(255),
  `receiver_id` BIGINT NOT NULL COMMENT '接收者ID',
  `receiver_name` VARCHAR(100) NOT NULL,
  `receiver_nickname` VARCHAR(100) NOT NULL,
  `receiver_avatar` VARCHAR(255),
  `content` TEXT NOT NULL COMMENT '消息内容',
  `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 前端页面结构

```
src/views/front/messages/
├── index.vue          # 消息中心布局（侧边栏 + 红点）
├── notifications.vue  # 系统通知页面
├── mentions.vue       # @通知页面
└── chats.vue          # 私信聊天页面（WeChat 布局）

聊天页面布局：
┌────────────────┬────────────────────────────────┐
│  左侧会话列表   │        右侧聊天窗口              │
│  ┌──────────┐  │  ┌────────────────────────┐   │
│  │ 用户头像  │  │  │  聊天对象信息            │   │
│  │ 昵称      │  │  ├────────────────────────┤   │
│  │ 最新消息  │  │  │                        │   │
│  │ 未读红点  │  │  │     消息展示区域         │   │
│  └──────────┘  │  │                        │   │
│                │  ├────────────────────────┤   │
│  [+ 新建会话]  │  │     输入框区域           │   │
│                │  └────────────────────────┘   │
└────────────────┴────────────────────────────────┘
```

### 功能特性

- [x] 会话列表展示（左侧重构消息预览+时间+未读红点）
- [x] 聊天记录分页加载（每次加载20条，支持上拉加载更多）
- [x] 发送文本消息
- [x] 消息气泡样式（自己发送蓝色，对方发送白色）
- [x] 标记消息已读
- [x] 删除单条消息
- [x] 删除整个会话
- [x] 搜索用户发起新会话
- [x] 消息通知红点（消息中心侧边栏）
- [x] Redis 缓存加速读取
- [x] 关闭时自动持久化到 MySQL
- [ ] 图片发送功能（预留 UI）
- [ ] 实时 WebSocket 推送（待实现）

### 相关文件

**后端：**
- `system/domain/ChatMessage.java` - 消息实体
- `system/mapper/ChatMessageMapper.java` - Mapper 接口
- `system/mapper/ChatMessageMapper.xml` - Mapper XML
- `system/service/IChatMessageService.java` - 服务接口
- `system/service/impl/ChatMessageServiceImpl.java` - 服务实现（Redis 缓存）
- `system/service/ChatSyncService.java` - 持久化同步服务
- `framework/manager/ChatShutdownManager.java` - 关闭同步管理
- `web/controller/system/SysChatController.java` - Controller

**前端：**
- `api/system/chat.js` - API 接口
- `views/front/messages/chats.vue` - 聊天页面组件

---

## 许可证

MIT License

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

⚠️ 安全提醒
---
API Key 存储说明：
1. 用户自定义的 API Key 以明文形式存储在数据库的 `sys_ai_config` 表中
2. 请确保数据库访问权限的安全，不要将数据库文件或备份随意分享给他人
3. 建议在生产环境中自行对敏感字段进行加密处理
4. 部署服务器时，请确保服务器安全，避免 SQL 注入等安全风险