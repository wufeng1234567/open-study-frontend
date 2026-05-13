<!-- src/components/MyQuestion/QuestionFilterSidebar.vue -->
<template>
  <div class="filter-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 收缩/展开按钮 -->
    <div class="toggle-btn" @click="toggleCollapse">
      <el-icon>
        <DArrowLeft v-if="!isCollapsed" />
        <DArrowRight v-else />
      </el-icon>
    </div>

    <!-- 筛选内容 -->
    <div class="filter-content" v-show="!isCollapsed">
      <div class="filter-section">
        <h3 class="filter-title">筛选</h3>

        <!-- 题库筛选 -->
        <div class="filter-group">
          <div class="filter-label">所属题库</div>
          <div class="filter-options">
            <el-select v-model="localFilter.bankId" placeholder="选择题库" clearable @change="handleChange"
              class="bank-select">
              <el-option v-for="bank in questionBanks" :key="bank.id" :label="bank.bankName" :value="bank.id" />
            </el-select>
          </div>
        </div>

        <!-- 题型筛选 -->
        <div class="filter-group">
          <div class="filter-label">题型</div>
          <div class="filter-options">
            <el-checkbox-group v-model="localFilter.questionType" @change="handleChange">
              <el-checkbox v-for="type in questionTypes" :key="type.value" :label="type.value" class="filter-checkbox">
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
              <el-checkbox v-for="diff in difficultyOptions" :key="diff.value" :label="diff.value"
                class="filter-checkbox">
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
              <el-radio :label="1">错题</el-radio>
              <el-radio :label="2">难题</el-radio>
              <el-radio :label="3">重点</el-radio>
              <el-radio :label="4">易错</el-radio>
              <el-radio :label="5">技巧</el-radio>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const emit = defineEmits(['filter-change', 'reset-filters'])

const props = defineProps({
  filterForm: {
    type: Object,
    default: () => ({})
  },
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
  showStarFilter: {
    type: Boolean,
    default: true
  },
  showFavoriteStatusFilter: {
    type: Boolean,
    default: true
  },
  questionType: {
    type: String,
    default: 'favorite'
  }
})

const isCollapsed = ref(['favorite', 'wrong', 'marked'].includes(props.questionType))
const localFilter = ref(JSON.parse(JSON.stringify(props.filterForm || {})))

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleChange = () => {
  emit('filter-change', { ...localFilter.value })
}

const handleReset = () => {
  localFilter.value = {
    bankId: null,
    isStarred: null,
    favoriteStatus: props.questionType === 'favorite' ? 1 : null,
    difficulty: [],
    questionType: [],
    isMastered: props.questionType === 'wrong' ? 0 : null,
    markedType: null
  }
  emit('reset-filters')
}

onMounted(() => {
  // 初始化时如果有路由参数，应用筛选
  if (route.query.bankId) {
    const bankIdNum = Number(route.query.bankId)
    if (localFilter.value.bankId !== bankIdNum) {
      localFilter.value.bankId = bankIdNum
      setTimeout(() => {
        handleChange()
      }, 0)
    }
  }
})

// 监听父组件filterForm的变化
watch(() => props.filterForm, (newVal) => {
  if (!newVal) return
  localFilter.value = {
    ...localFilter.value,
    ...newVal
  }
  if (newVal.questionType && Array.isArray(newVal.questionType)) {
    localFilter.value.questionType = [...newVal.questionType]
  }
  if (newVal.difficulty && Array.isArray(newVal.difficulty)) {
    localFilter.value.difficulty = [...newVal.difficulty]
  }
}, { deep: true, immediate: true })

// 监听路由参数变化
watch(() => route.query.bankId, (newBankId) => {
  if (newBankId) {
    const bankIdNum = Number(newBankId)
    if (localFilter.value.bankId !== bankIdNum) {
      localFilter.value.bankId = bankIdNum
      setTimeout(() => {
        handleChange()
      }, 0)
    }
  } else {
    if (localFilter.value.bankId !== null) {
      localFilter.value.bankId = null
      setTimeout(() => {
        handleChange()
      }, 0)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.filter-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: 280px;
  height: auto;
  max-height: 100%;
  background: #fff;
  border-radius: 0 16px 16px 0;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  border-left: none;
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.filter-sidebar.collapsed {
  width: 0;
  height: auto;
  min-height: 0;
  border: none;
  box-shadow: none;
}

.filter-sidebar .toggle-btn {
  position: absolute;
  right: -36px;
  top: 20px;
  width: 36px;
  height: 40px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-left: none;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.filter-sidebar.collapsed .toggle-btn {
  right: auto;
  left: -20px;
  border: 1px solid #e4e7ed;
  border-left: none;
  border-radius: 0 8px 8px 0;
}

.toggle-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.toggle-btn:hover .el-icon {
  color: #409eff;
}

.toggle-btn .el-icon {
  font-size: 18px;
  color: #606266;
  transition: color 0.2s;
}

.filter-content {
  padding: 16px 16px 16px 20px;
  height: auto;
  max-height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  background: #fff;
  border-radius: 0 16px 16px 0;
}

.filter-content::-webkit-scrollbar {
  width: 4px;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.filter-section .filter-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 12px;
}

.filter-group {
  margin-bottom: 20px;
}

.filter-group .filter-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-options :deep(.el-checkbox-group),
.filter-options :deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-options :deep(.el-checkbox),
.filter-options :deep(.el-radio) {
  margin-right: 0;
  font-size: 13px;
}

.filter-options .bank-select {
  width: 100%;
}

.filter-options :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.filter-actions {
  margin-top: 24px;
}

.filter-actions :deep(.el-button) {
  width: 100%;
  border-radius: 8px;
}

.difficulty-1 {
  color: #67c23a;
}

.difficulty-2 {
  color: #409eff;
}

.difficulty-3 {
  color: #e6a23c;
}

.difficulty-4 {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .filter-sidebar {
    width: 260px;
  }

  .filter-sidebar .toggle-btn {
    right: -36px;
  }

  .filter-sidebar.collapsed .toggle-btn {
    right: auto;
    left: -20px;
  }
}
</style>