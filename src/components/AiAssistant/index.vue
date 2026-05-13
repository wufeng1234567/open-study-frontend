<template>
    <div class="ai-assistant">
        <!-- 悬浮按钮 -->
        <div class="float-btn" :style="btnStyle" @mousedown="startDrag" @click="!isDragging && toggleDrawer()">
            <el-icon :size="24">
                <ChatDotRound />
            </el-icon>
        </div>

        <!-- 抽屉面板 -->
        <el-drawer v-model="visible" direction="rtl" size="420px" :with-header="false" :close-on-click-modal="false">
            <div class="assistant-container">
                <!-- 头部 -->
                <!-- 头部 -->
                <div class="assistant-header">
                    <div class="header-left">
                        <el-icon :size="20">
                            <ChatDotRound />
                        </el-icon>
                        <span>OpenStudy 助手</span>
                    </div>
                    <div class="header-right">
                        <el-icon class="clear-icon" @click="clearMessages" title="清空对话" v-if="activeTab === 'chat'">
                            <Delete />
                        </el-icon>
                        <el-icon class="close-icon" @click="visible = false">
                            <Close />
                        </el-icon>
                    </div>
                </div>
                <!-- Tab 切换 -->
                <div class="assistant-tabs">
                    <div :class="['tab-item', { active: activeTab === 'chat' }]" @click="activeTab = 'chat'">
                        <el-icon>
                            <ChatDotRound />
                        </el-icon>
                        <span>对话</span>
                    </div>
                    <div :class="['tab-item', { active: activeTab === 'banks' }]"
                        @click="activeTab = 'banks'; loadMyBanks()">
                        <el-icon>
                            <FolderOpened />
                        </el-icon>
                        <span>我的题库</span>
                    </div>
                    <div :class="['tab-item', { active: activeTab === 'message' }]"
                        @click="activeTab = 'message'; loadMessageBoard()">
                        <el-icon>
                            <ChatLineSquare />
                        </el-icon>
                        <span>留言板</span>
                    </div>
                </div>
                <!-- 题库面板 -->
                <div v-if="activeTab === 'banks'" class="banks-panel">
                    <!-- 搜索框 -->
                    <div class="bank-search">
                        <el-input v-model="bankKeyword" placeholder="搜索题库名称或科目" prefix-icon="Search" clearable
                            size="small" />
                    </div>

                    <!-- 题库列表 -->
                    <div class="bank-list" v-loading="bankLoading">
                        <div v-for="bank in filteredBanks" :key="bank.id" class="bank-item"
                            @click="jumpToBank(bank.id)">
                            <div class="bank-info">
                                <div class="bank-name">{{ bank.bankName }}</div>
                                <div class="bank-meta">
                                    <span class="bank-subject">{{ bank.subject || '未分类' }}</span>
                                    <span class="bank-count">{{ bank.totalQuestions || 0 }} 题</span>
                                </div>
                            </div>
                            <el-icon class="bank-arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <el-empty v-if="!bankLoading && filteredBanks.length === 0" description="暂无题库"
                            :image-size="60" />
                    </div>
                </div>

                <!-- 留言板面板 -->
                <div v-else-if="activeTab === 'message'" class="message-board-panel">
                    <!-- 搜索框 -->
                    <div class="msg-search-section">
                        <el-input v-model="msgSearchKeyword" placeholder="搜索留言..." clearable size="small"
                            @input="handleMsgSearch">
                            <template #prefix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                        </el-input>
                    </div>

                    <!-- 留言列表 -->
                    <div class="message-list" v-loading="messageLoading">
                        <div v-for="msg in filteredMessages" :key="msg.id" class="message-item">
                            <div class="message-avatar-wrap">
                                <div class="message-avatar">
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </div>
                            </div>
                            <div class="message-body">
                                <div class="message-meta">
                                    <span class="message-user">{{ msg.userName }}</span>
                                    <span class="message-time">{{ formatTime(msg.createTime) }}</span>
                                </div>
                                <div class="message-content">{{ msg.content }}</div>
                            </div>
                        </div>
                        <el-empty v-if="!messageLoading && filteredMessages.length === 0"
                            :description="msgSearchKeyword ? '未找到匹配的留言' : '暂无留言'" :image-size="60" />
                    </div>

                    <!-- 发布留言 -->
                    <div class="message-input">
                        <el-input v-model="messageContent" type="textarea" placeholder="写下你的留言..." :rows="2"
                            resize="none" />
                        <el-button class="submit-btn" size="small" :loading="messageSubmitting" @click="submitMessage">
                            发布
                        </el-button>
                    </div>
                </div>
                <template v-else>
                    <!-- 消息列表 -->

                    <div class="message-list" ref="messageListRef">

                        <!-- 欢迎卡片（无消息时显示） -->
                        <div v-if="messages.length === 0" class="welcome-card">
                            <div class="welcome-icon">🤖</div>
                            <div class="welcome-title">你好，我是 OpenStudy 助手</div>
                            <div class="welcome-desc">开源、低成本、低门槛的 AI 学习平台</div>

                            <!-- 快捷指令 -->
                            <div class="quick-actions">
                                <div class="quick-item" @click="sendQuickMessage('介绍一下 OpenStudy 平台')">
                                    <el-icon>
                                        <InfoFilled />
                                    </el-icon>
                                    <span>介绍平台</span>
                                </div>
                                <div class="quick-item" @click="activeTab = 'banks'; loadMyBanks()">
                                    <el-icon>
                                        <FolderOpened />
                                    </el-icon>
                                    <span>我的题库</span>
                                </div>
                                <div class="quick-item" @click="sendQuickMessage('如何创建题库？')">
                                    <el-icon>
                                        <QuestionFilled />
                                    </el-icon>
                                    <span>创建题库</span>
                                </div>
                                <div class="quick-item" @click="sendQuickMessage('怎么刷题？')">
                                    <el-icon>
                                        <EditPen />
                                    </el-icon>
                                    <span>刷题指南</span>
                                </div>
                                <div class="quick-item" @click="goToNotesEditor">
                                    <el-icon>
                                        <EditPen />
                                    </el-icon>
                                    <span>写笔记</span>
                                </div>
                                <div class="quick-item" @click="goToNotesList">
                                    <el-icon>
                                        <Notebook />
                                    </el-icon>
                                    <span>笔记分享</span>
                                </div>
                            </div>
                        </div>


                        <div v-for="(msg, idx) in messages" :key="idx" :class="['message-item', msg.role]">
                            <div class="message-avatar">
                                <el-icon v-if="msg.role === 'assistant'">
                                    <ChatDotRound />
                                </el-icon>
                                <el-icon v-else>
                                    <User />
                                </el-icon>
                            </div>
                            <div class="message-content">{{ msg.content }}</div>
                        </div>

                        <!-- 正在输入指示器 -->
                        <div v-if="isGenerating" class="message-item assistant">
                            <div class="message-avatar">
                                <el-icon>
                                    <ChatDotRound />
                                </el-icon>
                            </div>
                            <div class="message-content typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>



                    <!-- 底部输入区 -->
                    <div class="assistant-footer">
                        <div class="input-wrapper">
                            <el-input v-model="inputMessage" placeholder="输入消息..." @keyup.enter="sendMessage"
                                :disabled="isGenerating" />
                            <!-- 暂停按钮 -->
                            <el-button v-if="isGenerating && !stream.isPaused" class="pause-btn"
                                @click="stream.togglePause()">
                                <el-icon>
                                    <VideoPause />
                                </el-icon>
                            </el-button>
                            <!-- 继续按钮 -->
                            <el-button v-if="isGenerating && stream.isPaused" class="resume-btn"
                                @click="stream.togglePause()">
                                <el-icon>
                                    <VideoPlay />
                                </el-icon>
                            </el-button>
                            <!-- 发送按钮 -->
                            <el-button v-else-if="!isGenerating" class="send-btn" @click="sendMessage"
                                :disabled="!inputMessage.trim()">
                                <el-icon>
                                    <Promotion />
                                </el-icon>
                            </el-button>
                        </div>
                    </div>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { assistantStream } from '@/api/ai/ai'
import { listMyQuestionBank } from '@/api/questionBank/questionBank'
import { getLeaveMessageList, addLeaveMessage } from '@/api/leaveMessage'
import { useRouter } from 'vue-router'
import {
    ChatDotRound, Close, User, Promotion, FolderOpened,
    Search, ArrowRight, InfoFilled, QuestionFilled, EditPen, VideoPause, Delete, Notebook, ChatLineSquare
} from '@element-plus/icons-vue'

import { useStreamGeneration } from '@/composables/useStreamGeneration'

import { getConversationHistory, clearConversation } from '@/api/ai/ai'




const SESSION_ID = 'assistant'  // 固定会话ID


const router = useRouter()
const activeTab = ref('chat')
const myBanks = ref([])
const bankLoading = ref(false)
const bankKeyword = ref('')

// 留言板相关
const messageBoardList = ref([])
const messageLoading = ref(false)
const messageContent = ref('')
const messageSubmitting = ref(false)
const msgSearchKeyword = ref('')
let msgSearchTimer = null

const goToNotesEditor = () => {
    visible.value = false
    router.push('/front/notes/editor')
}

const goToNotesList = () => {
    visible.value = false
    router.push('/front/notes/list')
}

// 拖拽相关

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const btnPos = ref({ x: 0, y: 0 })

// 状态
const visible = ref(false)
const inputMessage = ref('')
const messageListRef = ref(null)

// 消息列表
const messages = reactive([])

// 占位索引（需要在 stream 定义前声明）
let aiMsgIndex = 0

// 悬浮按钮位置（可拖动，后续实现）
const btnStyle = ref({})

// 停止生成
const stopGeneration = () => {
    stream.abort()
}

// 初始化位置（默认右下角）
const initPosition = () => {
    btnPos.value = {
        x: window.innerWidth - 100,
        y: window.innerHeight - 150
    }
}

// 开始拖拽
const startDrag = (e) => {
    isDragging.value = true
    dragStart.value = {
        x: e.clientX - btnPos.value.x,
        y: e.clientY - btnPos.value.y
    }
}

// 拖拽中
const onDrag = (e) => {
    if (!isDragging.value) return
    e.preventDefault()

    let newX = e.clientX - dragStart.value.x
    let newY = e.clientY - dragStart.value.y

    // 边界限制
    const btnSize = 52
    newX = Math.max(10, Math.min(window.innerWidth - btnSize - 10, newX))
    newY = Math.max(10, Math.min(window.innerHeight - btnSize - 10, newY))

    btnPos.value = { x: newX, y: newY }
    btnStyle.value = {
        left: newX + 'px',
        top: newY + 'px',
        right: 'auto',
        bottom: 'auto'
    }
}

// 结束拖拽
const stopDrag = () => {
    if (isDragging.value) {
        // 吸附到边缘
        const btnSize = 52
        const centerX = btnPos.value.x + btnSize / 2
        if (centerX < window.innerWidth / 2) {
            btnPos.value.x = 20  // 吸附左边
        } else {
            btnPos.value.x = window.innerWidth - btnSize - 20  // 吸附右边
        }
        btnStyle.value = {
            left: btnPos.value.x + 'px',
            top: btnPos.value.y + 'px',
            right: 'auto',
            bottom: 'auto',
            transition: 'left 0.3s ease'
        }
    }
    isDragging.value = false
}



// 加载我的题库
const loadMyBanks = async () => {
    bankLoading.value = true
    try {
        const res = await listMyQuestionBank()
        if (res.code === 200) {
            myBanks.value = res.data || []
        }
    } finally {
        bankLoading.value = false
    }
}

// 跳转到题库编辑
const jumpToBank = (bankId) => {
    router.push(`/front/studio/create?bankId=${bankId}`)
    visible.value = false
}

// 加载留言板
const loadMessageBoard = async () => {
    messageLoading.value = true
    try {
        const res = await getLeaveMessageList()
        if (res.code === 200) {
            messageBoardList.value = res.data || []
        }
    } finally {
        messageLoading.value = false
    }
}

// 提交留言
const submitMessage = async () => {
    if (!messageContent.value.trim()) return
    if (messageSubmitting.value) return

    messageSubmitting.value = true
    try {
        const res = await addLeaveMessage({ content: messageContent.value.trim() })
        if (res.code === 200) {
            messageContent.value = ''
            await loadMessageBoard()
        }
    } finally {
        messageSubmitting.value = false
    }
}

// 格式化时间
const formatTime = (time) => {
    if (!time) return ''
    const date = new Date(time)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
}

// 过滤题库
const filteredBanks = computed(() => {
    if (!bankKeyword.value) return myBanks.value
    const keyword = bankKeyword.value.toLowerCase()
    return myBanks.value.filter(b =>
        b.bankName?.toLowerCase().includes(keyword) ||
        b.subject?.toLowerCase().includes(keyword)
    )
})

// 过滤留言（带防抖）
const filteredMessages = computed(() => {
    if (!msgSearchKeyword.value) return messageBoardList.value
    const keyword = msgSearchKeyword.value.toLowerCase()
    return messageBoardList.value.filter(m =>
        m.content?.toLowerCase().includes(keyword) ||
        m.userName?.toLowerCase().includes(keyword)
    )
})

// 留言搜索防抖
const handleMsgSearch = () => {
    if (msgSearchTimer) clearTimeout(msgSearchTimer)
    msgSearchTimer = setTimeout(() => {
        // 搜索由 computed 处理，这里只是触发更新
    }, 300)
}

// 切换抽屉
const toggleDrawer = () => {
    visible.value = !visible.value
}


// 替换原有的 isGenerating，使用 composable
const stream = useStreamGeneration({
    onChunk: (fullContent) => {
        messages[aiMsgIndex].content = fullContent
        scrollToBottom()
    },
    onComplete: () => {
        // 可以保存 AI 回复到后端
    },
    onError: (error) => {
        console.error('发送失败:', error)
        messages[aiMsgIndex].content = '抱歉，发送失败，请重试。'
    }
})


const isGenerating = stream.isGenerating




// 发送消息
const sendMessage = async () => {
    const content = inputMessage.value.trim()
    if (!content || isGenerating.value) return

    messages.push({ role: 'user', content })
    inputMessage.value = ''
    await scrollToBottom()

    aiMsgIndex = messages.length  // 使用外部变量
    messages.push({ role: 'assistant', content: '' })

    stream.start((handleChunk, handleComplete, handleError, signal) => {
        assistantStream(content, handleChunk, handleComplete, handleError, signal)
    })
}


// 快捷发送消息
const sendQuickMessage = (msg) => {
    activeTab.value = 'chat'
    inputMessage.value = msg
    sendMessage()
}

// 滚动到底部
const scrollToBottom = async () => {
    await nextTick()
    if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
}

// 打开时滚动到底部
watch(visible, (val) => {
    if (val) {
        scrollToBottom()
    }
})


const clearMessages = async () => {
    try {
        await clearConversation(SESSION_ID)
        messages.length = 0
    } catch (e) {
        console.error('清空失败:', e)
    }
}

const loadHistory = async () => {
    try {
        const res = await getConversationHistory(SESSION_ID)
        if (res.code === 200 && res.data) {
            messages.push(...res.data)
        }
    } catch (e) {
        console.error('加载历史失败:', e)
    }
}


// 监听全局鼠标事件
onMounted(() => {
    initPosition()
    loadHistory()
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
})

</script>

<style scoped lang="scss">
.ai-assistant {
    .float-btn {
        position: fixed;
        left: auto;
        right: 24px;
        bottom: 80px;
        width: 52px;
        height: 52px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4b5563;
        cursor: grab;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        transition: box-shadow 0.2s ease;
        z-index: 1000;
        user-select: none;

        &:active {
            cursor: grabbing;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        &:hover {
            background: #ffffff;
            color: #1a1a1a;
        }
    }
}

.assistant-container {
    display: flex;
    flex-direction: column;
    height: 100%;

    .assistant-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;

        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
        }

        .close-icon {
            cursor: pointer;
            color: #909399;

            &:hover {
                color: #303133;
            }
        }
    }

    .message-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px;

        .message-item {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;

            &.user {
                flex-direction: row-reverse;

                .message-avatar {
                    background: #ecf5ff;
                    color: #409eff;
                }

                .message-content {
                    background: #409eff;
                    color: white;
                    border-radius: 16px 4px 16px 16px;
                }
            }

            &.assistant {
                .message-avatar {
                    background: #f0f2f5;
                    color: #606266;
                }

                .message-content {
                    background: #f0f2f5;
                    color: #303133;
                    border-radius: 4px 16px 16px 16px;
                }
            }

            .message-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .message-content {
                padding: 12px 16px;
                max-width: 280px;
                line-height: 1.5;
                font-size: 14px;
                word-break: break-word;

                &.typing {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 20px;

                    span {
                        width: 8px;
                        height: 8px;
                        background: #909399;
                        border-radius: 50%;
                        animation: typing 1.4s infinite ease-in-out;

                        &:nth-child(1) {
                            animation-delay: 0s;
                        }

                        &:nth-child(2) {
                            animation-delay: 0.2s;
                        }

                        &:nth-child(3) {
                            animation-delay: 0.4s;
                        }
                    }
                }
            }
        }
    }

    .assistant-footer {
        padding: 16px;
        border-top: 1px solid #e4e7ed;

        .input-wrapper {
            display: flex;
            gap: 8px;

            .el-input {
                flex: 1;

                :deep(.el-input__wrapper) {
                    border-radius: 8px;
                }
            }

            .send-btn,
            .stop-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .stop-btn {
                background: #fef0f0;
                border-color: #fde2e2;
                color: #f56c6c;

                &:hover {
                    background: #f56c6c;
                    border-color: #f56c6c;
                    color: white;
                }
            }
        }
    }
}

@keyframes typing {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.5;
    }

    30% {
        transform: translateY(-8px);
        opacity: 1;
    }
}

.assistant-tabs {
    display: flex;
    padding: 8px 16px;
    border-bottom: 1px solid #e4e7ed;
    gap: 24px;

    .tab-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 0;
        font-size: 14px;
        color: #909399;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
            color: #303133;
        }

        &.active {
            color: #1a6eff;
            border-bottom-color: #1a6eff;
        }
    }
}

.banks-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .bank-search {
        padding: 12px 16px;

        :deep(.el-input__wrapper) {
            border-radius: 8px;
        }
    }

    .bank-list {
        flex: 1;
        overflow-y: auto;
        padding: 0 16px 16px;

        .bank-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 12px;
            margin-bottom: 8px;
            background: #f8f9fa;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: #e8f0fe;
            }

            .bank-info {
                flex: 1;

                .bank-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #303133;
                    margin-bottom: 6px;
                }

                .bank-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: #909399;
                }
            }

            .bank-arrow {
                color: #c0c4cc;
                font-size: 14px;
            }
        }
    }
}

.welcome-card {
    text-align: center;
    padding: 20px 16px;

    .welcome-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }

    .welcome-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
    }

    .welcome-desc {
        font-size: 14px;
        color: #909399;
        margin-bottom: 24px;
    }

    .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .quick-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 14px 8px;
            background: #f8f9fa;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: #e8f0fe;
            }

            .el-icon {
                font-size: 22px;
                color: #1a6eff;
            }

            span {
                font-size: 12px;
                color: #606266;
            }
        }
    }

}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .clear-icon {
        cursor: pointer;
        color: #909399;

        &:hover {
            color: #f56c6c;
        }
    }

    .close-icon {
        cursor: pointer;
        color: #909399;

        &:hover {
            color: #303133;
        }
    }
}

.pause-btn,
.resume-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e6a23c;
    color: white;
    border: none;

    &:hover {
        background: #d48c1c;
    }
}

.message-board-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .msg-search-section {
        padding: 12px 16px 8px;

        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px #e5e7eb;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: #f8f9fa;

            &:hover {
                box-shadow: 0 0 0 1px #d1d5db;
            }

            &.is-focus {
                box-shadow: 0 0 0 1px #b3b3b3;
                background: #fff;
            }
        }
    }

    .message-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 16px 12px;

        .message-item {
            display: flex;
            gap: 10px;
            padding: 12px;
            margin-bottom: 10px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                border-color: #d1d5db;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            }

            .message-avatar-wrap {
                flex-shrink: 0;

                .message-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f3f4f6;
                    color: #6b7280;
                }
            }

            .message-body {
                flex: 1;
                min-width: 0;

                .message-meta {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 6px;

                    .message-user {
                        font-size: 13px;
                        font-weight: 600;
                        color: #1f2937;
                    }

                    .message-time {
                        font-size: 11px;
                        color: #9ca3af;
                    }
                }

                .message-content {
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.6;
                    word-break: break-word;
                }
            }
        }
    }

    .message-input {
        padding: 12px 16px 16px;
        border-top: 1px solid #f3f4f6;
        display: flex;
        gap: 10px;
        align-items: flex-end;
        background: #fff;

        .el-textarea {
            flex: 1;

            :deep(.el-textarea__inner) {
                border-radius: 8px;
                border-color: #e5e7eb;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 13px;

                &:hover {
                    border-color: #d1d5db;
                }

                &:focus {
                    border-color: #b3b3b3;
                    box-shadow: none;
                }
            }
        }

        .submit-btn {
            flex-shrink: 0;
            height: 32px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 13px;
            padding: 0 14px;
            background: #fff;
            border: 1px solid #e5e7eb;
            color: #6b7280;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                transform: translateY(-2px);
                border-color: #d1d5db;
                color: #4b5563;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            }

            &:active {
                transform: translateY(0);
            }
        }
    }
}
</style>