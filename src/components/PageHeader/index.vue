<!-- 通用页面头部组件（标题 + 搜索） -->
<template>
  <div class="page-header">
    <!-- 标题和搜索区域 -->
    <div class="search-area">
      <div class="title-section">
        <h2 class="page-title">{{ title }}</h2>
        <span class="total-count">{{ countText }}</span>
      </div>

      <div class="search-section">
        <el-input v-model="keyword" :placeholder="placeholder" clearable @input="handleInput" @keyup.enter="handleEnter"
          class="search-input">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <el-button @click="handleRefresh" class="refresh-btn">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>

        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: '个'
  },
  itemName: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索...'
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['search', 'refresh', 'update:modelValue'])

const keyword = ref(props.modelValue || '')
let searchTimer = null

watch(() => props.modelValue, (val) => {
  keyword.value = val || ''
})

const countText = computed(() => {
  if (!props.itemName) return `共 ${props.total} ${props.unit}`
  return `共 ${props.total} ${props.unit}${props.itemName}`
})

const handleInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('update:modelValue', keyword.value)
    emit('search', keyword.value)
  }, 300)
}

const handleEnter = () => {
  if (searchTimer) clearTimeout(searchTimer)
  emit('update:modelValue', keyword.value)
  emit('search', keyword.value)
}

const handleRefresh = () => emit('refresh')
</script>

<style scoped lang="scss">
.page-header {
  .search-area {
    margin-bottom: 24px;
  }

  .title-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .total-count {
    font-size: 14px;
    color: #6b7280;
  }

  .search-section {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-input {
    flex: 1;
    max-width: 400px;

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e5e7eb;
      background: #fff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :deep(.el-input__wrapper):hover {
      box-shadow: 0 0 0 1px #d1d5db;
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #b3b3b3;
    }
  }

  .refresh-btn {
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    padding: 8px 14px;
    height: auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .refresh-btn:hover {
    transform: translateY(-2px);
    border-color: #d1d5db;
    color: #4b5563;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .refresh-btn:active {
    transform: translateY(0);
  }
}
</style>
