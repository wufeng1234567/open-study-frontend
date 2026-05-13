<template>
  <div class="upload-container">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">上传文档</span>
      </template>
    </el-page-header>

    <el-card style="margin-top: 20px;">
      <el-upload ref="uploadRef" drag :action="uploadUrl" :headers="uploadHeaders"
        :data="{ knowledgeBaseId: knowledgeBaseId }" :accept="'.pdf,.docx,.txt,.md'" :show-file-list="false" :on-success="handleUploadSuccess"
        :on-error="handleUploadError" :on-progress="handleUploadProgress" :before-upload="beforeUpload" :disabled="isParsing">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .pdf, .docx, .txt, .md 格式的文件（最大 50MB）
          </div>
        </template>
      </el-upload>

      <!-- 上传进度 -->
      <div v-if="showUploadProgress" style="margin-top: 16px;">
        <el-progress :percentage="uploadProgress" :stroke-width="8" :status="uploadProgress === 100 ? 'success' : undefined" />
        <div style="text-align: center; color: #909399; font-size: 12px; margin-top: 6px;">
          {{ uploadProgress < 100 ? '文件上传中，请稍候...' : '上传完成，正在处理...' }}
        </div>
      </div>

      <!-- 解析状态 -->
      <div v-if="parseStatus" style="margin-top: 20px;">
        <el-alert :title="parseStatus.message" :type="parseStatus.type" closable show-icon
          @close="onStatusAlertClose" />
        <div v-if="parseStatus.chunks" style="margin-top: 10px; color: #666;">
          分块数量：{{ parseStatus.chunks }}
        </div>
        <div v-if="uploadedTextFileName" style="margin-top: 10px; color: #409eff; font-size: 13px;">
          📄 已上传：{{ uploadedTextFileName }}
        </div>

        <!-- 重新解析按钮 -->
        <div v-if="parseStatus.type === 'error' && currentDocumentId" style="margin-top: 15px; text-align: center;">
          <el-button type="warning" @click="retryParse" :loading="isParsing">
            🔄 重新解析
          </el-button>
        </div>
      </div>

      <div class="action-buttons">
        <el-button @click="showTextUploadDialog = true">
          <el-icon><Edit /></el-icon>
          粘贴文本上传
        </el-button>
        <el-button type="primary" @click="goQa" :disabled="!parseCompleted" :loading="isParsing">
          💬 开始问答
        </el-button>
      </div>
    </el-card>

    <!-- 粘贴文本上传弹框 -->
    <el-dialog v-model="showTextUploadDialog" title="粘贴文本上传" width="80%" top="8vh" :close-on-click-modal="false"
      class="text-upload-dialog" @closed="onDialogClosed">
      <div class="text-upload-content">
        <div class="text-upload-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>直接粘贴或输入文本内容，系统将自动处理并添加到知识库</span>
        </div>
        <div class="tiptap-wrapper">
          <TiptapEditor ref="tiptapEditorRef" v-model="textContent" placeholder="请输入文本内容..." :disabledImage="true" />
        </div>
        <div class="text-upload-footer">
          <span class="char-count">字符数：{{ textContent.length }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTextUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleTextUpload" :loading="textUploading" :disabled="!textContent.trim()">
          上传文本
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FrontKnowledgeUpload">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Edit, InfoFilled } from '@element-plus/icons-vue'
import { getDocumentStatus, uploadTextContent } from '@/api/knowledge'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import useUserStore from '@/store/modules/user'
import TiptapEditor from '@/components/TiptapEditor/index.vue'

const userStore = useUserStore()
const cacheStore = useFrontPageCacheStore()

const route = useRoute()
const router = useRouter()
const uploadRef = ref(null)
const parseStatus = ref(null)
const parseCompleted = ref(false)
const isParsing = ref(false)
const currentDocumentId = ref(null)
const pollingTimer = ref(null)
const pollingCount = ref(0)

// 文本上传相关
const showTextUploadDialog = ref(false)
const textContent = ref('')
const textUploading = ref(false)
const tiptapEditorRef = ref(null)
const uploadedTextFileName = ref('')
const successAutoCloseTimer = ref(null)

// 文件上传进度
const uploadProgress = ref(0)
const showUploadProgress = ref(false)
const progressAnimationTimer = ref(null)

const knowledgeBaseId = computed(() => route.params.id)

// 上传地址
const uploadUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
  return `${baseUrl}/rag/document/upload`
})

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('Admin-Token')
  return {
    Authorization: `Bearer ${token}`
  }
})

// 状态映射
const statusMap = {
  0: '等待处理',
  1: '处理中',
  2: '解析中',
  3: '已完成',
  4: '失败',
  5: '已完成'  // 添加 status 5 的映射
}

// 开始轮询文档状态
const startPolling = (documentId) => {
  console.log('[知识库] 开始轮询文档状态，documentId:', documentId)

  // 重置计数器
  pollingCount.value = 0
  isParsing.value = true
  parseCompleted.value = false

  // 显示初始状态
  parseStatus.value = {
    message: '⏳ 正在处理文档...',
    type: 'info'
  }

  // 立即执行一次查询
  pollDocumentStatus(documentId)

  // 启动定时器，每2秒查询一次
  pollingTimer.value = setInterval(() => {
    pollDocumentStatus(documentId)
  }, 2000)
}

// 轮询文档状态
const pollDocumentStatus = async (documentId) => {
  try {
    pollingCount.value++
    console.log(`[知识库] 第 ${pollingCount.value} 次查询状态...`)

    const res = await getDocumentStatus(documentId)
    console.log('[知识库] 状态响应:', res)
    console.log('[知识库] res.data:', res.data)

    // 正确获取 status 和 chunkCount
    const status = res.data?.status ?? res.status
    const chunkCount = res.data?.chunkCount ?? res.data?.chunks ?? 0
    const message = res.data?.message || res.msg || ''

    const statusText = statusMap[status] || `未知状态(${status})`

    // 详细日志输出
    console.log(`[知识库] ========== 状态信息 ==========`)
    console.log(`[知识库] status: ${status} (类型: ${typeof status})`)
    console.log(`[知识库] statusText: ${statusText}`)
    console.log(`[知识库] chunkCount: ${chunkCount}`)
    console.log(`[知识库] message: ${message}`)
    console.log(`[知识库] ================================`)

    // 更新状态显示
    if (status < 3) {
      // 还在处理中（status 为 0、1、2）
      console.log(`[知识库] ⏳ 继续轮询，当前状态: ${statusText}`)

      parseStatus.value = {
        message: `⏳ 处理中...当前状态：${statusText}`,
        type: 'info',
        chunks: chunkCount
      }

      // 检查是否超时（60秒 = 30次）
      if (pollingCount.value >= 30) {
        console.warn('[知识库] ⚠️ 轮询超时')
        stopPolling()
        parseStatus.value = {
          message: '❌ 处理超时（超过60秒），请重试',
          type: 'error'
        }
        ElMessage.error('文档处理超时，请重试')
        isParsing.value = false
      }
    } else if (status >= 3 && status !== 4) {
      // 完成状态（status 为 3、5 或其他非4的值）
      console.log(`[知识库] ✅ 处理完成！status=${status}, chunkCount=${chunkCount}`)

      stopPolling()
      parseStatus.value = {
        message: `✅ 处理完成！${message}`,
        type: 'success',
        chunks: chunkCount
      }
      parseCompleted.value = true
      isParsing.value = false

      ElMessage.success(`文档处理成功，共 ${chunkCount} 个分块`)
    } else if (status === 4) {
      // 失败状态
      console.error(`[知识库] ❌ 处理失败！status=${status}`)

      stopPolling()
      parseStatus.value = {
        message: `❌ 处理失败：${message || '未知错误'}`,
        type: 'error',
        chunks: chunkCount
      }
      isParsing.value = false

      ElMessage.error('文档处理失败，请重试')
    } else {
      // 未知状态
      console.warn(`[知识库] ⚠️ 未知状态: ${status}`)

      parseStatus.value = {
        message: `⚠️ 未知状态：${statusText}`,
        type: 'warning',
        chunks: chunkCount
      }
    }

  } catch (error) {
    console.error('[知识库] 查询状态失败:', error)
    console.error('[知识库] 错误详情:', error.response?.data || error.message)

    // 如果是网络错误，继续轮询（可能是临时网络问题）
    if (pollingCount.value < 30) {
      parseStatus.value = {
        message: `⚠️ 查询状态失败，将继续重试...`,
        type: 'warning'
      }
    } else {
      // 超时后仍然失败
      stopPolling()
      parseStatus.value = {
        message: '❌ 查询状态失败，请重试',
        type: 'error'
      }
      isParsing.value = false
      ElMessage.error('查询文档状态失败')
    }
  }
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
    console.log('[知识库] 停止轮询')
  }
}

// 停止进度动画
const stopProgressAnimation = () => {
  if (progressAnimationTimer.value) {
    clearInterval(progressAnimationTimer.value)
    progressAnimationTimer.value = null
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  stopPolling()
  stopProgressAnimation()
})

// 上传前校验
const beforeUpload = (file) => {
  // 防止重复上传
  if (isParsing.value) {
    ElMessage.warning('正在处理中，请稍候...')
    return false
  }

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
  const isAllowed = allowedTypes.includes(file.type) ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md')

  if (!isAllowed) {
    ElMessage.error('只支持 .pdf, .docx, .txt, .md 格式的文件')
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }

  // 开始显示进度条，模拟初始加载
  uploadProgress.value = 0
  showUploadProgress.value = true
  
  // 启动模拟进度动画（在实际进度到来之前显示加载效果）
  let simulatedProgress = 0
  progressAnimationTimer.value = setInterval(() => {
    if (simulatedProgress < 30) {
      simulatedProgress += Math.random() * 5
      if (simulatedProgress > 30) simulatedProgress = 30
      uploadProgress.value = Math.round(simulatedProgress)
    }
  }, 200)

  return true
}

// 上传进度
const handleUploadProgress = (event) => {
  if (event.percent) {
    // 停止模拟进度，使用实际进度
    stopProgressAnimation()
    uploadProgress.value = Math.round(event.percent)
  }
}

// 上传成功
const handleUploadSuccess = async (response) => {
  console.log('[知识库] 上传响应:', response)
  
  // 确保进度条显示完成状态
  uploadProgress.value = 100
  
  // 延迟隐藏进度条，让用户看到完成状态
  setTimeout(() => {
    showUploadProgress.value = false
    uploadProgress.value = 0
  }, 500)

  if (response.code === 200) {
    const documentId = response.data?.documentId || response.data?.id || response.documentId || response.id
    console.log('[知识库] 提取的 documentId:', documentId)

    if (!documentId) {
      console.error('[知识库] 无法获取 documentId，完整响应:', response)
      ElMessage.error('上传成功但无法获取文档ID')
      return
    }

    currentDocumentId.value = documentId
    ElMessage.success('上传成功，后端正在处理...')
    startPolling(documentId)
  } else {
    console.error('[知识库] 上传失败:', response)
    ElMessage.error(response.msg || '上传失败')
  }
}

// 上传失败
const handleUploadError = (error) => {
  stopProgressAnimation()
  uploadProgress.value = 0
  showUploadProgress.value = false
  console.error('[知识库] 上传错误:', error)
  ElMessage.error('上传失败，请检查网络连接后重试')
}

// 状态提示关闭
const onStatusAlertClose = () => {
  parseStatus.value = null
  if (successAutoCloseTimer.value) {
    clearTimeout(successAutoCloseTimer.value)
    successAutoCloseTimer.value = null
  }
}

// 重新处理（重新开始轮询）
const retryParse = async () => {
  if (!currentDocumentId.value) {
    ElMessage.error('无法获取文档ID，请重新上传')
    return
  }

  console.log('[知识库] 重新查询文档状态，documentId:', currentDocumentId.value)
  ElMessage.info('正在重新查询状态...')

  // 停止之前的轮询
  stopPolling()

  // 重新启动轮询
  startPolling(currentDocumentId.value)
}

// 返回
// upload.vue 的 goBack 改成：
const goBack = () => {
  stopPolling()
  cacheStore.setLastVisited('knowledge', 'list')
  router.push('/front/knowledge/list')
}

// 跳转到问答页面
const goQa = () => {
  if (!parseCompleted.value) {
    ElMessage.warning('请先完成文档处理')
    return
  }
  router.push(`/front/knowledge/qa/${knowledgeBaseId.value}`)
}

// 处理文本上传
const handleTextUpload = async () => {
  if (!textContent.value.trim()) {
    ElMessage.warning('请输入文本内容')
    return
  }

  textUploading.value = true
  isParsing.value = true
  parseStatus.value = {
    message: '⏳ 正在处理文本内容，请稍候...',
    type: 'info'
  }

  try {
    const fileName = '文本内容_' + Date.now() + '.txt'
    const res = await uploadTextContent({
      content: textContent.value,
      knowledgeBaseId: knowledgeBaseId.value,
      userId: userStore.id,
      fileName: fileName
    })

    if (res.code === 200) {
      uploadedTextFileName.value = fileName
      parseStatus.value = {
        message: '✅ 文本内容上传并处理成功！',
        type: 'success'
      }
      parseCompleted.value = true
      isParsing.value = false
      ElMessage.success('文本内容上传成功')
      showTextUploadDialog.value = false
      textContent.value = ''

      // 30秒后自动关闭成功提示
      if (successAutoCloseTimer.value) {
        clearTimeout(successAutoCloseTimer.value)
      }
      successAutoCloseTimer.value = setTimeout(() => {
        parseStatus.value = null
        uploadedTextFileName.value = ''
        successAutoCloseTimer.value = null
      }, 30000)
    } else {
      ElMessage.error(res.msg || '上传失败')
      isParsing.value = false
    }
  } catch (error) {
    console.error('文本上传失败:', error)
    ElMessage.error('上传失败，请重试')
    isParsing.value = false
    parseStatus.value = null
  } finally {
    textUploading.value = false
  }
}

// 弹框关闭时清空内容
const onDialogClosed = () => {
  textContent.value = ''
  if (tiptapEditorRef.value) {
    tiptapEditorRef.value.setContent('')
  }
}
</script>

<style scoped lang="scss">
.upload-container {
    padding: 24px;
}

.page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
}

.el-upload__tip {
    margin-top: 10px;
    color: #9ca3af;
}
</style>

<style lang="scss">
.upload-container .el-card {
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.upload-container .el-button {
    border-radius: 8px;
    font-weight: 500;
    padding: 8px 20px;
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

    &.el-button--primary {
        background: #fff;
        border-color: #d1d5db;
        color: #1f2937;

        &:hover {
            border-color: #9ca3af;
            color: #1f2937;
            transform: translateY(-2px);
        }
    }

    &.el-button--warning {
        background: #fefce8;
        border-color: #e5e0c0;
        color: #947a4a;

        &:hover {
            background: #fff;
            border-color: #d1b860;
            color: #7a6238;
        }
    }
}

.upload-container .el-upload-dragger {
    border-radius: 16px;
    border: 2px dashed #e5e7eb;
    background: #fafafa;

    &:hover {
        border-color: #d1d5db;
    }
}

.upload-container .el-alert {
    border-radius: 8px;
}

.action-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
}

.text-upload-dialog {
    .el-dialog__body {
        padding: 20px;
    }
}

.text-upload-content {
    .text-upload-tip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #f0f9ff;
        border-radius: 8px;
        color: #409eff;
        font-size: 13px;
        margin-bottom: 16px;
    }

    .tiptap-wrapper {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        min-height: 400px;
    }

    .text-upload-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;

        .char-count {
            font-size: 12px;
            color: #909399;
        }
    }
}
</style>
