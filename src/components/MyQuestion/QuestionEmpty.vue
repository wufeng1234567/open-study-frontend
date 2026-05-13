<!-- src/components/MyQuestion/QuestionEmpty.vue -->
<template>
  <div class="empty-state">
    <el-empty :description="emptyText">
      <template #image>
        <el-icon size="80"><Star /></el-icon>
      </template>
      <el-button type="primary" @click="$emit('empty-action')">
        {{ actionText }}
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star } from '@element-plus/icons-vue'

const props = defineProps({
  questionType: {
    type: String,
    default: 'favorite'
  },
  actionText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['empty-action'])

const emptyText = computed(() => {
  const textMap = {
    favorite: '暂无收藏的题�?,
    wrong: '暂无错题记录',
    marked: '暂无斩题记录'
  }
  return textMap[props.questionType] || '暂无数据'
})

const computedActionText = computed(() => {
  if (props.actionText) return props.actionText
  
  const textMap = {
    favorite: '去发现题�?,
    wrong: '去练习题�?,
    marked: '去标记题�?
  }
  return textMap[props.questionType] || '去探�?
})
</script>

<style scoped>
.empty-state {
  text-align: center;
}
</style>