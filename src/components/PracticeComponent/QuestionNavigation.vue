<!-- src/components/PracticeComponent/QuestionNavigation.vue -->
<template>
  <div class="navigation-section">
    <!-- 操作按钮 -->
    <div class="navigation-buttons">
      <el-button size="small" @click="$emit('prev-question')" v-if="showPrev">上一题</el-button>
      <el-button
        type="primary"
        size="small"
        @click="$emit('next-question')"
        v-if="showNext"
      >
        下一题
      </el-button>
    </div>

    <!-- 功能按钮 -->
    <div class="action-buttons">
      <!-- 收藏组件 -->
      <FavoriteButton 
        v-if="questionId"
        :type="'question'"
        :target-id="questionId"
        size="small"
        :plain="true"
        collected-button-type="primary"
        uncollected-button-type="default"
      />
      
      <!-- 斩题组件 -->
      <MarkedButton
        v-if="questionId"
        :question-id="questionId"
        size="small"
        :plain="true"
        marked-button-type="primary"
        unmarked-button-type="default"
        :auto-check="true"
        :show-success-message="true"
        @change="handleMarkedChange"
      />
      
      <el-button size="small" @click="$emit('add-note')">笔记</el-button>
      <el-button size="small" @click="$emit('report')">举报</el-button>
    </div>
  </div>
</template>

<script setup>
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton.vue'
import MarkedButton from '@/components/MarkedButton/MarkedButton.vue' // 新增导入

defineProps({
  showPrev: {
    type: Boolean,
    default: true
  },
  showNext: {
    type: Boolean,
    default: true
  },
  questionId: {
    type: [Number, String],
    default: null
  },
  bankId: { // 新增：传递题库ID
    type: [Number, String],
    default: null
  }
})

defineEmits([
  'prev-question',
  'next-question',
  'mark',
  'add-note',
  'report'
])

// 处理斩题状态变化
const handleMarkedChange = (isMarked) => {
  console.log(`斩题状态变化: ${isMarked ? '已斩题' : '未斩题'}`)
  // 可以在这里添加额外的处理逻辑
}
</script>