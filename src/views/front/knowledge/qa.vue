<template>
  <div class="qa-container" :key="knowledgeBaseId">
    <!-- 吸顶返回栏 -->
    <div class="sticky-header">
      <el-page-header @back="goBack" title="返回">
        <template #content>
          <span class="page-title">{{ kbName ? kbName + ' - 问答' : '知识库问答' }}</span>
        </template>
      </el-page-header>
    </div>

    <el-card class="qa-card">
      <!-- 聊天记录区域 -->
      <div class="chat-history" ref="chatHistoryRef">
        <div v-for="(msg, index) in chatHistory" :key="index" :class="['message', msg.role]">
          <div class="message-content" v-if="msg.role === 'assistant'">
            <div class="message-role">🤖 AI</div>
            <div class="message-text rendered-md" @click="copyText(msg.content)" v-html="renderMarkdown(msg.content)">
            </div>
            <el-button class="msg-copy-btn" size="small" text @click.stop="copyText(msg.content)">
              📋 复制
            </el-button>
          </div>
          <div class="message-content" v-else>
            <div class="message-role">👤 我</div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="isGenerating && !isPaused" class="message ai">
          <div class="message-content">
            <div class="message-role">🤖 AI</div>
            <div class="message-text typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <div class="input-wrapper">
          <el-input v-model="question" type="textarea" :rows="3" placeholder="请输入你的问题...（Ctrl+Enter 发送）"
            @keydown.ctrl.enter="handleSend" :disabled="isGenerating" class="question-input" />
          <div class="input-actions">
            <el-checkbox v-model="useStream">使用流式输出</el-checkbox>
            <div class="action-buttons">
              <el-button v-if="isGenerating" @click="togglePause" :type="isPaused ? 'success' : 'warning'" size="small">
                {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
              </el-button>
              <el-button v-if="isGenerating" @click="stopGeneration" type="danger" size="small">
                ⏹ 停止
              </el-button>
              <el-button class="ai-question-btn" size="small" @click="openAiBankDialog">
                <el-icon style="margin-right: 4px">
                  <MagicStick />
                </el-icon>
                AI 出题
              </el-button>
              <el-button type="primary" @click="handleSend" :loading="isGenerating"
                :disabled="isGenerating || !question.trim()">
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 滚动按钮 -->
    <ScrollButton bottom="28" right="28" />

    <!-- AI 出题 - 选择题库弹窗 -->
    <el-dialog v-model="showAiBankDialog" title="AI 出题 - 选择题库" width="520px" :close-on-click-modal="false"
      class="ai-bank-dialog">
      <div class="bank-dialog-tip">选择目标题库：AI 生成的题目将导入到所选题库中。如选择已有题库，题目会追加到该题库；如新建题库，则创建一个空题库并导入。</div>
      <div v-loading="bankLoading" class="bank-dialog-body">
        <div v-for="item in bankList" :key="item.id" class="bank-item">
          <span class="bank-name">{{ item.bankName || item.name }}</span>
          <el-tag size="small" type="info" class="bank-count">{{ item.totalQuestions || item.questionCount || 0 }}
            题</el-tag>
          <el-button class="bank-select-btn" size="small" @click="handleSelectBank(item.id)">选择</el-button>
        </div>
        <el-empty v-if="!bankLoading && bankList.length === 0" description="暂无题库" />
      </div>
      <template #footer>
        <div style="display: flex; justify-content: center;">
          <el-button class="bank-new-btn" @click="handleNewBank">
            ＋ 新建题库
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FrontKnowledgeQa">
import { ref, computed, nextTick, onUnmounted, onMounted, onActivated, onDeactivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { askQuestion, saveQaRecord, getQaHistory, getKnowledgeBaseDetail } from '@/api/knowledge'
import { listMyQuestionBank } from '@/api/questionBank/questionBank'
import useUserStore from '@/store/modules/user'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import ScrollButton from '@/components/ScrollButton/ScrollButton.vue'

const userStore = useUserStore()
const cacheStore = useFrontPageCacheStore()
const route = useRoute()
const router = useRouter()

const knowledgeBaseId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const kbName = ref('')

const fetchKbName = async () => {
  if (!isQaPage.value) return
  const id = knowledgeBaseId.value
  if (!id) return
  try {
    const res = await getKnowledgeBaseDetail(id)
    if (!isQaPage.value) return
    kbName.value = res.data?.name || ''
  } catch (e) {
    kbName.value = ''
  }
}

const renderMarkdown = (content) => {
  if (!content) return ''
  const html = marked.parse(content)
  return DOMPurify.sanitize(html)
}

const question = ref('')
const chatHistory = ref([])
const useStream = ref(true)
const chatHistoryRef = ref(null)

const isGenerating = ref(false)
const isPaused = ref(false)
const isQaPage = ref(false)
let abortController = null
let pausedResolver = null
let aiMsgIndex = 0
let scrollTimer = null

// 复制文本
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 保存问答记录
const saveQA = (question, answer, durationMs) => {
  const userId = userStore.id || 1
  const kbId = knowledgeBaseId.value
  console.log('[QA] saveQA called:', { userId, kbId, knowledgeBaseId: knowledgeBaseId.value, question, answerLength: answer.length, durationMs })
  saveQaRecord({
    userId,
    knowledgeBaseId: kbId,
    question,
    answer,
    durationMs
  }).then(res => {
    console.log('[QA] saveQA success:', res)
  }).catch(err => {
    console.error('[QA] saveQA failed:', err)
  })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
}

// 流式输出时使用防抖滚动（流式结束时才滚动）
const scrollToBottomDebounced = () => {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    if (!isGenerating.value && isNearBottom()) {
      scrollToBottom()
    }
    scrollTimer = null
  }, 100)
}

// 用户是否在手动滚动（通过鼠标滚轮或触摸）
const isUserScrolling = ref(false)
let userScrollTimeout = null

const onUserScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollHeight = document.body.scrollHeight
  const clientHeight = window.innerHeight
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  if (distanceFromBottom > 100) {
    isUserScrolling.value = true
  }
  if (userScrollTimeout) clearTimeout(userScrollTimeout)
  userScrollTimeout = setTimeout(() => {
    isUserScrolling.value = false
  }, 300)
}

// 检测用户是否在底部附近（距离底部50px内）
const isNearBottom = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollHeight = document.body.scrollHeight
  const clientHeight = window.innerHeight
  return scrollHeight - scrollTop - clientHeight < 50
}

// 流式输出时完全不自动滚动，让用户自由滚动
const scrollToBottomForStreaming = () => {
  // 禁用自动滚动，完全由用户控制
}
let isLoadingHistory = false

const loadQaHistory = async () => {
  if (isLoadingHistory) {
    console.log('[QA] loadQaHistory skipped: already loading')
    return
  }

  const id = knowledgeBaseId.value
  if (!id || !isQaPage.value) {
    console.log('[QA] loadQaHistory skipped: id is', id)
    return
  }

  isLoadingHistory = true

  // ✅ 强制清空数组（使用 splice 确保响应式更新）
  chatHistory.value.splice(0, chatHistory.value.length)

  try {
    console.log('[QA] loadQaHistory called with id=', id)
    const res = await getQaHistory(id)
    console.log('[QA] getQaHistory response code:', res.code, 'data length:', res.data?.length)

    // ✅ 验证响应数据
    if (res.code !== 200) {
      console.error('[QA] API 返回错误:', res)
      return
    }

    if (res.data && res.data.length > 0) {
      // ✅ 反转数组，让最新的在下面（最旧的在上方）
      const reversedData = [...res.data].reverse()

      // ✅ 使用 push 逐个添加，确保响应式更新
      const history = []
      reversedData.forEach(record => {
        console.log('[QA] 记录:', record.id, 'question:', record.question?.substring(0, 20), 'answer:', record.answer?.substring(0, 20))
        history.push({ role: 'user', content: record.question })
        history.push({ role: 'assistant', content: record.answer })
      })

      // ✅ 使用 push 而不是直接赋值
      chatHistory.value.push(...history)
      console.log('[QA] chatHistory populated:', chatHistory.value.length, 'messages')
      await scrollToBottom()
    } else {
      console.log('[QA] no history records found')
    }
  } catch (error) {
    console.error('[QA] loadQaHistory failed:', error)
  } finally {
    isLoadingHistory = false
  }
}

const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  isGenerating.value = false
  isPaused.value = false
}

const togglePause = () => {
  if (!isGenerating.value) return
  isPaused.value = !isPaused.value
  if (!isPaused.value && pausedResolver) {
    pausedResolver()
    pausedResolver = null
  }
}

const handleStreamAsk = (userQuestion) => {
  return new Promise(async (resolve, reject) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
    const url = `${baseUrl}/rag/ask/stream?question=${encodeURIComponent(userQuestion)}&knowledgeBaseId=${knowledgeBaseId.value}`

    abortController = new AbortController()
    let fullContent = ''
    let metadata = null

    try {
      const token = localStorage.getItem('Admin-Token')
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'text/event-stream'
        },
        signal: abortController.signal
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        while (isPaused.value) await new Promise(r => pausedResolver = r)
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            let dataStr = line
            while (dataStr.startsWith('data:')) dataStr = dataStr.substring(5).trim()
            if (!dataStr || dataStr === '[DONE]') continue

            try {
              const json = JSON.parse(dataStr)
              if (json.type === 'content') {
                fullContent += json.text || ''
                if (chatHistory.value[aiMsgIndex]) {
                  chatHistory.value[aiMsgIndex].content = fullContent
                  scrollToBottomForStreaming()
                }
              } else if (json.type === 'end') metadata = json
            } catch (e) { console.warn(e) }
          }
        }
      }

      let final = fullContent
      if (metadata?.tip && (!metadata.isInScope || metadata.source === 'ai_general')) {
        final = fullContent + '\n\n---\n' + metadata.tip
        ElMessage.info('问题不在知识库范围内，使用通用知识回答')
      }
      if (chatHistory.value[aiMsgIndex]) {
        chatHistory.value[aiMsgIndex].content = final
        scrollToBottom()
      }
      resolve(final)
    } catch (error) {
      if (error.name === 'AbortError') resolve(fullContent)
      else reject(error)
    }
  })
}

const handleNormalAsk = async (userQuestion) => {
  const res = await askQuestion({ question: userQuestion, knowledgeBaseId: knowledgeBaseId.value })
  const answer = res.data?.answer || '暂无回答'
  const tip = res.data?.tip
  const isGeneral = res.data?.source === 'ai_general' || !res.data?.isInScope

  let final = answer
  if (isGeneral && tip) {
    final = answer + '\n\n---\n' + tip
    ElMessage.info('问题不在知识库范围内，使用通用知识回答')
  }
  chatHistory.value[aiMsgIndex].content = final
  await scrollToBottom()
  return final
}

const handleSend = async () => {
  const content = question.value.trim()
  if (!content || isGenerating.value) return

  const start = Date.now()
  chatHistory.value.push({ role: 'user', content })
  question.value = ''
  aiMsgIndex = chatHistory.value.length
  chatHistory.value.push({ role: 'assistant', content: '' })
  await scrollToBottom()

  isGenerating.value = true
  isPaused.value = false
  let answer = ''

  try {
    answer = useStream.value ? await handleStreamAsk(content) : await handleNormalAsk(content)
    const duration = Date.now() - start
    if (answer) saveQA(content, answer, duration)
    else {
      const saved = chatHistory.value[aiMsgIndex]?.content
      if (saved) saveQA(content, saved, duration)
    }
  } catch (error) {
    console.error(error)
    answer = '❌ 问答失败，请重试'
    if (chatHistory.value[aiMsgIndex]) chatHistory.value[aiMsgIndex].content = answer
    ElMessage.error('问答失败')
  } finally {
    isGenerating.value = false
    isPaused.value = false
    abortController = null
  }
}

// qa.vue 的 goBack 改成：
const goBack = () => {
  if (isGenerating.value) stopGeneration()
  cacheStore.setLastVisited('knowledge', 'list')
  router.push('/front/knowledge/list')
}

// AI 出题 - 选择题库弹窗
const showAiBankDialog = ref(false)
const bankList = ref([])
const bankLoading = ref(false)

const fetchBankList = async () => {
  bankLoading.value = true
  try {
    const res = await listMyQuestionBank()
    bankList.value = res.data || []
  } catch (e) {
    ElMessage.error('获取题库列表失败')
  } finally {
    bankLoading.value = false
  }
}

const openAiBankDialog = () => {
  showAiBankDialog.value = true
  fetchBankList()
}

const handleSelectBank = (bankId) => {
  showAiBankDialog.value = false
  cacheStore.setLastVisited('knowledge', `qa/${knowledgeBaseId.value}`)
  cacheStore.setLastVisited('studio', 'create')
  router.push(`/front/studio/create?bankId=${bankId}&knowledgeBaseId=${knowledgeBaseId.value}&from=knowledge&autoOpenAi=true`)
}

const handleNewBank = () => {
  showAiBankDialog.value = false
  cacheStore.setLastVisited('knowledge', `qa/${knowledgeBaseId.value}`)
  cacheStore.setLastVisited('studio', 'create')
  router.push(`/front/studio/create?knowledgeBaseId=${knowledgeBaseId.value}&from=knowledge&newBank=true&autoOpenAi=true`)
}

onMounted(() => {
  isQaPage.value = true
  window.addEventListener('wheel', onUserScroll, { passive: true })
  // ✅ 首次挂载时加载聊天记录
  loadQaHistory()
  fetchKbName()
})

onActivated(() => {
  isQaPage.value = true
  window.addEventListener('wheel', onUserScroll, { passive: true })
})

onDeactivated(() => {
  isQaPage.value = false
  window.removeEventListener('wheel', onUserScroll)
})

onUnmounted(() => {
  abortController?.abort()
  window.removeEventListener('wheel', onUserScroll)
  if (scrollTimer) {
    clearTimeout(scrollTimer)
    scrollTimer = null
  }
  if (userScrollTimeout) {
    clearTimeout(userScrollTimeout)
    userScrollTimeout = null
  }
})

watch(() => route.params.id, async (newId, oldId) => {
  console.log('[QA] route.params.id changed:', oldId, '->', newId)
  if (newId && route.path.startsWith('/front/knowledge/qa/')) {
    // ✅ 强制清空数组
    chatHistory.value.splice(0, chatHistory.value.length)
    aiMsgIndex = 0
    // ✅ 等待下一个 tick 确保 DOM 更新
    await nextTick()
    loadQaHistory()
    fetchKbName()
  }
})
</script>

<style scoped lang="scss">
.qa-container {
  padding: 24px;
}

/* 卡片 */
.qa-card {
  margin-top: 20px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.qa-card :deep(.el-card__body) {
  padding: 0;
}

.sticky-header {
  position: sticky;
  top: 68px;
  z-index: 90;
  background-color: white;
  padding: 10px 16px;
  margin-bottom: 10px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.chat-history {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  position: relative;
}

.message.user .message-content {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.message-role {
  font-size: 12px;
  margin-bottom: 6px;
  opacity: 0.7;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

/* 复制按钮 */
.msg-copy-btn {
  position: absolute;
  bottom: 8px;
  right: 12px;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  z-index: 10;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.msg-copy-btn:hover {
  background: #fff;
  border-color: #d1d5db;
}

.input-area {
  background-color: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 20px;
}

.input-wrapper {
  width: 100%;
}

.question-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e5e7eb;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 0 0 1px #d1d5db;
  }

  &:focus {
    box-shadow: 0 0 0 1px #409eff;
  }
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;
  gap: 10px;

  :deep(.el-button) {
    border-radius: 8px;
    font-weight: 500;
    padding: 6px 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;

    &:hover {
      transform: translateY(-2px);
      border-color: #d1d5db;
      color: #4b5563;
    }

    &:active {
      transform: translateY(0);
    }
  }

  .ai-question-btn {
    display: inline-flex;
    align-items: center;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 8px;
    font-weight: 500;
    padding: 6px 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      border-color: #409eff;
      color: #409eff;
    }

    &:active {
      transform: translateY(0);
    }
  }

  :deep(.el-button--primary) {
    background: #fff;
    border-color: #d1d5db;
    color: #1f2937;

    &:hover {
      border-color: #9ca3af;
      color: #1f2937;
    }
  }

  :deep(.el-button--warning) {
    background: #fefce8;
    border-color: #e5e0c0;
    color: #947a4a;

    &:hover {
      background: #fff;
      border-color: #d1b860;
      color: #7a6238;
    }
  }

  :deep(.el-button--danger) {
    background: #fef2f2;
    border-color: #e5d0d0;
    color: #b45353;

    &:hover {
      background: #fff;
      border-color: #b38080;
      color: #9b3a3a;
    }
  }

  :deep(.el-button--success) {
    background: #f0f9eb;
    border-color: #e1f3d8;
    color: #67c23a;

    &:hover {
      background: #fff;
      border-color: #b3e19d;
      color: #5daf34;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-button) {
    border-radius: 8px;
  }
}

/* 打字动画 */
.typing {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 20px;
}

.typing span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .qa-container {
    padding: 12px;
  }

  .message-content {
    max-width: 85%;
  }

  .input-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: flex-end;
  }

  .scroll-bottom-btn {
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
  }

  .btn-icon {
    width: 18px;
    height: 18px;
  }
}

.ai-bank-dialog {
  .bank-dialog-tip {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .bank-dialog-body {
    max-height: 360px;
    overflow-y: auto;
  }

  .bank-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;
  }

  .bank-item:last-child {
    border-bottom: none;
  }

  .bank-item:hover {
    background-color: #f9fafb;
  }

  .bank-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .bank-count {
    margin-right: 12px;
  }

  .bank-select-btn {
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 8px;
    font-weight: 500;
    padding: 5px 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bank-select-btn:hover {
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-2px);
  }

  .bank-select-btn:active {
    transform: translateY(0);
  }

  .bank-new-btn {
    width: 100%;
    border-radius: 8px;
    border: 1px dashed #d1d5db;
    color: #6b7280;
    background: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bank-new-btn:hover {
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-2px);
  }

  .bank-new-btn:active {
    transform: translateY(0);
  }

  .el-empty {
    padding: 40px 0;
  }
}
</style>

<style lang="scss">
.rendered-md {
  line-height: 1.7;
  font-size: 15px;
  color: #1f2937;
  padding-bottom: 20px;
  cursor: pointer;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1em 0 0.5em;
    color: #1f2937;
    font-weight: 700;
    line-height: 1.3;
  }

  h1 {
    font-size: 1.75em;
  }

  h2 {
    font-size: 1.35em;
  }

  h3 {
    font-size: 1.15em;
  }

  p {
    margin: 0 0 10px;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin: 0.4em 0;
  }

  blockquote {
    margin: 0.6em 0;
    padding: 6px 14px;
    border-left: 4px solid #d1d5db;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 0 8px 8px 0;
  }

  pre {
    background: #1f2937;
    color: #e5e7eb;
    padding: 14px;
    border-radius: 8px;
    margin: 0.6em 0;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
  }

  code {
    background: #f3f4f6;
    color: #b45353;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }

  pre code {
    color: inherit;
    background: none;
    padding: 0;
  }

  table {
    border-collapse: collapse;
    margin: 0.8em 0;
    width: 100%;
  }

  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
  }

  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1em 0;
  }

  img {
    max-width: 100%;
    border-radius: 8px;
  }

  a {
    color: #409eff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}
</style>