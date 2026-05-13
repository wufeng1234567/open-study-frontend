<template>
  <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" fullscreen
    :close-on-click-modal="false" class="practice-result-dialog" :show-close="true" title="">
    <div class="result-container">
      <!-- 顶部统计 -->
      <div class="result-header">
        <h2 class="result-title">练习结果</h2>
        <el-row :gutter="16" class="stats-row">
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-num total">{{ resultData.total }}</div>
              <div class="stat-label">总题数</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-num correct">{{ resultData.correct }}</div>
              <div class="stat-label">正确</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-num wrong">{{ resultData.wrong }}</div>
              <div class="stat-label">错误</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card">
              <div class="stat-num accuracy" :class="accuracyClass">{{ resultData.accuracy }}</div>
              <div class="stat-label">正确率</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 题目列表 -->
      <div class="result-body">
        <el-scrollbar height="calc(100vh - 340px)">
          <div class="question-list">
            <div v-for="(q, index) in resultData.questions" :key="index" class="question-card"
              :class="{ correct: q.isCorrect, wrong: !q.isCorrect }">
              <!-- 题目标题 -->
              <div class="question-header">
                <span class="question-num">第 {{ index + 1 }} 题</span>
                <span class="question-type-tag" :class="'type-' + getTypeKey(q.questionType)">
                  {{ getTypeName(q.questionType) }}
                </span>
                <span class="result-badge" :class="q.isCorrect ? 'badge-correct' : 'badge-wrong'">
                  {{ q.isCorrect ? '正确' : '错误' }}
                </span>
              </div>

              <!-- 题干 -->
              <div class="question-stem">{{ q.questionText }}</div>

              <!-- 选项 -->
              <div v-if="q.options && q.options.length" class="question-options">
                <div v-for="(opt, oi) in q.options" :key="oi" class="option-item" :class="getOptionClass(q, oi)">
                  <span class="option-letter">{{ getOptionLabel(oi) }}.</span>
                  <span class="option-text">{{ opt }}</span>
                </div>
              </div>

              <!-- 填空/简答 -->
              <div v-else class="question-answer-row">
                <div class="answer-part">
                  <span class="answer-label">你的答案：</span>
                  <span class="answer-value" :class="q.isCorrect ? 'text-correct' : 'text-wrong'">
                    {{ formatAnswer(q.userAnswer) || '未作答' }}
                  </span>
                </div>
                <div class="answer-part">
                  <span class="answer-label">正确答案：</span>
                  <span class="answer-value text-correct">
                    {{ formatAnswer(q.correctAnswer) }}
                  </span>
                </div>
              </div>

              <!-- 解析 -->
              <div class="question-analysis" v-if="q.analysis">
                <div class="analysis-title">
                  <el-icon>
                    <InfoFilled />
                  </el-icon>
                  <span>解析</span>
                </div>
                <div class="analysis-content">{{ q.analysis }}</div>
              </div>

              <!-- AI 解析按钮 -->
              <div class="ai-analyze-row">
                <el-button size="small" @click="requestAiAnalysis(index)" :loading="aiLoadingMap[index]">
                  <el-icon>
                    <MagicStick />
                  </el-icon>
                  {{ aiResults[index] ? '重新解析' : 'AI 解析' }}
                </el-button>
              </div>

              <!-- AI 解析结果 -->
              <div class="ai-analysis-result" v-if="aiResults[index]">
                <div class="analysis-title">
                  <el-icon>
                    <MagicStick />
                  </el-icon>
                  <span>AI 智能解析</span>
                </div>
                <div class="analysis-content" v-html="aiResults[index]"></div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 底部按钮 -->
      <div class="result-footer">
        <el-button @click="$emit('back')">
          <el-icon>
            <ArrowLeft />
          </el-icon> 返回题库
        </el-button>
        <el-button @click="$emit('review-mistakes')">查看错题</el-button>
        <el-button type="primary" @click="$emit('retry')">再练一次</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { InfoFilled, MagicStick, ArrowLeft } from '@element-plus/icons-vue'
import { analyzeQuestionStream } from '@/api/ai/ai'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  resultData: {
    type: Object,
    default: () => ({
      total: 0,
      correct: 0,
      wrong: 0,
      accuracy: '0%',
      bankId: null,
      questions: []
    })
  }
})

const emit = defineEmits(['update:modelValue', 'retry', 'back', 'review-mistakes'])

const aiResults = reactive({})
const aiLoadingMap = reactive({})
const aiCache = new Map()

const accuracyClass = computed(() => {
  const val = parseFloat(props.resultData.accuracy)
  if (val >= 80) return 'accuracy-high'
  if (val >= 60) return 'accuracy-mid'
  return 'accuracy-low'
})

function getTypeKey(typeNum) {
  const map = { 1: 'single', 2: 'multiple', 3: 'truefalse', 4: 'fillblank', 5: 'essay', 6: 'composite', 7: 'composite' }
  return map[typeNum] || 'single'
}

function getTypeName(typeNum) {
  const map = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '组合题', 7: '组合题' }
  return map[typeNum] || '未知题型'
}

function getOptionLabel(index) {
  return String.fromCharCode(65 + index)
}

function getOptionClass(q, oi) {
  const isUserSelected = isOptionSelected(q.userAnswer, oi)
  const isCorrectOption = isOptionCorrect(q.correctAnswer, oi)
  if (isUserSelected && q.isCorrect) return 'option-correct'
  if (isUserSelected && !q.isCorrect) return 'option-wrong'
  if (isCorrectOption) return 'option-correct'
  return ''
}

function isOptionSelected(userAnswer, oi) {
  if (Array.isArray(userAnswer)) return userAnswer.includes(oi)
  return userAnswer === oi
}

function isOptionCorrect(correctAnswer, oi) {
  if (Array.isArray(correctAnswer)) return correctAnswer.includes(oi)
  return correctAnswer === oi
}

function formatAnswer(answer) {
  if (answer === null || answer === undefined || answer === '') return ''
  if (Array.isArray(answer)) return answer.map(i => getOptionLabel(i)).join('、')
  if (typeof answer === 'number') return getOptionLabel(answer)
  return String(answer)
}

async function requestAiAnalysis(index) {
  const q = props.resultData.questions[index]
  if (!q) return

  const questionId = q.id || index

  if (aiCache.has(questionId)) {
    aiResults[index] = aiCache.get(questionId)
    return
  }

  aiLoadingMap[index] = true
  try {
    const questionText = q.questionText || ''
    const questionType = getTypeName(q.questionType)
    const options = q.options && q.options.length ? JSON.stringify(q.options) : ''
    const correctAnswer = q.correctAnswer !== undefined ? String(q.correctAnswer) : ''

    await analyzeQuestionStream(
      questionText,
      questionType,
      options,
      correctAnswer,
      (chunk) => {
        aiResults[index] = chunk.replace(/\n/g, '<br>')
      },
      (final) => {
        aiResults[index] = final.replace(/\n/g, '<br>')
        aiCache.set(questionId, aiResults[index])
        aiLoadingMap[index] = false
      },
      (err) => {
        console.error('AI 解析失败:', err)
        aiResults[index] = 'AI 解析失败，请稍后重试'
        aiLoadingMap[index] = false
      }
    )
  } catch (e) {
    console.error('AI 解析异常:', e)
    aiResults[index] = 'AI 解析失败，请稍后重试'
    aiLoadingMap[index] = false
  }
}
</script>

<style scoped>
.result-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 24px;
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-num.total {
  color: #6b7280;
}

.stat-num.correct {
  color: #16a34a;
}

.stat-num.wrong {
  color: #dc2626;
}

.stat-num.accuracy {
  color: #6b7280;
}

.stat-num.accuracy-high {
  color: #16a34a;
}

.stat-num.accuracy-mid {
  color: #ea580c;
}

.stat-num.accuracy-low {
  color: #dc2626;
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 4px;
}

.result-body {
  flex: 1;
  min-height: 0;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
}

.question-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-card.correct {
  border-left: 4px solid #16a34a;
}

.question-card.wrong {
  border-left: 4px solid #dc2626;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.question-num {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.question-type-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.type-single {
  background: #e6f7ff;
  color: #1890ff;
}

.type-multiple {
  background: #f0f9ff;
  color: #08979c;
}

.type-truefalse {
  background: #fff7e6;
  color: #d48806;
}

.type-fillblank {
  background: #f6ffed;
  color: #389e0d;
}

.type-essay {
  background: #f9f0ff;
  color: #722ed1;
}

.type-composite {
  background: #fff7e6;
  color: #d46b00;
}

.result-badge {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
}

.badge-correct {
  background: #f0fdf4;
  color: #16a34a;
}

.badge-wrong {
  background: #fef2f2;
  color: #dc2626;
}

.question-stem {
  font-size: 15px;
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 12px;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.option-correct {
  background: #f0fdf4;
  border-color: #86efac;
  color: #16a34a;
}

.option-wrong {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.option-letter {
  font-weight: 600;
  margin-right: 8px;
}

.option-text {
  flex: 1;
}

.question-answer-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.answer-part {
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.answer-value {
  font-size: 14px;
  font-weight: 600;
}

.text-correct {
  color: #16a34a;
}

.text-wrong {
  color: #dc2626;
}

.question-analysis {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.analysis-content {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.ai-analyze-row {
  margin-top: 12px;
}

.ai-analysis-result {
  margin-top: 12px;
  padding: 12px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fde68a;
}

.result-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}
</style>
