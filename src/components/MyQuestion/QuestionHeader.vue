<!-- src/components/MyQuestion/QuestionHeader.vue -->
<template>
  <PageHeader :title="title" :total="total" :item-name="itemName" placeholder="搜索题目内容" :model-value="searchKeyword"
    @search="handleSearch" @refresh="handleRefresh" @update:model-value="handleUpdate" />
</template>

<script setup>
import { computed } from 'vue'
import PageHeader from '@/components/PageHeader/index.vue'

const props = defineProps({
  title: String,
  total: Number,
  searchKeyword: String,
  questionType: {
    type: String,
    default: 'favorite'
  }
})

const emit = defineEmits(['search', 'refresh', 'update:searchKeyword'])

const itemName = computed(() => {
  const map = { favorite: '收藏题目', wrong: '错题', marked: '斩题' }
  return map[props.questionType] || '题目'
})

const handleSearch = (keyword) => {
  emit('search', keyword)
}

const handleUpdate = (keyword) => {
  emit('update:searchKeyword', keyword)
}

const handleRefresh = () => emit('refresh')
</script>