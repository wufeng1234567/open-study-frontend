<!-- src/components/PracticeComponent/QuestionDisplay.vue -->
<template>
  <div class="question-area">

    <!-- 题型提示区域 -->
    <div class="question-type-hint" :class="getQuestionTypeClass(currentQuestion?.type)">
      <span class="type-icon">
        <el-icon v-if="currentQuestion?.type === 'single'"><Select /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'multiple'"><CircleCheck /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'truefalse'"><Check /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'fillblank'"><EditPen /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'essay'"><Document /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'readingComprehension'"><Reading /></el-icon>
        <el-icon v-else-if="currentQuestion?.type === 'cloze'"><Edit /></el-icon>
      </span>
      <span class="type-text">{{ getQuestionTypeText(currentQuestion?.type) }}</span>
      <!-- 多选题提示 -->
      <span class="multi-hint" v-if="currentQuestion?.type === 'multiple'">（可多选）</span>
      <!-- 判断题提示 -->
      <span class="truefalse-hint" v-if="currentQuestion?.type === 'truefalse'">（判断对错）</span>
    </div>

    <!-- 题目标题 -->
    <div class="question-header">
      <!-- 显示主干内容（阅读理解 & 完形填空） -->
      <div
        v-if="currentQuestion?.hasMainContent && currentQuestion?.mainContent"
        class="main-content-box"
        style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 4px"
      >
        <h4>{{ currentQuestion.mainTitle }}</h4>
        <div v-html="formatMainContent(currentQuestion.mainContent)"></div>
      </div>
      <span class="question-index">{{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</span>

      <!-- 只有 currentQuestion 存在才显示题目内容 -->
      <template v-if="currentQuestion">
        <!-- 移除这里的 question-type span，移动到上面的提示区域 -->
        <span class="question-title" v-if="currentQuestion.type !== 'cloze' && currentQuestion.type !== 'readingComprehension'">{{ currentQuestion.question }}</span>
      </template>

      <!-- 如果还没加载出来，显示"加载中" -->
      <span v-else>加载中...</span>
    </div>

    <!-- 题目内容区（根据题型动态渲染） -->
    <div class="question-body" v-if="currentQuestion">
      <!-- 单选题、多选题、判断题 -->
      <div v-if="['single', 'multiple', 'truefalse'].includes(currentQuestion.type)" class="options">
        <div
          v-for="(option, index) in displayOptions"
          :key="index"
          class="option-item"
          :class="{
            'user-selected': isUserSelected(index),
            'correct-answer': isCorrectOption(index)
          }"
          @click="$emit('select-option', index)"
        >
          <span class="option-letter">{{ getOptionLabel(index) }}.</span>
          <span class="option-text">{{ option }}</span>
        </div>
      </div>

      <!-- 填空题 -->
      <div v-else-if="currentQuestion.type === 'fillblank'" class="input-area">
        <el-input
          :model-value="selectedAnswer"
          @update:model-value="value => $emit('update-answer', value)"
          placeholder="请输入答案"
          size="small"
          clearable
        />
      </div>

      <!-- 简答题 -->
      <div v-else-if="currentQuestion.type === 'essay'" class="input-area">
        <el-input
          :model-value="selectedAnswer"
          @update:model-value="value => $emit('update-answer', value)"
          type="textarea"
          :rows="4"
          placeholder="请输入您的答案"
          clearable
        />
      </div>

      <!-- 阅读理解 & 完形填空 -->
      <ReadingComprehensionDisplay
        v-else-if="['readingComprehension', 'cloze'].includes(currentQuestion.type)"
        :current-question="currentQuestion"
        :current-question-index="currentQuestionIndex"
        :answers="answers"
        :sub-fill-blank-answers="subFillBlankAnswers"
        :sub-essay-answers="subEssayAnswers"
        @select-sub-option="(subIndex, optionIndex) => $emit('select-sub-option', subIndex, optionIndex)"
        @update-sub-fill-blank-answer="(subIndex, value) => $emit('update-sub-fill-blank-answer', subIndex, value)"
        @update-sub-essay-answer="(subIndex, value) => $emit('update-sub-essay-answer', subIndex, value)"
      />

      <!-- 其他题型（预留） -->
      <div v-else>
        <p>暂不支持该题型</p>
      </div>
    </div>

    <!-- ✅ 修复：完整的解析区域 -->
    <div class="question-analysis" v-if="currentQuestion && currentQuestion.showAnalysis">
      <el-divider content-position="left">
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon><InfoFilled /></el-icon>
          <span>答案解析</span>
        </div>
      </el-divider>
      
      <div class="analysis-content">
        <!-- 显示正确答案 -->
        <div class="correct-answer-section">
          <div class="answer-header">
            <span class="answer-title">正确答案：</span>
            <span class="answer-value">{{ getCorrectAnswerText() }}</span>
          </div>
          
          <!-- 如果用户回答了，显示用户答案 -->
          <div class="user-answer-section" v-if="showUserAnswer()">
            <span class="user-answer-title">您的答案：</span>
            <span class="user-answer-value">{{ getUserAnswerText() }}</span>
          </div>
        </div>
        
        <!-- 解析内容 -->
        <div class="explanation-section" v-if="currentQuestion.analysis">
          <div class="explanation-header">
            <el-icon><Lightning /></el-icon>
            <span class="explanation-title">题目解析</span>
          </div>
          <div class="explanation-content">
            {{ currentQuestion.analysis }}
          </div>
        </div>
        
        <!-- 没有解析时的提示 -->
        <div class="no-analysis" v-else>
          <el-empty description="暂无解析内容" :image-size="60">
            <template #image>
              <el-icon><Search /></el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 单独处理阅读理解/完形填空的解析 -->
    <div class="reading-analysis" v-if="currentQuestion && ['readingComprehension', 'cloze'].includes(currentQuestion.type) && currentQuestion.showAnalysis">
      <QuestionAnalysis
        :current-question="currentQuestion"
        :answers="answers"
        :current-question-index="currentQuestionIndex"
        :sub-fill-blank-answers="subFillBlankAnswers"
        :sub-essay-answers="subEssayAnswers"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Select,
  CircleCheck,
  Check,
  EditPen,
  Document,
  Reading,
  Edit,
  InfoFilled,
  Lightning,
  Search
} from '@element-plus/icons-vue'
import ReadingComprehensionDisplay from './ReadingComprehensionDisplay.vue'
import QuestionAnalysis from './QuestionAnalysis.vue'

const props = defineProps({
  currentQuestion: Object,
  currentQuestionIndex: Number,
  totalQuestions: Number,
  selectedAnswer: [String, Number, Array],
  subFillBlankAnswers: {
    type: Object,
    default: () => ({})
  },
  subEssayAnswers: {
    type: Object,
    default: () => ({})
  },
  answers: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'select-option',
  'update-answer',
  'select-sub-option',
  'update-sub-fill-blank-answer',
  'update-sub-essay-answer'
])

// 获取题型文本
function getQuestionTypeText(type) {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    truefalse: '判断题',
    fillblank: '填空题',
    essay: '简答题',
    readingComprehension: '阅读理解',
    cloze: '完形填空'
  }
  return typeMap[type] || '未知题型'
}

// 获取题型对应的 CSS 类
function getQuestionTypeClass(type) {
  const classMap = {
    single: 'type-single',
    multiple: 'type-multiple',
    truefalse: 'type-truefalse',
    fillblank: 'type-fillblank',
    essay: 'type-essay',
    readingComprehension: 'type-reading',
    cloze: 'type-cloze'
  }
  return classMap[type] || ''
}

// 格式化主干内容
function formatMainContent(content) {
  if (!content) return ''
  return content.replace(/___(\d+)___/g, '<strong style="color: #409eff; text-decoration: underline;">[$1]</strong>')
}

function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

const displayOptions = computed(() => {
  const opts = props.currentQuestion?.options
  return Array.isArray(opts) ? opts : []
})

function isUserSelected(index) {
  const type = props.currentQuestion?.type
  if (type === 'multiple') {
    return Array.isArray(props.selectedAnswer) && props.selectedAnswer.includes(index)
  }
  return props.selectedAnswer === index
}

// ✅ 修复：改进的 isCorrectOption 函数
function isCorrectOption(index) {
  if (!props.currentQuestion?.showAnalysis) return false
  
  const ca = props.currentQuestion?.correctAnswer
  const type = props.currentQuestion?.type
  
  // 调试日志
  console.log(`检查选项 ${index} 是否正确:`, {
    type,
    correctAnswer: ca,
    correctAnswerType: typeof ca,
    isArray: Array.isArray(ca),
    showAnalysis: props.currentQuestion?.showAnalysis
  })
  
  if (type === 'multiple') {
    // 确保是数组
    if (Array.isArray(ca)) {
      // ✅ 关键修复：检查当前选项是否在正确答案数组中
      const result = ca.includes(index)
      console.log(`多选题检查结果: 选项 ${index} ${result ? '在' : '不在'} 正确答案数组 ${JSON.stringify(ca)} 中`)
      return result
    } else {
      console.log('多选题答案不是数组:', ca)
      return false
    }
  }
  
  // 单选题和判断题
  return ca === index
}

// ✅ 新增：获取正确答案文本
function getCorrectAnswerText() {
  const q = props.currentQuestion
  if (!q) return ''
  
  const ca = q.correctAnswer
  
  if (q.type === 'single' || q.type === 'truefalse') {
    if (typeof ca === 'number') {
      return getOptionLabel(ca) + '. ' + (q.options?.[ca] || ca)
    }
    return ca
  } else if (q.type === 'multiple') {
    if (Array.isArray(ca)) {
      return ca.map(index => getOptionLabel(index) + '. ' + (q.options?.[index] || index)).join('；')
    }
    return ca
  } else if (q.type === 'fillblank' || q.type === 'essay') {
    return ca || '暂无标准答案'
  }
  
  return ca
}

// ✅ 新增：获取用户答案文本
function getUserAnswerText() {
  const q = props.currentQuestion
  if (!q) return ''
  
  const userAnswer = props.selectedAnswer
  
  if (q.type === 'single' || q.type === 'truefalse') {
    if (typeof userAnswer === 'number') {
      return getOptionLabel(userAnswer) + '. ' + (q.options?.[userAnswer] || userAnswer)
    }
    return userAnswer
  } else if (q.type === 'multiple') {
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(index => getOptionLabel(index) + '. ' + (q.options?.[index] || index)).join('；')
    }
    return userAnswer
  } else if (q.type === 'fillblank' || q.type === 'essay') {
    return userAnswer || '未作答'
  }
  
  return userAnswer
}

// ✅ 新增：判断是否显示用户答案
function showUserAnswer() {
  const q = props.currentQuestion
  if (!q) return false
  
  const userAnswer = props.selectedAnswer
  
  if (q.type === 'single' || q.type === 'truefalse') {
    return userAnswer !== null && userAnswer !== undefined
  } else if (q.type === 'multiple') {
    return Array.isArray(userAnswer) && userAnswer.length > 0
  } else if (q.type === 'fillblank' || q.type === 'essay') {
    return userAnswer && userAnswer.trim() !== ''
  }
  
  return false
}
</script>

<style scoped>
/* 题型提示样式 */
.question-type-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.type-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.type-text {
  font-weight: 600;
}

.multi-hint {
  color: #f56c6c;
  font-size: 13px;
  font-weight: 500;
}

.truefalse-hint {
  color: #e6a23c;
  font-size: 13px;
  font-weight: 500;
}

/* 不同题型的背景色 */
.type-single {
  background-color: #e6f7ff;
  border-left: 4px solid #409eff;
  color: #1890ff;
}

.type-multiple {
  background-color: #f0f9ff;
  border-left: 4px solid #36cfc9;
  color: #08979c;
}

.type-truefalse {
  background-color: #fff7e6;
  border-left: 4px solid #faad14;
  color: #d48806;
}

.type-fillblank {
  background-color: #f6ffed;
  border-left: 4px solid #73d13d;
  color: #389e0d;
}

.type-essay {
  background-color: #f9f0ff;
  border-left: 4px solid #9254de;
  color: #722ed1;
}

.type-reading {
  background-color: #f0f5ff;
  border-left: 4px solid #597ef7;
  color: #2f54eb;
}

.type-cloze {
  background-color: #f0f5ff;
  border-left: 4px solid #597ef7;
  color: #2f54eb;
}

/* 原样式调整 */
.question-header {
  margin-bottom: 20px;
}

.question-index {
  font-weight: bold;
  color: #409eff;
  margin-right: 10px;
}

/* 移除原来的 question-type 样式 */
.question-type {
  display: none;
}

.question-title {
  font-size: 16px;
  line-height: 1.6;
  margin-top: 8px;
  display: block;
}

/* 选项区域样式 */
.options {
  margin: 20px 0;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background-color: #f5f7fa;
}

.option-item.user-selected {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.option-item.correct-answer {
  border: 2px solid #67c23a;
  background-color: #f0f9eb;
  color: #2e8b57;
}

.option-letter {
  font-weight: bold;
  margin-right: 8px;
}

.option-text {
  flex: 1;
}

/* 输入区域样式 */
.input-area {
  margin: 20px 0;
}

/* 主干内容框样式 */
.main-content-box {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* ✅ 新增：解析区域样式 */
.question-analysis {
  margin-top: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-content {
  padding: 15px;
  background: white;
  border-radius: 6px;
}

.correct-answer-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #91d5ff;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.answer-title {
  font-weight: bold;
  color: #1890ff;
  font-size: 15px;
  min-width: 80px;
}

.answer-value {
  font-size: 15px;
  color: #096dd9;
  font-weight: 600;
  flex: 1;
}

.user-answer-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #91d5ff;
}

.user-answer-title {
  font-weight: bold;
  color: #52c41a;
  font-size: 14px;
  min-width: 80px;
}

.user-answer-value {
  font-size: 14px;
  color: #389e0d;
  font-weight: 500;
  flex: 1;
}

.explanation-section {
  padding: 15px;
  background: #fff7e6;
  border-radius: 6px;
  border: 1px solid #ffd591;
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.explanation-header .el-icon {
  color: #faad14;
  font-size: 18px;
}

.explanation-title {
  font-weight: bold;
  color: #d48806;
  font-size: 15px;
}

.explanation-content {
  font-size: 14px;
  line-height: 1.6;
  color: #614700;
}

.no-analysis {
  text-align: center;
  padding: 30px 0;
}

.reading-analysis {
  margin-top: 30px;
}
</style>