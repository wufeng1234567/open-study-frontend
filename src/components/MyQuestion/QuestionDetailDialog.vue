<!-- src/components/MyQuestion/QuestionDetailDialog.vue -->
<template>
  <el-dialog
    :model-value="visible"        
    :title="dialogTitle"
    width="85%"
    :fullscreen="isFullscreen"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    @close="$emit('close')"
    class="question-detail-dialog"
    custom-class="question-detail-dialog-custom"
  >
    <!-- 题目显示区域 -->
    <div v-if="currentQuestionDetail" class="dialog-content">
      <!-- 题目信息概览（新增） -->
      <div class="question-info-overview">
        <el-card shadow="never" class="info-panel">
          <template #header>
            <div class="panel-header">
              <el-icon><InfoFilled /></el-icon>
              <span class="panel-title">{{ getPanelTitle() }}</span>
              <span class="question-type-badge" :class="getQuestionTypeBadgeClass()">
                {{ getQuestionTypeBadgeText() }}
              </span>
            </div>
          </template>
          
          <div class="info-sections">
            <!-- 错题信息 -->
            <div v-if="currentQuestionType === 'wrong'" class="info-section wrong-section">
              <div class="section-header">
                <el-icon><Warning /></el-icon>
                <span>错题记录</span>
                <el-tag type="danger" size="small" style="margin-left: auto;">错题</el-tag>
              </div>
              <div class="section-content">
                <div class="info-row">
                  <span class="info-label">错误次数：</span>
                  <el-tag type="danger" size="small">{{ getErrorCount() }}</el-tag>
                </div>
                <div class="info-row" v-if="getLastErrorTime()">
                  <span class="info-label">最近错误：</span>
                  <span class="info-value">{{ formatTime(getLastErrorTime()) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">掌握状态：</span>
                  <el-tag :type="getMasteredTagType()" size="small">
                    {{ getMasteredStatusText() }}
                  </el-tag>
                </div>
                <div class="info-row" v-if="getReviewCount()">
                  <span class="info-label">复习次数：</span>
                  <span class="info-value">{{ getReviewCount() }}</span>
                </div>
                <div class="info-row" v-if="getErrorTime()">
                  <span class="info-label">首次错误：</span>
                  <span class="info-value">{{ formatTime(getErrorTime()) }}</span>
                </div>
                <div class="info-row" v-if="getNotes() && !isNotesFromWrong()">
                  <span class="info-label">错因备注：</span>
                  <div class="info-value notes-content">
                    {{ getNotes() }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 收藏信息 -->
            <div v-if="currentQuestionType === 'favorite'" class="info-section favorite-section">
              <div class="section-header">
                <el-icon><StarFilled /></el-icon>
                <span>收藏信息</span>
                <el-tag type="warning" size="small" style="margin-left: auto;">收藏</el-tag>
              </div>
              <div class="section-content">
                <div class="info-row">
                  <span class="info-label">收藏状态：</span>
                  <el-tag :type="getFavoriteStatusType()" size="small">
                    {{ getFavoriteStatusText() }}
                  </el-tag>
                </div>
                <div class="info-row">
                  <span class="info-label">收藏时间：</span>
                  <span class="info-value">{{ formatTime(getFavoriteTime()) }}</span>
                </div>
                <div class="info-row" v-if="isStarred()">
                  <span class="info-label">标星状态：</span>
                  <el-tag type="warning" size="small">
                    <el-icon><StarFilled /></el-icon>
                    已标星
                  </el-tag>
                </div>
                <div class="info-row" v-if="getUpdateTime()">
                  <span class="info-label">更新时间：</span>
                  <span class="info-value">{{ formatTime(getUpdateTime()) }}</span>
                </div>
              </div>
            </div>
            
            <!-- 题目基本信息 -->
            <div class="info-section general-section">
              <div class="section-header">
                <el-icon><Document /></el-icon>
                <span>题目基本信息</span>
              </div>
              <div class="section-content">
                <div class="info-row">
                  <span class="info-label">题目ID：</span>
                  <span class="info-value">{{ getQuestionId() }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">题型：</span>
                  <el-tag size="small" :class="getQuestionTypeClass()">
                    {{ getQuestionTypeDisplayText() }}
                  </el-tag>
                </div>
                <div class="info-row" v-if="getDifficultyValue()">
                  <span class="info-label">难度：</span>
                  <el-tag :type="getDifficultyType(getDifficultyValue())" size="small">
                    {{ getDifficultyText(getDifficultyValue()) }}
                  </el-tag>
                </div>
                <div class="info-row" v-if="getBankName()">
                  <span class="info-label">所属题库：</span>
                  <span class="info-value">{{ getBankName() }}</span>
                </div>
                <div class="info-row" v-if="getSubjectInfo()">
                  <span class="info-label">所属科目：</span>
                  <span class="info-value">{{ getSubjectInfo() }}</span>
                </div>
              </div>
            </div>
            
            <!-- 附加信息 -->
            <div v-if="hasAdditionalInfo()" class="info-section meta-section">
              <div class="section-header">
                <el-icon><Notebook /></el-icon>
                <span>附加信息</span>
              </div>
              <div class="section-content">
                <div v-if="shouldShowNotes()" class="info-row notes-row">
                  <span class="info-label">{{ getNotesLabel() }}：</span>
                  <div class="info-value notes-content">
                    {{ getNotes() }}
                  </div>
                </div>
                <div v-if="getTagsArray().length > 0" class="info-row tags-row">
                  <span class="info-label">标签：</span>
                  <div class="info-value tags-content">
                    <el-tag
                      v-for="(tag, index) in getTagsArray()"
                      :key="index"
                      size="small"
                      type="info"
                      class="tag-item"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 时间信息 -->
            <div class="info-section time-section">
              <div class="section-header">
                <el-icon><Clock /></el-icon>
                <span>时间信息</span>
              </div>
              <div class="section-content">
                <div class="info-row" v-if="getCreateTime()">
                  <span class="info-label">创建时间：</span>
                  <span class="info-value">{{ formatTime(getCreateTime()) }}</span>
                </div>
                <div class="info-row" v-if="getUpdateTime() && currentQuestionType !== 'favorite'">
                  <span class="info-label">更新时间：</span>
                  <span class="info-value">{{ formatTime(getUpdateTime()) }}</span>
                </div>
                <div class="info-row" v-if="currentQuestionDetail?.status !== undefined">
                  <span class="info-label">题目状态：</span>
                  <el-tag :type="getStatusType()" size="small">
                    {{ getStatusText() }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <QuestionDisplay
        :current-question="currentQuestionDetail"
        :current-question-index="currentQuestionIndex"
        :total-questions="dialogQuestions.length"
        :selected-answer="selectedAnswer"
        :sub-fill-blank-answers="subFillBlankAnswers"
        :sub-essay-answers="subEssayAnswers"
        :answers="answers"
        @select-option="$emit('select-option', $event)"
        @update-answer="$emit('update-answer', $event)"
        @select-sub-option="$emit('select-sub-option', $event)"
        @update-sub-fill-blank-answer="$emit('update-sub-fill-blank-answer', $event)"
        @update-sub-essay-answer="$emit('update-sub-essay-answer', $event)"
      />
      
      <!-- 底部导航 -->
      <QuestionNavigation
        :show-prev="currentQuestionIndex > 0"
        :show-next="currentQuestionIndex < dialogQuestions.length - 1"
        :question-id="currentQuestionDetail?.id"
        @prev-question="$emit('prev-question')"
        @next-question="$emit('next-question')"
        @mark="$emit('mark')"
        @add-note="$emit('add-note')"
        @report="$emit('report')"
      />
    </div>
    <div v-else class="loading-dialog">
      <el-skeleton :rows="10" animated />
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('toggle-fullscreen')">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
        <el-button @click="$emit('close')">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { FullScreen, InfoFilled, Warning, StarFilled, Document, Notebook, Clock, Flag } from '@element-plus/icons-vue'
import QuestionDisplay from '@/components/PracticeComponent/QuestionDisplay.vue'
import QuestionNavigation from '@/components/PracticeComponent/QuestionNavigation.vue'

const props = defineProps({
  visible: Boolean,
  currentQuestionDetail: Object,
  currentQuestionIndex: Number,
  dialogQuestions: Array,
  isFullscreen: Boolean,
  selectedAnswer: [String, Number],
  subFillBlankAnswers: Object,
  subEssayAnswers: Object,
  answers: Array,
  currentFavoriteQuestion: Object,
  questionType: {
    type: String,
    default: 'favorite'
  }
})

const emit = defineEmits([
  'close', 'toggle-fullscreen', 'prev-question', 'next-question',
  'select-option', 'update-answer', 'select-sub-option',
  'update-sub-fill-blank-answer', 'update-sub-essay-answer',
  'mark', 'add-note', 'report'
])

// 使用 ref 来跟踪当前题目类型
const currentQuestionType = ref(props.questionType || 'favorite')

// 监听 questionType 的变化
watch(() => props.questionType, (newType) => {
  if (newType) {
    currentQuestionType.value = newType
    console.log('📌 QuestionDetailDialog 接收到 questionType:', newType)
  }
})

// 计算属性
const isWrongQuestion = computed(() => currentQuestionType.value === 'wrong')
const isFavoriteQuestion = computed(() => currentQuestionType.value === 'favorite')

// 获取面板标题
const getPanelTitle = () => {
  const titleMap = {
    wrong: '错题信息概览',
    favorite: '收藏信息概览',
    marked: '斩题信息概览'
  }
  return titleMap[currentQuestionType.value] || '题目信息概览'
}

// 获取对话框标题
const dialogTitle = computed(() => {
  if (!props.currentQuestionDetail) return '题目详情'
  
  const questionTypeText = getQuestionTypeDisplayText()
  const id = getQuestionId()
  const pageInfo = props.dialogQuestions.length > 1 
    ? `(${props.currentQuestionIndex + 1}/${props.dialogQuestions.length})`
    : ''
    
  return `题目详情 - ${questionTypeText} ${pageInfo}`
})

// 辅助函数
const getQuestionId = () => {
  return props.currentFavoriteQuestion?.questionId || 
         props.currentQuestionDetail?.id || 
         '--'
}

// 错题相关函数
const getErrorCount = () => {
  return props.currentFavoriteQuestion?.errorCount || 1
}

const getLastErrorTime = () => {
  return props.currentFavoriteQuestion?.lastErrorTime
}

const getErrorTime = () => {
  return props.currentFavoriteQuestion?.errorTime
}

const getReviewCount = () => {
  return props.currentFavoriteQuestion?.reviewCount
}

const getMasteredTagType = () => {
  const isMastered = props.currentFavoriteQuestion?.isMastered
  return isMastered ? 'success' : 'warning'
}

const getMasteredStatusText = () => {
  const isMastered = props.currentFavoriteQuestion?.isMastered
  return isMastered ? '已掌握' : '未掌握'
}

// 收藏相关函数
const getFavoriteStatusType = () => {
  const status = props.currentFavoriteQuestion?.favoriteStatus
  const typeMap = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    0: 'info'
  }
  return typeMap[status] || 'primary'
}

const getFavoriteStatusText = () => {
  const status = props.currentFavoriteQuestion?.favoriteStatus
  const statusMap = {
    1: '正常收藏',
    2: '已掌握',
    3: '待复习',
    0: '已取消'
  }
  return statusMap[status] || '正常收藏'
}

const getFavoriteTime = () => {
  return props.currentFavoriteQuestion?.createTime
}

const isStarred = () => {
  return props.currentFavoriteQuestion?.isStarred
}

// 通用函数
const getDifficultyValue = () => {
  return props.currentQuestionDetail?.difficulty || 
         props.currentFavoriteQuestion?.questionDetail?.difficulty ||
         props.currentFavoriteQuestion?.difficulty
}

const getBankName = () => {
  return props.currentFavoriteQuestion?.bankDetail?.bankName || 
         props.currentFavoriteQuestion?.bankName ||
         props.currentQuestionDetail?.bankName ||
         '--'
}

const getSubjectInfo = () => {
  return props.currentFavoriteQuestion?.subjectName || 
         props.currentQuestionDetail?.subject ||
         '--'
}

const getNotes = () => {
  return props.currentFavoriteQuestion?.notes || 
         props.currentQuestionDetail?.notes
}

const getNotesLabel = () => {
  if (currentQuestionType.value === 'wrong') {
    return isNotesFromWrong() ? '错因备注' : '备注'
  }
  return '备注'
}

const isNotesFromWrong = () => {
  const notes = getNotes()
  return notes && (
    notes.includes('错误答案') || 
    notes.includes('正确答案') ||
    notes.includes('错误选项') ||
    notes.includes('正确选项')
  )
}

const shouldShowNotes = () => {
  const notes = getNotes()
  if (!notes) return false
  if (currentQuestionType.value === 'wrong') {
    return true // 错题总是显示备注
  }
  return true
}

const hasAdditionalInfo = () => {
  return shouldShowNotes() || getTagsArray().length > 0
}

const getCreateTime = () => {
  return props.currentFavoriteQuestion?.createTime || 
         props.currentQuestionDetail?.createTime
}

const getUpdateTime = () => {
  return props.currentFavoriteQuestion?.updateTime || 
         props.currentQuestionDetail?.updateTime
}

// 题型相关函数
const getQuestionTypeDisplayText = () => {
  const type = props.currentQuestionDetail?.questionType || props.currentQuestionDetail?.type
  return getQuestionTypeText(type)
}

const getQuestionTypeClass = () => {
  const type = props.currentQuestionDetail?.questionType || props.currentQuestionDetail?.type
  const typeStr = typeof type === 'number' ? 
    ['single', 'multiple', 'truefalse', 'fillblank', 'essay', 'readingComprehension', 'cloze'][type - 1] || '' 
    : type
  
  const classMap = {
    'single': 'type-single',
    'multiple': 'type-multiple',
    'truefalse': 'type-truefalse',
    'fillblank': 'type-fillblank',
    'essay': 'type-essay',
    'readingComprehension': 'type-reading',
    'cloze': 'type-cloze'
  }
  return classMap[typeStr] || ''
}

// 将字符串题型转换为数字
const getQuestionTypeNumber = (typeStr) => {
  if (!typeStr) return 0
  
  const typeMap = {
    'single': 1,
    'multiple': 2,
    'judge': 3,
    'truefalse': 3,
    'fill': 4,
    'fillblank': 4,
    'essay': 5,
    'reading': 6,
    'readingComprehension': 6,
    'cloze': 7
  }
  return typeMap[typeStr] || 0
}

// 获取题型文本
const getQuestionTypeText = (type) => {
  if (type == null) return '未知题型'
  
  // 处理数字类型
  const numType = typeof type === 'number' ? type : getQuestionTypeNumber(type)
  
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题',
    6: '阅读理解',
    7: '完形填空'
  }
  return typeMap[numType] || '未知题型'
}

// 获取题目类型徽章类
const getQuestionTypeBadgeClass = () => {
  if (isWrongQuestion.value) return 'badge-wrong'
  if (isFavoriteQuestion.value) return 'badge-favorite'
  if (currentQuestionType.value === 'marked') return 'badge-marked'
  return 'badge-general'
}

// 获取题目类型徽章文本
const getQuestionTypeBadgeText = () => {
  if (isWrongQuestion.value) return '错题'
  if (isFavoriteQuestion.value) return '收藏'
  if (currentQuestionType.value === 'marked') return '斩题'
  return '题目'
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '--'
  try {
    // 处理可能是字符串的时间
    const date = new Date(time)
    if (isNaN(date.getTime())) {
      // 如果是已经格式化的时间字符串，直接返回
      return time
    }
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-')
  } catch (e) {
    console.warn('时间格式化失败:', time, e)
    return time
  }
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  if (!difficulty) return '--'
  
  const diffMap = {
    1: '简单',
    2: '中等',
    3: '困难',
    4: '极难'
  }
  return diffMap[difficulty] || '未知'
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  if (!difficulty) return ''
  
  const typeMap = {
    1: 'success',
    2: 'info',
    3: 'warning',
    4: 'danger'
  }
  return typeMap[difficulty] || ''
}

// 解析标签字符串
const getTagsArray = () => {
  const tags = props.currentFavoriteQuestion?.tags || props.currentQuestionDetail?.tags
  if (!tags) return []
  
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    return tags.split(',').filter(tag => tag.trim()).map(tag => tag.trim())
  }
  return []
}

// 获取状态类型
const getStatusType = () => {
  const status = props.currentQuestionDetail?.status
  const statusMap = {
    0: 'success',
    1: 'info',
    2: 'warning',
    9: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = () => {
  const status = props.currentQuestionDetail?.status
  const statusMap = {
    0: '正常',
    1: '启用',
    2: '禁用',
    9: '删除'
  }
  return statusMap[status] || '未知'
}
</script>

<style scoped>
.question-detail-dialog {
  .dialog-content {
    min-height: 500px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .question-info-overview {
    margin-bottom: 10px;
  }
  
  .info-panel {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fff;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .panel-header .el-icon {
    color: #409eff;
    font-size: 20px;
  }
  
  .panel-title {
    font-weight: 600;
    font-size: 18px;
    color: #303133;
    flex: 1;
  }
  
  .question-type-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    
    &.badge-wrong {
      background: #f56c6c;
    }
    
    &.badge-favorite {
      background: #e6a23c;
    }
    
    &.badge-marked {
      background: #67c23a;
    }
    
    &.badge-general {
      background: #409eff;
    }
  }
  
  .info-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }
  
  .info-section {
    padding: 16px;
    border-radius: 8px;
    background: #f8f9fa;
    border: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .wrong-section {
    border-left: 4px solid #f56c6c;
    background: linear-gradient(135deg, #fff2f0 0%, #fff 100%);
  }
  
  .favorite-section {
    border-left: 4px solid #e6a23c;
    background: linear-gradient(135deg, #fff7e6 0%, #fff 100%);
  }
  
  .general-section {
    border-left: 4px solid #409eff;
    background: linear-gradient(135deg, #e6f7ff 0%, #fff 100%);
  }
  
  .meta-section {
    border-left: 4px solid #9254de;
    background: linear-gradient(135deg, #f9f0ff 0%, #fff 100%);
  }
  
  .time-section {
    border-left: 4px solid #8c8c8c;
    background: linear-gradient(135deg, #fafafa 0%, #fff 100%);
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #e4e7ed;
    font-weight: 500;
    color: #606266;
  }
  
  .section-header .el-icon {
    font-size: 18px;
    color: inherit;
  }
  
  .wrong-section .section-header .el-icon {
    color: #f56c6c;
  }
  
  .favorite-section .section-header .el-icon {
    color: #e6a23c;
  }
  
  .section-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .info-label {
    color: #606266;
    min-width: 90px;
    font-weight: 500;
    flex-shrink: 0;
    padding-top: 2px;
  }
  
  .info-value {
    color: #303133;
    font-weight: 500;
    flex: 1;
    word-break: break-word;
  }
  
  .notes-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .notes-content {
    padding: 10px 14px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    font-size: 14px;
    line-height: 1.6;
    color: #606266;
    font-style: normal;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
    width: 100%;
  }
  
  .tags-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .tags-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tag-item {
    margin-right: 4px;
  }
  
  /* 题型标签样式 */
  .type-single {
    background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
    color: white;
    border: none;
  }
  
  .type-multiple {
    background: linear-gradient(135deg, #67c23a 0%, #95de64 100%);
    color: white;
    border: none;
  }
  
  .type-truefalse {
    background: linear-gradient(135deg, #e6a23c 0%, #ffd666 100%);
    color: white;
    border: none;
  }
  
  .type-fillblank {
    background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
    color: white;
    border: none;
  }
  
  .type-essay {
    background: linear-gradient(135deg, #f56c6c 0%, #ff9c6e 100%);
    color: white;
    border: none;
  }
  
  .type-reading {
    background: linear-gradient(135deg, #8e44ad 0%, #b37feb 100%);
    color: white;
    border: none;
  }
  
  .type-cloze {
    background: linear-gradient(135deg, #3498db 0%, #69c0ff 100%);
    color: white;
    border: none;
  }
  
  .loading-dialog {
    padding: 20px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>

<style>
.question-detail-dialog-custom .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.question-detail-dialog-custom .el-dialog__footer {
  padding: 16px 24px;
}

.question-detail-dialog-custom .el-dialog__header {
  padding: 20px 24px 10px;
  border-bottom: 1px solid #e4e7ed;
}
</style>