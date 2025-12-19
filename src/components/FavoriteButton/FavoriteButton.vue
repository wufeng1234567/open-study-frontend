<!-- src/components/FavoriteButton/FavoriteButton.vue -->
<template>
  <el-button 
    :type="buttonType" 
    :size="size" 
    @click="handleCollect"
    :loading="isLoading"
    :disabled="disabled"
    :plain="plain"
    :round="round"
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

const props = defineProps({
  // 必需属性
  type: {
    type: String,
    required: true,
    validator: (value) => ['bank', 'question'].includes(value)
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

// 计算属性
const buttonType = computed(() => {
  return isCollected.value ? props.collectedButtonType : props.uncollectedButtonType
})

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
  if (props.initialCollected !== null) {
    // 如果父组件提供了初始状态，使用父组件的状态
    isCollected.value = props.initialCollected
    return
  }
  
  const userId = getCurrentUserId()
  if (!userId) return
  
  const checkApi = props.type === 'bank' ? checkBankFavoriteExists : checkQuestionFavoriteExists
  
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
    const deleteApi = props.type === 'bank' ? deleteFavoriteBankByUserAndBank : deleteFavoriteQuestionByUserAndQuestion
    
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
    } else {
      data.questionId = props.targetId
    }
    
    const addApi = props.type === 'bank' ? addFavoriteBank : addFavoriteQuestion
    
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
watch(() => props.targetId, () => {
  checkFavoriteStatus()
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
.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>