<template>
  <div class="practice-container">
    <!-- 加载动画 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="loading-ring"></div>
        <div class="loading-text">正在加载题目...</div>
      </div>
    </div>

    <!-- 整体浏览模式 -->
    <template v-if="overviewMode">
      <PracticeHeader :mode="moduleType" :bank-name="bankName" :formatted-time="formattedRemainingTime"
        :is-warning="isTimeWarning" :is-danger="isTimeDanger" @close="$emit('close')"
        @open-settings="showSettings = true" />

      <div class="main-content overview-content">
        <div class="overview-question-stream" ref="questionStreamRef" @scroll.passive="onStreamScroll">
          <div v-for="(item, index) in questions" :key="index" class="overview-question-card">
            <div class="overview-card-header">
              <span class="question-number" v-if="overviewMode">第 {{ index + 1 }} 题</span>
              <div v-else class="header-spacer"></div>
              <MarkedButton :question-id="item.id" :bank-id="bankId" size="small" @change="handleMarkedChange(index)" />
              <FavoriteButton type="question" :target-id="item.id" size="small" />
            </div>
            <QuestionDisplay :current-question="item" :current-question-index="index" :total-questions="totalQuestions"
              :selected-answer="answers[index]" :sub-fill-blank-answers="subFillBlankAnswers"
              :sub-essay-answers="subEssayAnswers" :answers="answers"
              :show-analysis-immediately="showAnalysisImmediately" :show-question-index="false"
              @select-option="(optIdx) => handleOverviewSelect(index, optIdx)"
              @update-answer="(value) => handleOverviewUpdateAnswer(index, value)"
              @select-sub-option="(subIndex, optIdx) => handleOverviewSelectSubOption(index, subIndex, optIdx)"
              @update-sub-fill-blank-answer="(subIndex, value) => handleOverviewUpdateSubFillBlank(index, subIndex, value)"
              @update-sub-essay-answer="(subIndex, value) => handleOverviewUpdateSubEssay(index, subIndex, value)" />
          </div>

          <div v-if="moduleType === 'mock' && (isExamMode || isPracticeMode) && !showExamResult"
            class="overview-submit-area">
            <el-button v-if="canGoPrevBatch" @click="handlePrevBatch">上一波</el-button>
            <el-button @click="handleSubmit">提交</el-button>
          </div>

          <div v-if="moduleType !== 'mock' && (isExamMode || isPracticeMode)" class="overview-submit-area">
            <template v-if="!hasSubmittedCurrentBatch">
              <el-button v-if="isLastBatch" type="primary" @click="handleContinuePractice">继续刷题</el-button>
              <el-button v-else type="primary" @click="handleContinuePractice">继续刷下一波</el-button>
            </template>
            <template v-else>
              <el-button v-if="canGoPrevBatch" @click="handlePrevBatch">回到上一波</el-button>
              <el-button v-if="isLastBatch" type="primary" @click="$emit('close')">结束</el-button>
              <el-button v-else type="primary" @click="handleContinuePractice">继续刷下一波</el-button>
            </template>
          </div>
        </div>

        <AnswerCard class="answer-card overview-card" :questions="questions" :question-groups="questionGroups"
          :marked-questions="markedQuestionsSet" :is-overview-mode="true" :current-highlight-index="highlightedIndex"
          :stats="{ correctCount, wrongCount, accuracy }" :is-exam-mode="isExamMode" :is-practice-mode="isPracticeMode"
          :is-last-question="isLastQuestion" :show-exam-result="showExamResult" :total-score="totalScore"
          :answered-count="answeredCount" :total-count="totalQuestions" :remaining-count="remainingCount"
          @go-to-question="scrollToQuestion" @toggle-overview="toggleOverview" @reset-practice="resetPractice"
          @submit-exam="handleSubmitExam" />
      </div>
    </template>

    <!-- 逐题模式（原有布局） -->
    <template v-else>
      <PracticeHeader :mode="moduleType" :bank-name="bankName" :formatted-time="formattedRemainingTime"
        :is-warning="isTimeWarning" :is-danger="isTimeDanger" @close="$emit('close')"
        @open-settings="showSettings = true" />

      <div class="only-wrong-hint" v-if="moduleSettings.onlyWrong">
        <el-icon>
          <InfoFilled />
        </el-icon>
        <span>当前为错题练习模式，仅展示错题</span>
      </div>

      <div class="main-content">
        <QuestionDisplay :current-question="currentQuestion" :current-question-index="currentQuestionIndex"
          :total-questions="totalQuestions" :selected-answer="selectedAnswer"
          :sub-fill-blank-answers="subFillBlankAnswers" :sub-essay-answers="subEssayAnswers" :answers="answers"
          :show-analysis-immediately="showAnalysisImmediately" @select-option="handleSelectOption"
          @update-answer="value => selectedAnswer = value" @select-sub-option="selectSubOption"
          @update-sub-fill-blank-answer="updateSubFillBlankAnswer" @update-sub-essay-answer="updateSubEssayAnswer" />

        <AnswerCard :questions="questions" :current-question-index="currentQuestionIndex" :stats="{
          correctCount,
          wrongCount,
          accuracy
        }" :is-exam-mode="isExamMode" :is-practice-mode="isPracticeMode" :is-last-question="isLastQuestion"
          :show-exam-result="showExamResult" :total-score="totalScore" :answered-count="answeredCount"
          :total-count="totalQuestions" :remaining-count="remainingCount" @go-to-question="goToQuestion"
          @reset-practice="resetPractice" @submit-exam="handleSubmitExam" @toggle-overview="toggleOverview" />
      </div>



      <QuestionNavigation :show-prev="currentQuestionIndex > 0" :show-next="currentQuestionIndex < totalQuestions - 1"
        :question-id="currentQuestion?.id" :bank-id="bankId" :is-exam-mode="isExamMode"
        :is-practice-mode="isPracticeMode" :is-last-question="isLastQuestion" :can-go-prev-batch="canGoPrevBatch"
        :is-last-batch="isLastBatch" :has-submitted-current-batch="hasSubmittedCurrentBatch"
        :show-submit-button="(isExamMode || isPracticeMode) && moduleType !== 'mock'" @prev-question="prevQuestion"
        @next-question="nextQuestion" @mark="markQuestion" @add-note="addNote" @report="reportQuestion"
        @ai-analyze="openAiAnalysis" @submit-exam="handleSubmit" @prev-batch="handlePrevBatch"
        @close="$emit('close')" />
    </template>

    <!-- AI 解析弹窗 -->
    <AiAnalysisDialog v-if="showAnalysisDialog" :question="currentQuestion?.title || currentQuestion?.question || ''"
      :question-id="currentQuestion?.id" :question-type="getQuestionTypeName(currentQuestion?.type)"
      :options="formatOptionsForAnalysis(currentQuestion)" :correct-answer="currentQuestion?.correctAnswer"
      :cached-content="currentAnalysisContent" :is-generating="isAnalysisGenerating" @close="showAnalysisDialog = false"
      @update-cache="(content) => updateAnalysisCache(currentQuestion?.id, content)"
      @generating="setAnalysisGenerating" />

    <!-- 刷题设置弹窗 -->
    <PracticeSettings v-model="showSettings" :default-module="moduleType" @save="handleSettingsSave" />

    <!-- 滚动按钮 -->
    <ScrollButton :bottom="20" :right="20" />
  </div>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { InfoFilled, RefreshRight } from '@element-plus/icons-vue'
import PracticeHeader from './PracticeHeader.vue'
import QuestionDisplay from './QuestionDisplay.vue'
import AnswerCard from './AnswerCard.vue'
import QuestionNavigation from './QuestionNavigation.vue'
import PracticeSettings from './PracticeSettings.vue'
import MarkedButton from '@/components/MarkedButton/MarkedButton.vue'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton.vue'
import ScrollButton from '@/components/ScrollButton/ScrollButton.vue'
import { useQuestionPractice } from '@/composables/useQuestionPractice'
import usePracticeSettingsStore from '@/store/modules/practiceSettings'
import AiAnalysisDialog from '@/components/AiAnalysisDialog/index.vue'

const props = defineProps({
  bankId: { type: Number, required: true },
  bankName: { type: String, default: '题库' },
  moduleType: {
    type: String,
    required: true,
    validator: (val) => ['sequential', 'random', 'custom', 'mock'].includes(val)
  }
})

const emit = defineEmits(['close'])

const store = usePracticeSettingsStore()

const moduleSettings = computed(() => {
  return store.getModuleSettings(props.moduleType)
})

const isExamMode = computed(() => moduleSettings.value.practiceMode === 'exam')
const isPracticeMode = computed(() => moduleSettings.value.practiceMode === 'practice')
const showAnalysisImmediately = computed(() => !isExamMode.value || showExamResult.value)
const canGoPrevBatch = computed(() => questionOffset.value > 0 && (isExamMode.value || isPracticeMode.value))
const isLastQuestion = computed(() => currentQuestionIndex.value === totalQuestions.value - 1)
const isLastBatch = computed(() => allQuestionsData.value.length <= questionOffset.value + totalQuestions.value)

const showSettings = ref(false)
const showExamResult = ref(false)
const totalScore = ref(0)
const showAnalysisDialog = ref(false)
const hasSubmittedCurrentBatch = ref(false)
const isFirstLoaded = ref(false)

const examTimeLimit = computed(() => moduleSettings.value.examTimeLimit || 60)
const remainingTime = ref(0)
const examTimer = ref(null)

const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingTime.value / 60)
  const seconds = remainingTime.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const isTimeWarning = computed(() => remainingTime.value > 0 && remainingTime.value <= 300)
const isTimeDanger = computed(() => remainingTime.value > 0 && remainingTime.value <= 60)

function startExamTimer() {
  if (props.moduleType !== 'mock') return
  const totalSeconds = examTimeLimit.value * 60
  remainingTime.value = totalSeconds
  examTimer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      stopExamTimer()
      handleTimeUp()
    }
  }, 1000)
}

function stopExamTimer() {
  if (examTimer.value) {
    clearInterval(examTimer.value)
    examTimer.value = null
  }
}

function handleTimeUp() {
  ElMessageBox.alert('考试时间已到，系统将自动提交试卷！', '时间到', {
    confirmButtonText: '确定',
    type: 'warning'
  }).then(() => {
    handleSubmitExam()
  }).catch(() => {
    handleSubmitExam()
  })
}

watch(() => props.moduleType, (newType) => {
  if (newType === 'mock' && !showExamResult.value) {
    startExamTimer()
  } else {
    stopExamTimer()
    remainingTime.value = 0
  }
})

watch(showExamResult, (val) => {
  if (val) {
    stopExamTimer()
  } else if (props.moduleType === 'mock') {
    startExamTimer()
  }
})

onMounted(() => {
  if (!isFirstLoaded.value && props.bankId && props.bankId > 0) {
    isFirstLoaded.value = true
    fetchQuestions()
  }
  if (props.moduleType === 'mock' && !showExamResult.value) {
    startExamTimer()
  }
})

onUnmounted(() => {
  stopExamTimer()
})

const overviewMode = computed({
  get: () => moduleSettings.value.isOverviewMode || false,
  set: (val) => store.saveModuleSettings(props.moduleType, { isOverviewMode: val })
})
const highlightedIndex = ref(0)
const markedQuestions = ref([])
const markedQuestionsSet = computed(() => new Set(markedQuestions.value))
let scrollDebounceTimer = null
let scrollLock = false
const questionStreamRef = ref(null)

const typeLabelMap = {
  single: '单选题', multiple: '多选题', truefalse: '判断题',
  fillblank: '填空题', essay: '问答题', readingComprehension: '组合题', cloze: '完形填空'
}

const questionGroups = computed(() => {
  const groupMap = {}
  const qs = questions.value

  qs.forEach((q, i) => {
    const label = typeLabelMap[q.type] || '其他'
    if (!groupMap[label]) {
      groupMap[label] = {
        typeLabel: label,
        typeName: q.type,
        startIndex: i,
        endIndex: i,
        items: []
      }
    }
    groupMap[label].endIndex = i
    groupMap[label].items.push({ ...q, index: i })
  })

  return Object.values(groupMap)
})

const answeredCount = computed(() => answers.value.filter(a => a !== null).length)
const remainingCount = computed(() => totalQuestions.value - answeredCount.value)

const toggleOverview = () => {
  if (overviewMode.value) {
    store.saveModuleSettings(props.moduleType, { overviewScrollIndex: highlightedIndex.value })
  }
  overviewMode.value = !overviewMode.value
}

const scrollToQuestion = (index) => {
  if (!questionStreamRef.value) return
  scrollLock = true
  highlightedIndex.value = index
  const children = questionStreamRef.value.children
  if (children && children[index]) {
    children[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  setTimeout(() => { scrollLock = false }, 600)
}

const onStreamScroll = () => {
  if (scrollLock) return
  if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer)
  scrollDebounceTimer = setTimeout(() => {
    if (!questionStreamRef.value) return
    const scrollTop = questionStreamRef.value.scrollTop
    if (scrollTop !== undefined) {
      const idx = Math.round(scrollTop / 120)
      if (idx >= 0 && idx < questions.value.length) {
        highlightedIndex.value = idx
      }
    }
  }, 200)
}

const handleMarkedChange = (index) => {
  const set = new Set(markedQuestions.value)
  if (set.has(index)) {
    set.delete(index)
  } else {
    set.add(index)
  }
  markedQuestions.value = [...set]
  store.saveModuleSettings(props.moduleType, { markedQuestions: markedQuestions.value })
}

const handleOverviewSelect = (qIndex, optIdx) => {
  if (currentQuestionIndex.value !== qIndex) {
    if (currentQuestion.value && !['readingComprehension', 'cloze'].includes(currentQuestion.value.type) && selectedAnswer.value !== null && answers.value[currentQuestionIndex.value] === null) {
      handleAnswerSubmission(currentQuestionIndex.value)
    }
    currentQuestionIndex.value = qIndex
  }
  selectedAnswer.value = answers.value[qIndex] ?? (questions.value[qIndex]?.type === 'multiple' ? [] : null)
  selectOption(optIdx)
  answers.value[qIndex] = selectedAnswer.value
  if (questions.value[qIndex]) {
    questions.value[qIndex].answered = true
  }
  if (!isExamMode.value) {
    handleAnswerSubmission(qIndex)
  }
}

const handleOverviewUpdateAnswer = (qIndex, value) => {
  if (currentQuestionIndex.value !== qIndex) {
    currentQuestionIndex.value = qIndex
  }
  selectedAnswer.value = value
  answers.value[qIndex] = value
  if (questions.value[qIndex]) {
    questions.value[qIndex].answered = true
  }
  if (!isExamMode.value) {
    handleAnswerSubmission(qIndex)
  }
}

const handleOverviewSelectSubOption = (qIndex, subIndex, optIdx) => {
  if (currentQuestionIndex.value !== qIndex) {
    currentQuestionIndex.value = qIndex
  }
  selectSubOption(subIndex, optIdx)
  answers.value = [...answers.value]
}

const handleOverviewUpdateSubFillBlank = (qIndex, subIndex, value) => {
  if (currentQuestionIndex.value !== qIndex) {
    currentQuestionIndex.value = qIndex
  }
  updateSubFillBlankAnswer(subIndex, value)
  if (!isExamMode.value) {
    handleAnswerSubmission(qIndex)
  }
}

const handleOverviewUpdateSubEssay = (qIndex, subIndex, value) => {
  if (currentQuestionIndex.value !== qIndex) {
    currentQuestionIndex.value = qIndex
  }
  updateSubEssayAnswer(subIndex, value)
  if (!isExamMode.value) {
    handleAnswerSubmission(qIndex)
  }
}

const jumpToNextBatch = () => {
  hasSubmittedCurrentBatch.value = false
  showExamResult.value = false
  totalScore.value = 0
  const count = moduleSettings.value.questionCount || 10
  questionOffset.value = questionOffset.value + count
  loadBatchWithoutReset()
  if (props.moduleType === 'mock') {
    startExamTimer()
  }
  setTimeout(() => {
    if (overviewMode.value) {
      const firstCard = document.querySelector('.overview-question-card')
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      goToQuestion(0)
    }
  }, 150)
}

const handleContinuePractice = () => {
  if (showExamResult.value) {
    ElMessageBox.confirm('是否留在当前页面继续查看解析？', '查看解析', {
      confirmButtonText: '留在本页',
      cancelButtonText: '继续刷题',
      type: 'info'
    }).then(() => {
      showExamResult.value = true
    }).catch(() => {
      showExamResult.value = false
      totalScore.value = 0
      const count = moduleSettings.value.questionCount || 10
      questionOffset.value = questionOffset.value + count
      loadBatchWithoutReset()
      setTimeout(() => {
        if (overviewMode.value) {
          const firstCard = document.querySelector('.overview-question-card')
          if (firstCard) {
            firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } else {
          goToQuestion(0)
        }
      }, 150)
    })
    return
  }

  const unanswered = totalQuestions.value - answeredCount.value
  const hasMoreQuestions = allQuestionsData.value.length > questionOffset.value + totalQuestions.value
  if (unanswered > 0) {
    ElMessageBox.confirm(`您还有 ${unanswered} 题未作答，是否继续提交并查看解析？`, '提示', {
      confirmButtonText: '继续提交',
      cancelButtonText: '继续答题',
      type: 'warning'
    }).then(() => {
      hasSubmittedCurrentBatch.value = true
      if (isLastBatch.value) {
        handleSubmitExam()
      } else if (hasMoreQuestions) {
        ElMessageBox.confirm('恭喜完成！是否继续刷下一波题目？', '继续刷题', {
          confirmButtonText: '继续刷下一波',
          cancelButtonText: '查看结果',
          type: 'success'
        }).then(() => {
          jumpToNextBatch()
        }).catch(() => {
          handleSubmitExam()
        })
      } else {
        handleSubmitExam()
      }
    }).catch(() => {
      hasSubmittedCurrentBatch.value = true
    })
  } else {
    handleSubmitExam()
    hasSubmittedCurrentBatch.value = true
    if (isLastBatch.value) {
      // Last batch, just show results
    } else if (hasMoreQuestions) {
      ElMessageBox.confirm('恭喜完成！是否继续刷下一波题目？', '继续刷题', {
        confirmButtonText: '继续刷下一波',
        cancelButtonText: '查看结果',
        type: 'success'
      }).then(() => {
        jumpToNextBatch()
      }).catch(() => {
        handleSubmitExam()
      })
    }
  }
}

const handlePrevBatch = () => {
  hasSubmittedCurrentBatch.value = false
  showExamResult.value = false
  totalScore.value = 0
  const count = moduleSettings.value.questionCount || 10
  const newOffset = questionOffset.value - count
  questionOffset.value = Math.max(0, newOffset)
  loadBatchWithoutReset()
  setTimeout(() => {
    if (overviewMode.value) {
      const firstCard = document.querySelector('.overview-question-card')
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      goToQuestion(0)
    }
  }, 150)
}

const handleSettingsSave = (data) => {
  const { settings } = data
  if (settings.questionCount !== moduleSettings.value.questionCount) {
    updateQuestionCount(settings.questionCount)
    const newCount = settings.questionCount || 10
    const newOffset = Math.floor(questionOffset.value / newCount) * newCount
    questionOffset.value = Math.max(0, newOffset)
    fetchQuestions()
  }
}

const handleSubmit = () => {
  if (props.moduleType === 'mock') {
    const unanswered = totalQuestions.value - answeredCount.value
    let msg = `确定要交卷吗？`
    if (unanswered > 0) {
      msg = `您还有 ${unanswered} 题未作答，确定要交卷吗？`
    }
    ElMessageBox.confirm(msg, '确认提交', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      handleSubmitExam()
    }).catch(() => { })
    return
  }

  const unanswered = totalQuestions.value - answeredCount.value
  const hasMoreQuestions = allQuestionsData.value.length > questionOffset.value + totalQuestions.value

  if (unanswered > 0) {
    ElMessageBox.confirm(`您还有 ${unanswered} 题未作答，是否继续提交并查看解析？`, '提示', {
      confirmButtonText: '继续提交',
      cancelButtonText: '继续刷题',
      type: 'warning'
    }).then(() => {
      handleSubmitExam()
      hasSubmittedCurrentBatch.value = true
      if (hasMoreQuestions) {
        ElMessageBox.confirm('恭喜完成！是否继续刷下一波题目？', '继续刷题', {
          confirmButtonText: '继续刷下一波',
          cancelButtonText: '查看结果',
          type: 'success'
        }).then(() => {
          jumpToNextBatch()
        }).catch(() => {
          handleSubmitExam()
          hasSubmittedCurrentBatch.value = true
        })
      }
    }).catch(() => {
      handleSubmitExam()
      hasSubmittedCurrentBatch.value = true
    })
  } else {
    handleSubmitExam()
    hasSubmittedCurrentBatch.value = true
    if (hasMoreQuestions) {
      if (isExamMode.value) {
        ElMessageBox.confirm('恭喜完成！是否继续刷下一波题目？', '继续刷题', {
          confirmButtonText: '继续刷下一波',
          cancelButtonText: '查看结果',
          type: 'success'
        }).then(() => {
          jumpToNextBatch()
        }).catch(() => {
          handleSubmitExam()
          hasSubmittedCurrentBatch.value = true
        })
      } else {
        ElMessageBox.confirm('恭喜完成！是否继续刷下一波题目？', '继续刷题', {
          confirmButtonText: '继续刷下一波',
          cancelButtonText: '查看结果',
          type: 'success'
        }).then(() => {
          jumpToNextBatch()
        }).catch(() => {
          handleSubmitExam()
          hasSubmittedCurrentBatch.value = true
        })
      }
    }
  }
}

const { proxy } = getCurrentInstance()

const {
  questions,
  currentQuestionIndex,
  selectedAnswer,
  answers,
  loading,
  subFillBlankAnswers,
  subEssayAnswers,
  questionOffset,
  allQuestionsData,
  currentQuestion,
  totalQuestions,
  correctCount,
  wrongCount,
  accuracy,
  displayOptions,
  fetchQuestions,
  resetAnswers,
  goToQuestion,
  nextQuestion,
  prevQuestion,
  selectOption,
  selectSubOption,
  updateSubFillBlankAnswer,
  updateSubEssayAnswer,
  handleAnswerSubmission,
  resetPractice,
  showAllAnalysis,
  collectQuestion,
  markQuestion,
  addNote,
  reportQuestion,
  updateOnlyWrong,
  updateQuestionCount,
  updateQuestionOffset,
  applyQuestionLimits,
  loadBatchWithoutReset
} = useQuestionPractice(props, { proxy }, {
  questionCount: moduleSettings.value.questionCount,
  onlyWrong: moduleSettings.value.onlyWrong
})

const handleSubmitExam = () => {
  showAllAnalysis()
  const score = Math.round((correctCount.value / totalQuestions.value) * 100)
  totalScore.value = score
  showExamResult.value = true
}

watch(() => moduleSettings.value.questionCount, (val) => {
  updateQuestionCount(val)
  fetchQuestions()
})

watch(() => moduleSettings.value.onlyWrong, (val) => {
  updateOnlyWrong(val)
  fetchQuestions()
})

watch(overviewMode, (val) => {
  if (val) {
    const savedIndex = moduleSettings.value.overviewScrollIndex || 0
    if (savedIndex > 0 && questionStreamRef.value) {
      setTimeout(() => {
        const children = questionStreamRef.value.children
        if (children && children[savedIndex]) {
          children[savedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        highlightedIndex.value = savedIndex
      }, 100)
    }
  }
})

function openAiAnalysis() {
  const questionId = currentQuestion.value?.id
  if (!questionId) return
  if (analysisCache.value.has(questionId)) {
    currentAnalysisContent.value = analysisCache.value.get(questionId)
  } else {
    currentAnalysisContent.value = ''
  }
  showAnalysisDialog.value = true
}

function getQuestionTypeName(type) {
  const typeMap = {
    single: '单选题', multiple: '多选题', truefalse: '判断题',
    fillblank: '填空题', essay: '简答题', readingComprehension: '组合题', cloze: '组合题'
  }
  return typeMap[type] || type
}

function formatOptionsForAnalysis(question) {
  if (!question || !question.options) return ''
  if (Array.isArray(question.options)) return JSON.stringify(question.options)
  return question.options
}

const analysisCache = ref(new Map())
const currentAnalysisContent = ref('')
const isAnalysisGenerating = ref(false)

function updateAnalysisCache(questionId, content) {
  analysisCache.value.set(questionId, content)
}

function setAnalysisGenerating(generating) {
  isAnalysisGenerating.value = generating
}

function handleSelectOption(index) {
  selectOption(index)

  if (isExamMode.value) return
  if (!moduleSettings.value.autoNextOnCorrect) return

  const q = currentQuestion.value
  if (!q) return

  if (q.type === 'single' || q.type === 'truefalse') {
    if (selectedAnswer.value === q.correctAnswer && currentQuestionIndex.value < totalQuestions.value - 1) {
      nextQuestion()
    }
  } else if (q.type === 'multiple') {
    const selected = Array.isArray(selectedAnswer.value) ? selectedAnswer.value : []
    const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : []
    if (selected.length === correct.length && selected.every(v => correct.includes(v))) {
      if (currentQuestionIndex.value < totalQuestions.value - 1) {
        nextQuestion()
      }
    }
  }
}

defineExpose({})
</script>

<style scoped>
.only-wrong-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin: 0 24px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
}

.continue-practice-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
  position: sticky;
  bottom: 20px;
  background: white;
  z-index: 10;
}

.continue-practice-area .el-button {
  border-radius: 8px;
  font-weight: 500;
  padding: 12px 40px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.overview-submit-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-ring {
  width: 56px;
  height: 56px;
  border: 4px solid #e5e7eb;
  border-top-color: #6b9ac9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 15px;
  color: #6b7280;
  letter-spacing: 1px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style src="@/assets/styles/PracticeComponent.css"></style>