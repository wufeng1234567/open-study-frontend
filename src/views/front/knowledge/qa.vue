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
      <div class="qa-model-bar">
        <AiModelSelector v-model="selectedProvider" width="180px" />
      </div>
      <AiChatStream
        v-model:messages="chatHistory"
        :is-generating="isGenerating"
        :is-paused="isPaused"
        placeholder="请输入你的问题...（Ctrl+Enter 发送）"
        @send="handleChatSend"
        @stop="stopGeneration"
        @toggle-pause="togglePause"
      >
        <template #input-left>
          <el-checkbox v-model="useStream">使用流式输出</el-checkbox>
          <el-button class="ai-question-btn" size="small" @click="openAiBankDialog">
            <el-icon style="margin-right: 4px"><MagicStick /></el-icon>
            AI 出题
          </el-button>
        </template>
      </AiChatStream>
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
import ScrollButton from '@/components/ScrollButton/ScrollButton.vue'
import AiChatStream from '@/components/AiChatStream/index.vue'
import AiModelSelector from '@/components/AiModelSelector/index.vue'

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

const chatHistory = ref([])
const useStream = ref(true)
const selectedProvider = ref('')

const isGenerating = ref(false)
const isPaused = ref(false)
const isQaPage = ref(false)
let abortController = null
let pausedResolver = null
let aiMsgIndex = 0

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
    let url = `${baseUrl}/rag/ask/stream?question=${encodeURIComponent(userQuestion)}&knowledgeBaseId=${knowledgeBaseId.value}&userId=${userStore.id || 0}`
    if (selectedProvider.value) url += `&provider=${selectedProvider.value}`

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
  return final
}

const handleChatSend = async ({ content }) => {
  if (!content || isGenerating.value) return

  const start = Date.now()
  chatHistory.value.push({ role: 'user', content })
  aiMsgIndex = chatHistory.value.length
  chatHistory.value.push({ role: 'assistant', content: '' })

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
  loadQaHistory()
  fetchKbName()
})

onActivated(() => {
  isQaPage.value = true
})

onDeactivated(() => {
  isQaPage.value = false
})

onUnmounted(() => {
  abortController?.abort()
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

.qa-model-bar {
  padding: 8px 16px;
  border-bottom: 1px solid #f3f4f6;
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

@media (max-width: 768px) {
  .qa-container {
    padding: 12px;
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