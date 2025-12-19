<template>
  <div class="answer-card">
    <div class="card-header">
      <h4>答题卡</h4>
      <el-button type="text" size="small" @click="$emit('reset-practice')">重新练习</el-button>
    </div>

    <div class="question-grid">
      <div
        v-for="(item, index) in questions"
        :key="index"
        class="grid-item"
        :class="{
          answered: item.answered,
          correct: item.correct,
          wrong: !item.correct && item.answered,
          current: index === currentQuestionIndex
        }"
        @click="$emit('go-to-question', index)"
      >
        {{ index + 1 }}
      </div>
    </div>

    <div class="stats">
      <div>答对：<span class="correct">{{ stats.correctCount }}</span>题</div>
      <div>答错：<span class="wrong">{{ stats.wrongCount }}</span>题</div>
      <div>正确率：<span class="rate">{{ stats.accuracy }}%</span></div>
      <el-button type="primary" size="small" @click="$emit('view-result')">查看练习成绩</el-button>
    </div>

    <!-- 设置面板 -->
    <div class="settings">
      <h4>设置</h4>
      <div class="setting-item">
        <span>答对自动下一题</span>
        <el-switch v-model="autoNextOnCorrect" />
      </div>
      <div class="setting-item">
        <span>背题模式</span>
        <el-switch v-model="reviewMode" />
      </div>
      <div class="setting-item">
        <span>选项乱序</span>
        <el-switch v-model="shuffleOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  stats: {
    type: Object,
    default: () => ({
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0
    })
  }
})

defineEmits(['go-to-question', 'reset-practice', 'view-result'])

// 设置选项
const autoNextOnCorrect = ref(false)
const reviewMode = ref(false)
const shuffleOptions = ref(true)
</script>