<!-- src/components/FavoriteButton/FavoriteButton.vue -->
<template>
  <el-button
    :class="['favorite-btn', { 'is-collected': isCollected }]"
    :size="size"
    @click="handleCollect"
    :loading="isLoading"
    :disabled="disabled"
    plain
  >
    <el-icon><Star /></el-icon>
    {{ buttonText }}
  </el-button>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits, onMounted } from 'vue'
import { getCurrentInstance } from 'vue'
import useUserStore from '@/store/modules/user'
import { Star } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

// API 根据类型动态导入
import {
  checkBankFavoriteExists,
  addFavoriteBank,
  deleteFavoriteBankByUserAndBank
} from '@/api/favoriteBank/favoriteBank'
import {
  checkQuestionFavoriteExists,
  addFavoriteQuestion,
  deleteFavoriteQuestionByUserAndQuestion
} from '@/api/favoriteQuestion/favoriteQuestion'
import {
  checkNoteFavoriteExists,
  addFavoriteNote,
  deleteFavoriteNoteByUserAndNote
} from '@/api/favoriteNote/favoriteNote'

const props = defineProps({
  // 必需属性
  type: {
    type: String,
    required: true,
    validator: (value) => ['bank', 'question', 'note'].includes(value)
  },
  targetId: {
    type: [Number, String],
    required: true
  },
  
  // 可选属性
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  plain: {
    type: Boolean,
    default: false
  },
  round: {
    type: Boolean,
    default: false
  },
  // 初始收藏状态（可选，如果不传会自动检测）
  initialCollected: {
    type: Boolean,
    default: null
  },
  // 按钮类型配置
  collectedButtonType: {
    type: String,
    default: 'warning'
  },
  uncollectedButtonType: {
    type: String,
    default: 'info'
  }
})

const emit = defineEmits(['update:collected', 'collect-success', 'collect-error', 'uncollect-success'])

// 响应式数据
const isCollected = ref(props.initialCollected || false)
const isLoading = ref(false)
const favoriteId = ref(null)
const userStore = useUserStore()

const buttonText = computed(() => {
  return isCollected.value ? '已收藏' : '收藏'
})

// 获取当前用户ID
const getCurrentUserId = () => {
  return userStore.id || userStore.userId
}

// 检查登录状态
const checkLogin = () => {
  const userId = getCurrentUserId()
  if (!userId) {
    proxy.$modal.msgWarning('请先登录')
    return false
  }
  return true
}

// 检查收藏状态
const checkFavoriteStatus = () => {
  // 如果没有 targetId，不检查
  if (!props.targetId) {
    return
  }

  if (props.initialCollected !== null) {
    // 如果父组件提供了初始状态，使用父组件的状态
    isCollected.value = props.initialCollected
    return
  }

  const userId = getCurrentUserId()
  if (!userId) return

  let checkApi
  if (props.type === 'bank') {
    checkApi = checkBankFavoriteExists
  } else if (props.type === 'question') {
    checkApi = checkQuestionFavoriteExists
  } else if (props.type === 'note') {
    checkApi = checkNoteFavoriteExists
  }

  checkApi(userId, props.targetId).then(response => {
    if (response.code === 200) {
      isCollected.value = response.data.isFavorited
      if (response.data.favoriteId) {
        favoriteId.value = response.data.favoriteId
      }
    }
  }).catch(error => {
    console.error('检查收藏状态失败:', error)
    // 如果检查失败，默认设为未收藏
    isCollected.value = false
  })
}

// 处理收藏/取消收藏
const handleCollect = () => {
  if (!checkLogin()) return

  isLoading.value = true

  const userId = getCurrentUserId()

  if (isCollected.value) {
    // 取消收藏
    let deleteApi
    if (props.type === 'bank') {
      deleteApi = deleteFavoriteBankByUserAndBank
    } else if (props.type === 'question') {
      deleteApi = deleteFavoriteQuestionByUserAndQuestion
    } else if (props.type === 'note') {
      deleteApi = deleteFavoriteNoteByUserAndNote
    }

    deleteApi(userId, props.targetId).then(result => {
      if (result.code === 200) {
        isCollected.value = false
        favoriteId.value = null
        emit('update:collected', false)
        emit('uncollect-success', props.targetId, props.type)
        proxy.$modal.msgSuccess('已取消收藏')
      }
      isLoading.value = false
    }).catch(error => {
      handleCollectError(error)
      isLoading.value = false
    })
  } else {
    // 收藏
    const data = {
      userId: userId
    }

    if (props.type === 'bank') {
      data.bankId = props.targetId
    } else if (props.type === 'question') {
      data.questionId = props.targetId
    } else if (props.type === 'note') {
      data.noteId = props.targetId
    }

    let addApi
    if (props.type === 'bank') {
      addApi = addFavoriteBank
    } else if (props.type === 'question') {
      addApi = addFavoriteQuestion
    } else if (props.type === 'note') {
      addApi = addFavoriteNote
    }

    addApi(data).then(result => {
      if (result.code === 200) {
        isCollected.value = true
        // 重新获取收藏状态以获取 favoriteId
        checkFavoriteStatus()
        emit('update:collected', true)
        emit('collect-success', props.targetId, props.type)
        proxy.$modal.msgSuccess('收藏成功')
      }
      isLoading.value = false
    }).catch(error => {
      handleCollectError(error)
      isLoading.value = false
    })
  }
}

// 处理收藏错误
const handleCollectError = (error) => {
  console.error('收藏操作失败:', error)
  
  if (error.response && error.response.data) {
    const msg = error.response.data.msg || error.response.data.message
    if (msg && msg.includes('已收藏')) {
      // 如果后端提示已收藏，更新状态
      isCollected.value = true
      checkFavoriteStatus()
      proxy.$modal.msgInfo('已收藏')
    } else {
      proxy.$modal.msgError(msg || '操作失败')
    }
  } else {
    proxy.$modal.msgError(error.message || '操作失败')
  }
  
  emit('collect-error', error, props.targetId, props.type)
}

// 监听 targetId 变化
watch(() => props.targetId, (newVal) => {
  if (newVal) {
    checkFavoriteStatus()
  }
})

// 监听 initialCollected 变化
watch(() => props.initialCollected, (newVal) => {
  if (newVal !== null) {
    isCollected.value = newVal
  }
})

// 组件挂载时检查收藏状态
onMounted(() => {
  checkFavoriteStatus()
})

// 暴露方法供父组件调用
defineExpose({
  checkStatus: checkFavoriteStatus,
  refresh: checkFavoriteStatus
})
</script>

<style scoped>
.favorite-btn {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px 16px;
  height: auto;
  font-weight: 500;
}

.favorite-btn:hover {
  transform: translateY(-2px);
  border-color: #d1d5db;
  color: #4b5563;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.favorite-btn.is-collected {
  background: #fff;
  border-color: #f59e0b;
  color: #f59e0b;
}

.favorite-btn.is-collected:hover {
  border-color: #d97706;
  color: #d97706;
  background: #fffbf0;
}

.favorite-btn .el-icon {
  margin-right: 4px;
}

.favorite-btn.is-loading {
  opacity: 0.7;
}
</style>