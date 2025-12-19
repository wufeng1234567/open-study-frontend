<!-- src/components/MyQuestion/QuestionHeader.vue -->
<template>
  <div class="search-area">
    <div class="title-section">
      <h2 class="page-title">{{ title }}</h2>
      <span class="total-count">共 {{ total }} 道{{ getTypeText() }}</span>
    </div>
    
    <div class="search-section">
      <el-input
        v-model="keyword"
        placeholder="搜索题目内容"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleClear"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button 
        type="primary" 
        @click="handleSearch"
        class="search-btn"
      >
        搜索
      </el-button>
      
      <el-button 
        @click="handleRefresh"
        class="refresh-btn"
      >
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  title: String,
  total: Number,
  searchKeyword: String,
  questionType: {
    type: String,
    default: 'favorite'
  }
})

const emit = defineEmits(['search', 'clear-search', 'refresh'])

const keyword = ref(props.searchKeyword || '')

watch(() => props.searchKeyword, (newVal) => {
  keyword.value = newVal || ''
})

const getTypeText = () => {
  const typeMap = {
    favorite: '收藏题目',
    wrong: '错题',
    marked: '斩题'
  }
  return typeMap[props.questionType] || '题目'
}

const handleSearch = () => {
  emit('search', keyword.value)
}

const handleClear = () => {
  keyword.value = ''
  emit('clear-search')
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.search-area {
  .title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
    
    .total-count {
      color: #409eff;
      font-weight: 500;
    }
  }
  
  .search-section {
    display: flex;
    gap: 12px;
    
    .search-input {
      flex: 1;
      max-width: 400px;
    }
  }
}
</style>