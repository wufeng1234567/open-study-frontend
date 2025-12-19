<template>
  <div class="filter-sidebar">
     <!-- 调试信息 -->
      <!-- <div class="debug-info">
      <div>当前选中的bankId: {{ localFilter.bankId }}</div>
      <div>题库名称: {{ currentSelectedBank }}</div>
      <div>题库列表长度: {{ questionBanks.length }}</div>
    </div> -->
    <div class="filter-section">
      <h3 class="filter-title">筛选</h3>
      
      
      <!-- 题库筛选 -->
      <div class="filter-group">
        <div class="filter-label">所属题库</div>
        <div class="filter-options">
          <el-select
            v-model="localFilter.bankId"  
            placeholder="选择题库"
            clearable
            @change="handleChange"
            class="bank-select"
          >
            <el-option
              v-for="bank in questionBanks"
              :key="bank.id"
              :label="bank.bankName"
              :value="bank.id"
            />
          </el-select>
        </div>
      </div>
      
      <!-- 题型筛选 -->
      <div class="filter-group">
        <div class="filter-label">题型</div>
        <div class="filter-options">
          <el-checkbox-group v-model="localFilter.questionType" @change="handleChange">
            <el-checkbox 
              v-for="type in questionTypes" 
              :key="type.value" 
              :label="type.value"
              class="filter-checkbox"
            >
              {{ type.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      
      <!-- 难度筛选 -->
      <div class="filter-group">
        <div class="filter-label">难度</div>
        <div class="filter-options">
          <el-checkbox-group v-model="localFilter.difficulty" @change="handleChange">
            <el-checkbox 
              v-for="diff in difficultyOptions" 
              :key="diff.value" 
              :label="diff.value"
              class="filter-checkbox"
            >
              <span :class="`difficulty-${diff.value}`">{{ diff.label }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      
      <!-- 是否标星 -->
      <div v-if="showStarFilter" class="filter-group">
        <div class="filter-label">标星状态</div>
        <div class="filter-options">
          <el-radio-group v-model="localFilter.isStarred" @change="handleChange">
            <el-radio :label="null">全部</el-radio>
            <el-radio :label="1">已标星</el-radio>
            <el-radio :label="0">未标星</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 收藏状态 -->
      <div v-if="showFavoriteStatusFilter" class="filter-group">
        <div class="filter-label">收藏状态</div>
        <div class="filter-options">
          <el-radio-group v-model="localFilter.favoriteStatus" @change="handleChange">
            <el-radio :label="1">正常收藏</el-radio>
            <el-radio :label="2">已掌握</el-radio>
            <el-radio :label="3">待复习</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 掌握状态筛选（错题页面） -->
      <div v-if="questionType === 'wrong'" class="filter-group">
        <div class="filter-label">掌握状态</div>
        <div class="filter-options">
          <el-radio-group v-model="localFilter.isMastered" @change="handleChange">
            <el-radio :label="null">全部</el-radio>
            <el-radio :label="0">未掌握</el-radio>
            <el-radio :label="1">已掌握</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 斩题类型筛选（斩题页面） -->
      <div v-if="questionType === 'marked'" class="filter-group">
        <div class="filter-label">斩题类型</div>
        <div class="filter-options">
          <el-radio-group v-model="localFilter.markedType" @change="handleChange">
            <el-radio :label="null">全部</el-radio>
            <el-radio :label="1">重点攻克</el-radio>
            <el-radio :label="2">难题攻克</el-radio>
            <el-radio :label="3">易错题攻克</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 清空筛选按钮 -->
      <div class="filter-actions">
        <el-button type="default" size="small" @click="handleReset" plain>
          清空筛选
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const emit = defineEmits(['filter-change', 'reset-filters'])

// ============ Props 定义 ============
const props = defineProps({
  filterForm: Object,
  questionBanks: {
    type: Array,
    default: () => []
  },
  questionTypes: {
    type: Array,
    default: () => []
  },
  difficultyOptions: {
    type: Array,
    default: () => []
  },
  showStarFilter: Boolean,
  showFavoriteStatusFilter: Boolean,
  questionType: {
    type: String,
    default: 'favorite'
  }
})

// ============ 响应式数据 ============
// 使用深拷贝初始化 localFilter，避免响应式引用问题
const localFilter = ref(JSON.parse(JSON.stringify(props.filterForm || {})))

// ============ 计算属性 ============
// 添加一个计算属性来显示当前选中的题库
const currentSelectedBank = computed(() => {
  if (!localFilter.value.bankId) return null
  const bank = props.questionBanks.find(b => b.id === localFilter.value.bankId)
  return bank ? bank.bankName : '未知题库'
})

// ============ 方法 ============
const handleChange = () => {
  console.log('QuestionFilterSidebar: 筛选条件变化', localFilter.value)
  // 发送更新后的筛选条件
  emit('filter-change', { ...localFilter.value })
}

const handleReset = () => {
  // 重置本地筛选
  localFilter.value = {
    bankId: null,
    isStarred: null,
    favoriteStatus: props.questionType === 'favorite' ? 1 : null,
    difficulty: [],
    questionType: [],
    isMastered: props.questionType === 'wrong' ? 0 : null,
    markedType: null
  }
  
  console.log('重置筛选后:', localFilter.value)
  emit('reset-filters')
}

// 清除题库筛选
const clearBankFilter = () => {
  console.log('清除题库筛选')
  localFilter.value.bankId = null
  handleChange()
}

// ============ 生命周期 ============
onMounted(() => {
  console.log('QuestionFilterSidebar mounted')
  console.log('初始props.filterForm:', props.filterForm)
  console.log('初始localFilter.value:', localFilter.value)
  console.log('题库列表:', props.questionBanks)
  console.log('路由参数bankId:', route.query.bankId)
})

// ============ 监听器 ============
// 1. 监听父组件filterForm的变化 - 确保及时更新
watch(() => props.filterForm, (newVal) => {
  console.log('QuestionFilterSidebar: filterForm 变化', newVal)
  
  // 深度合并，确保所有字段都更新
  localFilter.value = {
    ...localFilter.value,
    ...newVal
  }
  
  // 确保数组类型也正确更新
  if (newVal.questionType && Array.isArray(newVal.questionType)) {
    localFilter.value.questionType = [...newVal.questionType]
  }
  if (newVal.difficulty && Array.isArray(newVal.difficulty)) {
    localFilter.value.difficulty = [...newVal.difficulty]
  }
  
  console.log('更新后localFilter:', localFilter.value)
}, { deep: true, immediate: true })

// 2. 单独监听 bankId 的变化，确保及时响应
watch(() => props.filterForm?.bankId, (newBankId) => {
  console.log('QuestionFilterSidebar: bankId 变化', newBankId)
  if (newBankId !== localFilter.value.bankId) {
    localFilter.value.bankId = newBankId
    console.log('更新localFilter.bankId为:', newBankId)
  }
}, { immediate: true })

// 3. 监听localFilter的变化（调试用）
watch(localFilter, (newVal) => {
  console.log('localFilter 变化:', newVal)
}, { deep: true })

// 4. 监听题库列表变化
watch(() => props.questionBanks, (newBanks) => {
  console.log('题库列表变化:', newBanks)
}, { immediate: true })

// 5. 监听路由参数，确保从路由过来的bankId能被设置
watch(() => route.query.bankId, (newBankId) => {
  console.log('QuestionFilterSidebar: 路由bankId变化', newBankId)
  
  if (newBankId) {
    const bankIdNum = Number(newBankId)
    
    // 如果路由有bankId，强制更新本地筛选
    if (localFilter.value.bankId !== bankIdNum) {
      console.log('路由参数覆盖本地筛选:', bankIdNum)
      localFilter.value.bankId = bankIdNum
      
      // 立即触发变化
      setTimeout(() => {
        handleChange()
      }, 0)
    }
  } else {
    // 如果路由没有bankId，清空筛选
    if (localFilter.value.bankId !== null) {
      console.log('路由参数清空，清除题库筛选')
      localFilter.value.bankId = null
      setTimeout(() => {
        handleChange()
      }, 0)
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* 样式保持不变 */
.filter-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
  
  .filter-section {
    .filter-title {
      margin: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      border-bottom: 1px solid #e4e7ed;
      padding-bottom: 10px;
    }
    
    .filter-group {
      margin-bottom: 20px;
      
      .filter-label {
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .filter-options {
        :deep(.el-checkbox-group),
        :deep(.el-radio-group) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        :deep(.el-checkbox),
        :deep(.el-radio) {
          margin-right: 0;
        }
        
        .bank-select {
          width: 100%;
        }
      }
    }
    
    .filter-actions {
      margin-top: 24px;
      
      :deep(.el-button) {
        width: 100%;
      }
    }
  }
}

.difficulty-1 { color: #67c23a; }
.difficulty-2 { color: #409eff; }
.difficulty-3 { color: #e6a23c; }
.difficulty-4 { color: #f56c6c; }
.debug-info {
  background: #f5f5f5;
  padding: 8px;
  margin-bottom: 16px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}
</style>