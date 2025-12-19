<template>
  <!-- 解析区域（仅答错时显示） -->
  <div v-if="currentQuestion?.showAnalysis && currentQuestion?.analysis && !['readingComprehension', 'cloze'].includes(currentQuestion?.type)" class="analysis-box"> 
    <el-divider />
    <div class="analysis-title">💡 解析：</div>
    <div class="analysis-content" v-html="currentQuestion.analysis"></div>
  </div>

  <!-- 填空/简答：显示标准答案（可选） -->
  <div
    v-if="currentQuestion?.showAnalysis && ['fillblank', 'essay'].includes(currentQuestion?.type)"
    class="standard-answer"
  >
    <strong>标准答案：</strong>{{ currentQuestion.correctAnswer }}
  </div>

  <!-- 阅读理解：显示各小题解析 -->
  <div v-if="currentQuestion?.showAnalysis && currentQuestion?.type === 'readingComprehension' && currentQuestion.subQuestions">
    <div v-for="(q, idx) in currentQuestion.subQuestions" :key="idx" class="sub-analysis">
      <!-- 解析中的子题目题型提示 -->
      <div class="sub-analysis-type-hint" :class="getSubQuestionTypeClass(q.type)">
        <span class="sub-type-icon">
          <el-icon v-if="q.type === 'single'"><Select /></el-icon>
          <el-icon v-else-if="q.type === 'multiple'"><CircleCheck /></el-icon>
          <el-icon v-else-if="q.type === 'truefalse'"><Check /></el-icon>
          <el-icon v-else-if="q.type === 'fillblank'"><EditPen /></el-icon>
          <el-icon v-else-if="q.type === 'essay'"><Document /></el-icon>
        </span>
        <span class="sub-type-text">{{ getSubQuestionTypeText(q.type) }}</span>
        <span class="question-number">第 {{ idx + 1 }} 题</span>
      </div>
      
      <div class="sub-question-title">{{ idx + 1 }}. {{ q.question }}</div>
      <div v-if="q.analysis" class="analysis-content" v-html="q.analysis"></div>
      <div v-if="q.correctAnswer && q.type !== 'essay'" class="standard-answer">
        <strong>标准答案：</strong>{{ formatAnswer(q.correctAnswer, q.type) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Select,
  CircleCheck,
  Check,
  EditPen,
  Document
} from '@element-plus/icons-vue'

const props = defineProps({
  currentQuestion: Object,
  subFillBlankAnswers: {
    type: Object,
    default: () => ({})
  },
  subEssayAnswers: {
    type: Object,
    default: () => ({})
  }
})

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
  }
  
  return String(answer)
}
</script>

<style scoped>
/* 解析区域样式 */
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

/* 标准答案样式 */
.standard-answer {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0f9eb;
  border-radius: 4px;
  font-size: 13px;
  color: #2e8b57;
}

/* 子题目解析样式 */
.sub-analysis {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

/* 解析中的子题目题型提示 */
.sub-analysis-type-hint {
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

.sub-analysis-type-hint .sub-type-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.sub-analysis-type-hint .sub-type-text {
  font-weight: 600;
}

.sub-analysis-type-hint .question-number {
  margin-left: 8px;
  color: #666;
  font-size: 11px;
}

/* 不同子题目题型的背景色（解析中） */
.sub-analysis-type-hint.sub-type-single {
  background-color: rgba(230, 247, 255, 0.8);
  border-left: 3px solid #409eff;
  color: #1890ff;
}

.sub-analysis-type-hint.sub-type-multiple {
  background-color: rgba(240, 249, 255, 0.8);
  border-left: 3px solid #36cfc9;
  color: #08979c;
}

.sub-analysis-type-hint.sub-type-truefalse {
  background-color: rgba(255, 247, 230, 0.8);
  border-left: 3px solid #faad14;
  color: #d48806;
}

.sub-analysis-type-hint.sub-type-fillblank {
  background-color: rgba(246, 255, 237, 0.8);
  border-left: 3px solid #73d13d;
  color: #389e0d;
}

.sub-analysis-type-hint.sub-type-essay {
  background-color: rgba(249, 240, 255, 0.8);
  border-left: 3px solid #9254de;
  color: #722ed1;
}

/* 子题目标题（解析中） */
.sub-analysis .sub-question-title {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}
</style>