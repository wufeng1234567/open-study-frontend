<template>
  <div class="practice-container">
    <PracticeHeader
      :mode="mode"
      :bank-name="bankName"
      @close="$emit('close')"
    />
    
    <div class="main-content">
      <!-- 左侧题目区域 -->
      <QuestionDisplay
        :current-question="currentQuestion"
        :current-question-index="currentQuestionIndex"
        :total-questions="totalQuestions"
        :selected-answer="selectedAnswer"
        :sub-fill-blank-answers="subFillBlankAnswers"
        :sub-essay-answers="subEssayAnswers"
        :answers="answers"
        @select-option="selectOption"
        @update-answer="value => selectedAnswer = value"
        @select-sub-option="selectSubOption"
        @update-sub-fill-blank-answer="updateSubFillBlankAnswer"
        @update-sub-essay-answer="updateSubEssayAnswer"
      />
      
      <!-- 右侧答题卡 -->
      <AnswerCard
        :questions="questions"
        :current-question-index="currentQuestionIndex"
        :stats="{
          correctCount,
          wrongCount,
          accuracy
        }"
        @go-to-question="goToQuestion"
        @reset-practice="resetPractice"
        @view-result="viewResult"
      />
    </div>
    
    <!-- 底部导航 --> <!-- 底部导航 -->
    <QuestionNavigation
      :show-prev="currentQuestionIndex > 0"
      :show-next="currentQuestionIndex < totalQuestions - 1"
      :question-id="currentQuestion?.id"
      :bank-id="bankId"  
      @prev-question="prevQuestion"
      @next-question="nextQuestion"
      @mark="markQuestion"
      @add-note="addNote"
      @report="reportQuestion"
    />
  
  </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import PracticeHeader from './PracticeHeader.vue'
import QuestionDisplay from './QuestionDisplay.vue'
import AnswerCard from './AnswerCard.vue'
import QuestionNavigation from './QuestionNavigation.vue'
import { useQuestionPractice } from '@/composables/useQuestionPractice'

const props = defineProps({
  bankId: { type: Number, required: true },
  bankName: { type: String, default: '题库' },
  mode: {
    type: String,
    required: true,
    validator: (val) => ['sequential', 'random', 'byType', 'mock'].includes(val)
  }
})

const { proxy } = getCurrentInstance()

const {
  // 响应式数据
  questions,
  currentQuestionIndex,
  selectedAnswer,
  answers,
  loading,
  subFillBlankAnswers,
  subEssayAnswers,
  
  // 计算属性
  currentQuestion,
  totalQuestions,
  correctCount,
  wrongCount,
  accuracy,
  displayOptions,
  
  // 方法
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
  viewResult,
  collectQuestion,
  markQuestion,
  addNote,
  reportQuestion
} = useQuestionPractice(props, { proxy })

defineExpose({
  // 如果需要暴露给父组件的方法
})
</script>

<style src="@/assets/styles/PracticeComponent.css"></style>