<template>
  <div class="reading-comprehension">
    <!-- 添加安全检查 -->
    <div v-if="currentQuestion && currentQuestion.subQuestions && currentQuestion.subQuestions.length">
      <div v-for="(q, idx) in currentQuestion.subQuestions" :key="idx" class="sub-question">
        <!-- 子题目题型提示 -->
        <div class="sub-question-type-hint" :class="getSubQuestionTypeClass(q.type)">
          <span class="sub-type-icon">
            <el-icon v-if="q.type === 'single'"><Select /></el-icon>
            <el-icon v-else-if="q.type === 'multiple'"><CircleCheck /></el-icon>
            <el-icon v-else-if="q.type === 'truefalse'"><Check /></el-icon>
            <el-icon v-else-if="q.type === 'fillblank'"><EditPen /></el-icon>
            <el-icon v-else-if="q.type === 'essay'"><Document /></el-icon>
          </span>
          <span class="sub-type-text">{{ getSubQuestionTypeText(q.type) }}</span>
          <!-- 多选题提示 -->
          <span class="sub-multi-hint" v-if="q.type === 'multiple'">（可多选）</span>
          <!-- 判断题提示 -->
          <span class="sub-truefalse-hint" v-if="q.type === 'truefalse'">（判断对错）</span>
        </div>

        <div class="sub-question-title">{{ idx + 1 }}. {{ q.question }}</div>
        
        <!-- 单选题、多选题、判断题 -->
        <div v-if="['single', 'multiple', 'truefalse'].includes(q.type)" class="sub-options">
          <div
            v-for="(option, oIdx) in q.options"
            :key="oIdx"
            class="option-item"
            :class="{ 
              'user-selected': isSubUserSelected(idx, oIdx),
              'correct-answer': isSubCorrectOption(idx, oIdx)
            }"
            @click="$emit('select-sub-option', idx, oIdx)"
          >
            <span class="option-letter">{{ getOptionLabel(oIdx) }}.</span>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>
        
        <!-- 填空题 -->
        <div v-else-if="q.type === 'fillblank'" class="sub-fillblank">
          <el-input
            :model-value="getSubFillBlankValue(idx)"
            @update:model-value="value => {
              console.log('🎯 填空题输入事件触发', {
                子题索引: idx,
                输入值: value,
                当前值: getSubFillBlankValue(idx),
                子题类型: q.type
              })
              $emit('update-sub-fill-blank-answer', idx, value)
            }"
            placeholder="请输入答案"
            size="small"
            clearable
          />
          <!-- 添加标准答案显示 -->
          <div 
            v-if="currentQuestion?.showAnalysis && q.correctAnswer !== undefined && q.correctAnswer !== null" 
            class="standard-answer"
            style="margin-top: 5px;"
          >
            <strong>标准答案：</strong>{{ formatAnswer(q.correctAnswer, q.type) }}
          </div>
        </div>
        
        <!-- 简答题 -->
        <div v-else-if="q.type === 'essay'" class="sub-essay">
          <el-input
            :model-value="getSubEssayValue(idx)"
            @update:model-value="value => $emit('update-sub-essay-answer', idx, value)"
            type="textarea"
            :rows="4"
            placeholder="请输入您的答案"
            clearable
          />
        </div>
      </div>
    </div>
    
    <!-- 没有子题目的情况 -->
    <div v-else class="no-sub-questions">
      <el-empty description="暂无题目内容" :image-size="100">
        <template #image>
          <el-icon><Document /></el-icon>
        </template>
      </el-empty>
    </div>
    
    <!-- 完形填空的解析 -->
    <div v-if="currentQuestion?.type === 'cloze' && currentQuestion?.showAnalysis && currentQuestion?.analysis" class="analysis-box"> 
      <el-divider />
      <div class="analysis-title">💡 解析：</div>
      <div class="analysis-content" v-html="currentQuestion.analysis"></div>
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
  Document
} from '@element-plus/icons-vue'

const props = defineProps({
  currentQuestion: {
    type: Object,
    default: () => ({})
  },
  subFillBlankAnswers: {
    type: Object,
    default: () => ({})
  },
  subEssayAnswers: {
    type: Object,
    default: () => ({})
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  answers: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'select-sub-option',
  'update-sub-fill-blank-answer',
  'update-sub-essay-answer'
])

// 获取子题目题型文本
function getSubQuestionTypeText(type) {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    truefalse: '判断题',
    fillblank: '填空题',
    essay: '简答题'
  }
  return typeMap[type] || '未知题型'
}

// 获取子题目题型对应的 CSS 类
function getSubQuestionTypeClass(type) {
  const classMap = {
    single: 'sub-type-single',
    multiple: 'sub-type-multiple',
    truefalse: 'sub-type-truefalse',
    fillblank: 'sub-type-fillblank',
    essay: 'sub-type-essay'
  }
  return classMap[type] || ''
}

function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

// ✅ 修复：安全的获取填空题值的方法
function getSubFillBlankValue(subIndex) {
  if (!props.subFillBlankAnswers || typeof props.subFillBlankAnswers !== 'object') {
    return ''
  }
  return props.subFillBlankAnswers[subIndex] || ''
}

// ✅ 修复：安全的获取简答题值的方法
function getSubEssayValue(subIndex) {
  if (!props.subEssayAnswers || typeof props.subEssayAnswers !== 'object') {
    return ''
  }
  return props.subEssayAnswers[subIndex] || ''
}

// 计算当前子题的答案
const currentSubAnswers = computed(() => {
  if (!props.answers || !Array.isArray(props.answers)) {
    return {}
  }
  return props.answers[props.currentQuestionIndex] || {}
})

function isSubUserSelected(subIndex, optionIndex) {
  const subAnswers = currentSubAnswers.value
  const currentQ = props.currentQuestion
  
  if (!currentQ || !currentQ.subQuestions || !subAnswers) return false
  
  const subQ = currentQ.subQuestions[subIndex]
  if (!subQ) return false
  
  if (subQ.type === 'multiple') {
    return Array.isArray(subAnswers[subIndex]) && subAnswers[subIndex].includes(optionIndex)
  }
  
  return subAnswers[subIndex] === optionIndex
}

function isSubCorrectOption(subIndex, optionIndex) {
  const currentQ = props.currentQuestion
  if (!currentQ || !currentQ.showAnalysis || !currentQ.subQuestions) return false
  
  const subQ = currentQ.subQuestions[subIndex]
  if (!subQ) return false
  
  // 处理多选题
  if (subQ.type === 'multiple') {
    return Array.isArray(subQ.correctAnswer) && subQ.correctAnswer.includes(optionIndex)
  }
  
  // 处理单选题和其他题型
  return optionIndex === subQ.correctAnswer
}

function formatAnswer(answer, type) {
  if (answer === undefined || answer === null) return ''
  
  if (type === 'multiple') {
    if (Array.isArray(answer)) {
      return answer.map(a => {
        if (typeof a === 'number') {
          return String.fromCharCode(65 + a)
        }
        return a
      }).join(', ')
    }
    return String(answer)
  } else if (type === 'single') {
    if (typeof answer === 'number') {
      return String.fromCharCode(65 + answer)
    }
    return String(answer)
  } else if (type === 'truefalse') {
    return answer === 0 ? '正确' : '错误'
  } else if (type === 'fillblank') {
    // ✅ 专门处理填空题：直接显示答案文本
    return String(answer)
  }
  
  return String(answer)
}
</script>

<style scoped>
.reading-comprehension {
  margin: 20px 0;
}

.sub-question {
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

/* 子题目题型提示样式 */
.sub-question-type-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-bottom: 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.sub-type-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.sub-type-text {
  font-weight: 600;
}

.sub-multi-hint {
  color: #f56c6c;
  font-size: 11px;
  font-weight: 500;
}

.sub-truefalse-hint {
  color: #e6a23c;
  font-size: 11px;
  font-weight: 500;
}

/* 不同子题目题型的背景色 */
.sub-type-single {
  background-color: rgba(230, 247, 255, 0.8);
  border-left: 3px solid #409eff;
  color: #1890ff;
}

.sub-type-multiple {
  background-color: rgba(240, 249, 255, 0.8);
  border-left: 3px solid #36cfc9;
  color: #08979c;
}

.sub-type-truefalse {
  background-color: rgba(255, 247, 230, 0.8);
  border-left: 3px solid #faad14;
  color: #d48806;
}

.sub-type-fillblank {
  background-color: rgba(246, 255, 237, 0.8);
  border-left: 3px solid #73d13d;
  color: #389e0d;
}

.sub-type-essay {
  background-color: rgba(249, 240, 255, 0.8);
  border-left: 3px solid #9254de;
  color: #722ed1;
}

/* 子题目标题 */
.sub-question-title {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

/* 子题目选项样式 */
.sub-options {
  margin: 10px 0;
}

.sub-options .option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.sub-options .option-item:hover {
  background-color: #f5f7fa;
}

.sub-options .option-item.user-selected {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.sub-options .option-item.correct-answer {
  border: 2px solid #67c23a;
  background-color: #f0f9eb;
  color: #2e8b57;
}

.sub-options .option-letter {
  font-weight: bold;
  margin-right: 8px;
  font-size: 13px;
}

.sub-options .option-text {
  flex: 1;
  font-size: 13px;
}

/* 子题目填空题样式 */
.sub-fillblank {
  margin: 10px 0;
}

/* 子题目简答题样式 */
.sub-essay {
  margin: 10px 0;
}

.standard-answer {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0f9eb;
  border-radius: 4px;
  font-size: 13px;
  color: #2e8b57;
}

/* 没有子题目的样式 */
.no-sub-questions {
  padding: 40px;
  text-align: center;
  color: #999;
}

/* 完形填空的解析样式 */
.analysis-box {
  margin-top: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.analysis-title {
  font-weight: bold;
  color: #409eff;
  margin-bottom: 6px;
  font-size: 14px;
}

.analysis-content {
  font-size: 13px;
  line-height: 1.5;
  color: #333;
}
</style>