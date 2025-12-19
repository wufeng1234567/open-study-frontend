
<!-- src/components/MyQuestion/MyQuestion.vue -->
<template>
  <div class="app-container">
    <!-- 题目详情弹框 -->
    <QuestionDetailDialog
      v-model:visible="detailDialogVisible"
      :current-favorite-question="currentFavoriteQuestion"
      :current-question-detail="currentQuestionDetail"
      :current-question-index="currentQuestionIndex"
      :dialog-questions="dialogQuestions"
      :is-fullscreen="isFullscreen"
      :selected-answer="selectedAnswer"
      :sub-fill-blank-answers="subFillBlankAnswers"
      :sub-essay-answers="subEssayAnswers"
      :answers="answers"
      :question-type="questionType" 
      @close="closeDetailDialog"
      @toggle-fullscreen="toggleFullscreen"
      @prev-question="prevQuestionInDialog"
      @next-question="nextQuestionInDialog"
      @select-option="selectOption"
      @update-answer="value => selectedAnswer = value"
      @select-sub-option="selectSubOption"
      @update-sub-fill-blank-answer="updateSubFillBlankAnswer"
      @update-sub-essay-answer="updateSubEssayAnswer"
      @mark="markQuestion"
      @add-note="addNote"
      @report="reportQuestion"
    />

    <!-- 主页面 -->
    <div class="favorite-container">
      <!-- 搜索和标题区域 -->
      <QuestionHeader
        :title="headerTitle"
        :total="total"
        :search-keyword="searchQuery?.keyword || ''"
        :question-type="questionType"
        @search="handleSearch"
        @clear-search="handleClearSearch"
        @refresh="handleRefresh"
      />

      <div class="content-wrapper">
        <!-- 左侧筛选栏 -->
        <QuestionFilterSidebar
          :filter-form="filterForm"
          :question-banks="questionBanks"
          :question-types="questionTypes"
          :difficulty-options="difficultyOptions"
          :show-star-filter="showStarFilter"
          :show-favorite-status-filter="showFavoriteStatusFilter"
          :question-type="questionType"
          @filter-change="handleFilterChange"
          @reset-filters="resetFilters"
        />

        <!-- 右侧内容区域 -->
        <div class="content-main">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="6" animated />
          </div>

          <!-- 空状态 -->
          <div v-else-if="!questions || questions.length === 0" class="empty-state">
            <el-empty :description="emptyText">
              <template #image>
                <el-icon size="80"><Star /></el-icon>
              </template>
              <el-button type="primary" @click="handleEmptyAction">
                {{ emptyActionText }}
              </el-button>
            </el-empty>
          </div>

          <!-- 题目卡片列表 -->
          <div v-else class="question-list">
            <el-row :gutter="20">
              <el-col 
                v-for="item in questions" 
                :key="getItemKey(item)" 
                :xs="24" 
                :sm="12" 
                :md="12" 
                :lg="8" 
                class="question-card-col"
              >
                <QuestionCard
                  :item="item"
                  :question-type="questionType"
                  :show-star="showStar"
                  :show-favorite-status="showFavoriteStatus"
                  :show-collect-actions="showCollectActions"
                  :show-study-stats="showStudyStats"
                  :uncollect-loading="uncollectLoading[getItemKey(item)]"
                  @view-detail="handleViewDetail"
                  @toggle-star="toggleStar"
                  @uncollect="handleUncollect"
                />
              </el-col>
            </el-row>
            
            <!-- 分页 -->
            <div class="pagination-section">
              <el-pagination
                v-model:current-page="searchQuery.pageNum"
                v-model:page-size="searchQuery.pageSize"
                :page-sizes="[12, 24, 48, 96]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="MyQuestion">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Star } from '@element-plus/icons-vue'

// 组件导入
import QuestionDetailDialog from './QuestionDetailDialog.vue'
import QuestionHeader from './QuestionHeader.vue'
import QuestionFilterSidebar from './QuestionFilterSidebar.vue'
import QuestionCard from './QuestionCard.vue'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

// 定义props
const props = defineProps({
  // 问题类型：favorite（收藏）、wrong（错题）、marked（斩题）
  questionType: {
    type: String,
    default: 'favorite',
    validator: (value) => ['favorite', 'wrong', 'marked'].includes(value)
  },
  // 页面标题
  headerTitle: {
    type: String,
    default: ''
  },
  // 是否显示星标筛选
  showStarFilter: {
    type: Boolean,
    default: true
  },
  // 是否显示收藏状态筛选
  showFavoriteStatusFilter: {
    type: Boolean,
    default: true
  },
  // 是否显示星标操作
  showStar: {
    type: Boolean,
    default: true
  },
  // 是否显示收藏状态
  showFavoriteStatus: {
    type: Boolean,
    default: true
  },
  // 是否显示收藏相关操作（取消收藏等）
  showCollectActions: {
    type: Boolean,
    default: true
  },
  // 是否显示学习统计
  showStudyStats: {
    type: Boolean,
    default: true
  },
  // 空状态操作按钮文本
  emptyActionText: {
    type: String,
    default: '去发现题目'
  },
  // API配置
  apiConfig: {
    type: Object,
    default: () => ({})
  },
  // 题库数据 - 从父组件传递
  questionBanks: {
    type: Array,
    default: () => []
  },
  // 用户Store - 用于获取用户ID
  userStore: {
    type: Object,
    default: null
  }
})

// 常量定义
const questionTypes = [
  { value: 1, label: '单选题' },
  { value: 2, label: '多选题' },
  { value: 3, label: '判断题' },
  { value: 4, label: '填空题' },
  { value: 5, label: '简答题' },
  { value: 6, label: '阅读理解' },
  { value: 7, label: '完形填空' }
]

const difficultyOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '中等' },
  { value: 3, label: '困难' },
  { value: 4, label: '极难' }
]

// 响应式数据
const loading = ref(true)
const total = ref(0)
const allQuestions = ref([])
const questions = ref([])
const detailDialogVisible = ref(false)
const isFullscreen = ref(false)
const uncollectLoading = ref({})

// 当前查看的题目相关
const currentFavoriteQuestion = ref(null)
const currentQuestionDetail = ref(null)
const currentQuestionIndex = ref(0)
const dialogQuestions = ref([])

// 答题相关（用于弹框内显示）
const selectedAnswer = ref('')
const subFillBlankAnswers = ref({})
const subEssayAnswers = ref({})
const answers = ref([])

// 搜索参数
const searchQuery = reactive({
  pageNum: 1,
  pageSize: 12,
  keyword: '',
  userId: null
})

// 筛选表单
const filterForm = reactive({
  bankId: null,
  isStarred: null,
  favoriteStatus: props.questionType === 'favorite' ? 1 : null,
  difficulty: [],
  questionType: [],
  isMastered: props.questionType === 'wrong' ? 0 : null,
  markedType: null
})

// 标志：是否已自动应用路由参数筛选
const hasAutoAppliedFilter = ref(false)

// 事件发射
const emit = defineEmits([
  'view-detail',
  'toggle-star',
  'uncollect',
  'refresh',
  'empty-action',
  'mark',
  'add-note',
  'report'
])

// 计算属性
const emptyText = computed(() => {
  const textMap = {
    favorite: '暂无收藏的题目',
    wrong: '暂无错题记录',
    marked: '暂无斩题记录'
  }
  return textMap[props.questionType] || '暂无数据'
})

// 获取用户ID
const getCurrentUserId = () => {
  if (!props.userStore) {
    console.error('用户Store未传入')
    return null
  }
  
  const userId = props.userStore.id || props.userStore.userId || props.userStore.user?.userId
  
  if (!userId) {
    console.error('无法获取用户ID，store内容:', props.userStore)
    return null
  }
  
  return userId
}

// 获取题目唯一键
const getItemKey = (item) => {
  if (props.questionType === 'wrong') {
    return item.errorId || item.id
  }
  return item.favoriteId || item.wrongId || item.markedId || item.id
}

// 初始化
onMounted(() => {
  console.log('MyQuestion组件已挂载，questionType:', props.questionType)
  console.log('题库数据:', props.questionBanks)
  
  // 检查题库数据是否传入
  if (!props.questionBanks || props.questionBanks.length === 0) {
    console.warn('题库数据为空，可能需要从父组件获取')
  }
  
  initData()
  
 // 监听路由参数变化
watch(
  () => route.query.bankId,
  (newBankId) => {
    console.log('监听到路由参数bankId变化:', newBankId)
    console.log('当前路由:', route.fullPath)
    
    // 重置自动筛选标志，允许重新应用
    hasAutoAppliedFilter.value = false
    
    if (newBankId) {
      // 使用 setTimeout 确保所有组件都已渲染完成
      setTimeout(() => {
        applyBankIdFilter(newBankId)
      }, 100)
    } else {
      // 如果bankId为空，清空筛选
      filterForm.bankId = null
      hasAutoAppliedFilter.value = false
      handleFilterChange({ bankId: null })
    }
  },
  { immediate: true }
)
})

// 初始化数据，支持所有类型
const initData = () => {
  loading.value = true
  
  if (props.questionType === 'favorite' && props.apiConfig.listApi) {
    console.log('初始化收藏数据')
    initFavoriteData()
  } else if (props.questionType === 'wrong' && props.apiConfig.listApi) {
    console.log('初始化错题数据')
    initWrongData()
  } else if (props.questionType === 'marked' && props.apiConfig.listApi) {
    console.log('初始化斩题数据')
    initMarkedData()
  } else {
    console.warn('未知的问题类型或缺少API配置:', props.questionType)
    loading.value = false
  }
}

// 初始化斩题数据
const initMarkedData = async () => {
  try {
    const userId = getCurrentUserId()
    
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    
    console.log('获取斩题数据，用户ID:', userId)
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      markedStatus: 1
    })
    
    console.log('斩题数据响应:', response)
    
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      console.log('获取到斩题数量:', allQuestions.value.length)
      
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        console.log('questions设置完成，数量:', questions.value.length)
        applySearchAndFilter()
      } else {
        console.log('没有斩题数据')
      }
    } else {
      console.error('获取斩题数据失败:', response.msg)
      proxy.$modal.msgError(response.msg || '获取斩题数据失败')
    }
  } catch (error) {
    console.error('初始化斩题数据失败:', error)
    proxy.$modal.msgError('加载斩题数据失败')
  } finally {
    loading.value = false
    console.log('斩题数据加载完成，loading设置为false')
  }
}

// 初始化收藏数据
const initFavoriteData = async () => {
  try {
    const userId = getCurrentUserId()
    
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    
    console.log('获取收藏数据，用户ID:', userId)
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      favoriteStatus: 1
    })
    
    console.log('收藏数据响应:', response)
    
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      console.log('获取到收藏数量:', allQuestions.value.length)
      
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        console.log('questions设置完成，数量:', questions.value.length)
        applySearchAndFilter()
      } else {
        console.log('没有收藏数据')
      }
    } else {
      console.error('获取收藏数据失败:', response.msg)
      proxy.$modal.msgError(response.msg || '获取数据失败')
    }
  } catch (error) {
    console.error('初始化收藏数据失败:', error)
    proxy.$modal.msgError('加载数据失败')
  } finally {
    loading.value = false
    console.log('收藏数据加载完成，loading设置为false')
  }
}

// 初始化错题数据
const initWrongData = async () => {
  try {
    const userId = getCurrentUserId()
    
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    
    console.log('获取错题数据，用户ID:', userId)
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      status: 1,
      isMastered: filterForm.isMastered
    })
    
    console.log('错题数据响应:', response)
    
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      console.log('获取到错题数量:', allQuestions.value.length)
      
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        console.log('questions设置完成，数量:', questions.value.length)
        applySearchAndFilter()
      } else {
        console.log('没有错题数据')
      }
    } else {
      console.error('获取错题数据失败:', response.msg)
      proxy.$modal.msgError(response.msg || '获取错题数据失败')
    }
  } catch (error) {
    console.error('初始化错题数据失败:', error)
    proxy.$modal.msgError('加载错题数据失败')
  } finally {
    loading.value = false
    console.log('错题数据加载完成，loading设置为false')
  }
}
// 监听题库数据变化
watch(() => props.questionBanks, (newBanks) => {
  console.log('题库数据变化:', newBanks)
  
  // 如果有路由参数且题库数据已加载，重新应用筛选
  if (route.query.bankId && newBanks.length > 0) {
    console.log('题库数据已加载，重新应用筛选')
    hasAutoAppliedFilter.value = false // 重置标志
    setTimeout(() => {
      applyBankIdFilter(route.query.bankId)
    }, 100)
  }
}, { immediate: true })

// 应用题库ID筛选
// 应用题库ID筛选 - 简化版，确保及时更新
const applyBankIdFilter = async (bankId) => {
  console.log('开始应用题库ID筛选，bankId:', bankId, 'hasAutoAppliedFilter:', hasAutoAppliedFilter.value)
  
  if (!bankId) {
    console.log('bankId为空，跳过筛选')
    return
  }
  
  const bankIdNum = Number(bankId)
  console.log('设置题库筛选:', bankIdNum)
  
  // 检查是否与当前筛选相同
  if (filterForm.bankId === bankIdNum) {
    console.log('题库筛选没有变化，跳过')
    return
  }
  
  // 重置自动筛选标志，允许重新应用
  hasAutoAppliedFilter.value = false
  
  // 直接设置筛选
  filterForm.bankId = bankIdNum
  hasAutoAppliedFilter.value = true
  
  console.log('filterForm.bankId 已设置为:', filterForm.bankId)
  console.log('当前题库数据:', props.questionBanks)
  console.log('是否存在题库ID:', props.questionBanks.some(b => b.id === bankIdNum))
  
  // 强制触发一次筛选条件变化事件
  await nextTick()
  handleFilterChange({ bankId: bankIdNum })
  
  // 如果有数据，立即应用筛选
  if (allQuestions.value && allQuestions.value.length > 0) {
    applySearchAndFilter()
  }
}

// 应用搜索和筛选过滤
const applySearchAndFilter = () => {
  console.log('开始应用搜索和筛选，allQuestions数量:', allQuestions.value?.length || 0)
  console.log('当前筛选条件:', {
    bankId: filterForm.bankId,
    keyword: searchQuery.keyword,
    difficulty: filterForm.difficulty,
    questionType: filterForm.questionType,
    isMastered: filterForm.isMastered,
    markedType: filterForm.markedType
  })
  
  if (!allQuestions.value || allQuestions.value.length === 0) {
    console.log('没有题目数据，清空questions')
    questions.value = []
    total.value = 0
    return
  }
  
  let filtered = [...allQuestions.value]
  console.log('初始题目数量:', filtered.length)
  
  // 关键词搜索
  if (searchQuery.keyword && searchQuery.keyword.trim()) {
    const keyword = searchQuery.keyword.toLowerCase().trim()
    console.log('关键词搜索:', keyword)
    filtered = filtered.filter(item => {
      const questionText = (item.questionDetail?.questionText || '').toLowerCase()
      const matches = questionText.includes(keyword)
      return matches
    })
    console.log('关键词搜索后数量:', filtered.length)
  }
  
  // 题库筛选
  if (filterForm.bankId) {
    console.log('题库筛选，bankId:', filterForm.bankId)
    filtered = filtered.filter(item => {
      const matches = item.bankId === filterForm.bankId
      console.log('题目bankId:', item.bankId, '匹配:', matches)
      return matches
    })
    console.log('题库筛选后数量:', filtered.length)
  }
  
  // 星标筛选（错题和斩题不支持星标）
  if (filterForm.isStarred !== null && props.questionType === 'favorite') {
    console.log('星标筛选:', filterForm.isStarred)
    filtered = filtered.filter(item => item.isStarred === filterForm.isStarred)
    console.log('星标筛选后数量:', filtered.length)
  }
  
  // 收藏状态筛选（仅收藏页面）
  if (filterForm.favoriteStatus && props.questionType === 'favorite') {
    console.log('收藏状态筛选:', filterForm.favoriteStatus)
    filtered = filtered.filter(item => item.favoriteStatus === filterForm.favoriteStatus)
    console.log('收藏状态筛选后数量:', filtered.length)
  }
  
  // 掌握状态筛选（错题和斩题）
  if (filterForm.isMastered !== null && (props.questionType === 'wrong' || props.questionType === 'marked')) {
    console.log('掌握状态筛选:', filterForm.isMastered)
    filtered = filtered.filter(item => item.isMastered === filterForm.isMastered)
    console.log('掌握状态筛选后数量:', filtered.length)
  }
  
  // 斩题类型筛选（仅斩题页面）
  if (filterForm.markedType && props.questionType === 'marked') {
    console.log('斩题类型筛选:', filterForm.markedType)
    filtered = filtered.filter(item => item.markedType === filterForm.markedType)
    console.log('斩题类型筛选后数量:', filtered.length)
  }
  
  // 难度筛选
  if (filterForm.difficulty.length > 0) {
    console.log('难度筛选:', filterForm.difficulty)
    filtered = filtered.filter(item => {
      const difficulty = item.questionDetail?.difficulty
      const matches = difficulty && filterForm.difficulty.includes(difficulty)
      return matches
    })
    console.log('难度筛选后数量:', filtered.length)
  }
  
  // 题型筛选
  if (filterForm.questionType.length > 0) {
    console.log('题型筛选:', filterForm.questionType)
    filtered = filtered.filter(item => {
      const questionType = item.questionDetail?.questionType
      const matches = questionType && filterForm.questionType.includes(questionType)
      return matches
    })
    console.log('题型筛选后数量:', filtered.length)
  }
  
  total.value = filtered.length
  console.log('筛选完成，总数量:', total.value)
  
  const startIndex = (searchQuery.pageNum - 1) * searchQuery.pageSize
  const endIndex = startIndex + searchQuery.pageSize
  questions.value = filtered.slice(startIndex, endIndex)
  
  console.log('分页结果: 第', searchQuery.pageNum, '页，每页', searchQuery.pageSize, '条')
  console.log('显示题目:', questions.value.length, '条')
}

// 查看题目详情
const handleViewDetail = async (item) => {
  console.log('📋 查看题目详情 - 题目类型:', props.questionType, '题目数据:', item)
  currentFavoriteQuestion.value = item
  currentQuestionIndex.value = 0
  dialogQuestions.value = [item]
  
  try {
    if (props.apiConfig.detailApi && item.questionId) {
      const response = await props.apiConfig.detailApi(item.questionId)
      if (response.code === 200) {
        let questionData = response.data
        
        if (questionData.transformed) {
          console.log('使用API返回的转换后数据:', questionData.transformed)
          
          currentQuestionDetail.value = {
            ...questionData.transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType || item.questionDetail?.questionType
          }
        } 
        else if (props.apiConfig.transformQuestion) {
          console.log('使用自定义转换函数转换数据')
          const transformed = props.apiConfig.transformQuestion(questionData)
          currentQuestionDetail.value = {
            ...transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType || item.questionDetail?.questionType
          }
        }
        else {
          console.log('使用原始数据:', questionData)
          currentQuestionDetail.value = {
            ...questionData,
            showAnalysis: true,
            id: item.questionId
          }
        }
        
        detailDialogVisible.value = true
        resetAnswerState()
      }
    } else {
      let questionData = item.questionDetail || {}
      
      console.log('使用现有数据，item.questionDetail:', item.questionDetail)
      
      if (questionData.transformed) {
        console.log('使用现有数据中的转换后数据:', questionData.transformed)
        currentQuestionDetail.value = {
          ...questionData.transformed,
          showAnalysis: true,
          id: item.questionId,
          questionType: questionData.questionType
        }
      } else {
        if (props.apiConfig.transformQuestion) {
          console.log('尝试转换现有数据')
          const transformed = props.apiConfig.transformQuestion(questionData)
          currentQuestionDetail.value = {
            ...transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType
          }
        } else {
          console.log('直接使用现有原始数据')
          currentQuestionDetail.value = {
            ...questionData,
            showAnalysis: true,
            id: item.questionId
          }
        }
      }
      
      detailDialogVisible.value = true
      resetAnswerState()
    }
  } catch (error) {
    console.error('加载题目详情失败:', error)
    proxy.$modal.msgError('加载题目详情失败')
  }
  
  emit('view-detail', item)
}

// 重置答题状态
const resetAnswerState = () => {
  selectedAnswer.value = ''
  subFillBlankAnswers.value = {}
  subEssayAnswers.value = {}
  answers.value = []
}

// 搜索处理
const handleSearch = (keyword) => {
  console.log('搜索处理，关键词:', keyword)
  if (!searchQuery) {
    console.error('searchQuery is undefined')
    return
  }
  searchQuery.keyword = keyword
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

// 清空搜索
const handleClearSearch = () => {
  console.log('清空搜索')
  if (!searchQuery) {
    console.error('searchQuery is undefined')
    return
  }
  searchQuery.keyword = ''
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

// 刷新方法
const handleRefresh = () => {
  console.log('刷新数据')
  searchQuery.keyword = ''
  searchQuery.pageNum = 1
  filterForm.bankId = null
  filterForm.isStarred = null
  filterForm.favoriteStatus = props.questionType === 'favorite' ? 1 : null
  filterForm.difficulty = []
  filterForm.questionType = []
  filterForm.isMastered = props.questionType === 'wrong' ? 0 : null
  filterForm.markedType = null
  
  // 重置自动筛选标志
  hasAutoAppliedFilter.value = false
  
  if (props.questionType === 'favorite' && props.apiConfig.listApi) {
    initFavoriteData()
  } else if (props.questionType === 'wrong' && props.apiConfig.listApi) {
    initWrongData()
  } else if (props.questionType === 'marked' && props.apiConfig.listApi) {
    initMarkedData()
  }
  
  emit('refresh')
}

// 筛选条件变化
const handleFilterChange = (newFilter) => {
  console.log('筛选条件变化:', newFilter)
  Object.assign(filterForm, newFilter)
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

// 重置筛选
const resetFilters = () => {
  console.log('重置筛选')
  filterForm.bankId = null
  filterForm.isStarred = null
  filterForm.favoriteStatus = props.questionType === 'favorite' ? 1 : null
  filterForm.difficulty = []
  filterForm.questionType = []
  filterForm.isMastered = props.questionType === 'wrong' ? 0 : null
  filterForm.markedType = null
  
  // 重置自动筛选标志
  hasAutoAppliedFilter.value = false
  
  searchQuery.keyword = ''
  searchQuery.pageNum = 1
  
  if (props.questionType === 'favorite' && props.apiConfig.listApi) {
    initFavoriteData()
  } else if (props.questionType === 'wrong' && props.apiConfig.listApi) {
    initWrongData()
  } else if (props.questionType === 'marked' && props.apiConfig.listApi) {
    initMarkedData()
  }
}

// 关闭详情弹框
const closeDetailDialog = () => {
  detailDialogVisible.value = false
  isFullscreen.value = false
  currentQuestionDetail.value = null
  currentFavoriteQuestion.value = null
  dialogQuestions.value = []
  resetAnswerState()
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 弹框内切换题目
const prevQuestionInDialog = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    loadQuestionForDialog(currentQuestionIndex.value)
  }
}

const nextQuestionInDialog = () => {
  if (currentQuestionIndex.value < dialogQuestions.value.length - 1) {
    currentQuestionIndex.value++
    loadQuestionForDialog(currentQuestionIndex.value)
  }
}

// 加载弹框内的题目
const loadQuestionForDialog = async (index) => {
  const item = dialogQuestions.value[index]
  if (item && props.apiConfig.detailApi) {
    try {
      const response = await props.apiConfig.detailApi(item.questionId)
      if (response.code === 200) {
        currentQuestionDetail.value = response.data.transformed || response.data
        resetAnswerState()
      }
    } catch (error) {
      console.error('加载题目失败:', error)
    }
  }
}

// 切换星标状态
const toggleStar = async (item) => {
  // 错题和斩题不支持标星
  if (props.questionType === 'wrong' || props.questionType === 'marked') {
    proxy.$modal.msgInfo(`${props.questionType === 'wrong' ? '错题' : '斩题'}暂不支持标星`)
    return
  }
  
  const userId = getCurrentUserId()
  
  if (!userId) {
    proxy.$modal.msgWarning('请先登录')
    return
  }
  
  if (props.apiConfig.updateApi) {
    try {
      const result = await props.apiConfig.updateApi({
        favoriteId: item.favoriteId,
        userId: userId,
        isStarred: item.isStarred ? 0 : 1
      })
      
      if (result.code === 200) {
        item.isStarred = !item.isStarred
        proxy.$modal.msgSuccess(item.isStarred ? '已标星' : '已取消标星')
        
        const index = allQuestions.value.findIndex(q => getItemKey(q) === getItemKey(item))
        if (index !== -1) {
          allQuestions.value[index].isStarred = item.isStarred
        }
      }
    } catch (error) {
      console.error('切换星标状态失败:', error)
      proxy.$modal.msgError('操作失败')
    }
  }
  
  emit('toggle-star', item)
}

// 取消收藏/移除错题/移除斩题
const handleUncollect = (item) => {
  const userId = getCurrentUserId()
  
  if (!userId) {
    proxy.$modal.msgWarning('请先登录')
    return
  }
  
  uncollectLoading.value[getItemKey(item)] = true
  
  const confirmMessage = props.questionType === 'wrong' 
    ? '确定要移除这道错题记录吗？移除后错误次数将被重置。' 
    : props.questionType === 'marked'
    ? '确定要移除这道斩题记录吗？'
    : '确定要取消收藏这道题目吗？'
  
  const confirmTitle = props.questionType === 'wrong' 
    ? '移除错题确认' 
    : props.questionType === 'marked'
    ? '移除斩题确认'
    : '取消收藏确认'
  
  proxy.$modal.confirm(
    confirmMessage,
    confirmTitle,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (props.apiConfig.deleteApi) {
      let id
      if (props.questionType === 'wrong') {
        id = item.errorId
      } else if (props.questionType === 'marked') {
        id = item.markedId
      } else {
        id = item.favoriteId || item.id
      }
      return props.apiConfig.deleteApi(id, { userId })
    }
  }).then(result => {
    if (result.code === 200) {
      const successMessage = props.questionType === 'wrong' 
        ? '已移除错题' 
        : props.questionType === 'marked'
        ? '已移除斩题'
        : '已取消收藏'
      proxy.$modal.msgSuccess(successMessage)
      
      const index = allQuestions.value.findIndex(q => getItemKey(q) === getItemKey(item))
      if (index !== -1) {
        allQuestions.value.splice(index, 1)
      }
      
      applySearchAndFilter()
      
      if (questions.value.length === 0 && searchQuery.pageNum > 1) {
        searchQuery.pageNum = Math.max(1, searchQuery.pageNum - 1)
        applySearchAndFilter()
      }
    } else {
      proxy.$modal.msgError(result.msg || '操作失败')
    }
  }).catch(error => {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      proxy.$modal.msgError('操作失败')
    }
  }).finally(() => {
    uncollectLoading.value[getItemKey(item)] = false
  })
  
  emit('uncollect', item)
}

// 处理空状态操作
const handleEmptyAction = () => {
  emit('empty-action')
}

// 分页处理
const handleSizeChange = (val) => {
  console.log('每页显示数量变化:', val)
  searchQuery.pageSize = val
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

const handleCurrentChange = (val) => {
  console.log('页码变化:', val)
  searchQuery.pageNum = val
  applySearchAndFilter()
}

// 答题相关方法
const selectOption = (index) => {
  selectedAnswer.value = index
}

const selectSubOption = (subIndex, optionIndex) => {
  if (!answers.value[currentQuestionIndex.value]) {
    answers.value[currentQuestionIndex.value] = {}
  }
  answers.value[currentQuestionIndex.value][subIndex] = optionIndex
}

const updateSubFillBlankAnswer = (subIndex, value) => {
  subFillBlankAnswers.value[subIndex] = value
}

const updateSubEssayAnswer = (subIndex, value) => {
  subEssayAnswers.value[subIndex] = value
}

// 其他功能
const markQuestion = () => {
  proxy.$modal.msgInfo('斩题功能开发中')
  emit('mark')
}

const addNote = () => {
  proxy.$modal.msgInfo('笔记功能开发中')
  emit('add-note')
}

const reportQuestion = () => {
  proxy.$modal.msgInfo('举报功能开发中')
  emit('report')
}

// 暴露方法
defineExpose({
  refresh: handleRefresh,
  resetFilters,
  getQuestions: () => questions.value
})
</script>

<style scoped lang="scss">
@import url('@/assets/styles/MyFavoriteQuestion.css');

.app-container {
  height: 100%;
}

.favorite-container {
  height: 100%;
  
  .content-wrapper {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    height: calc(100% - 80px);
    
    .content-main {
      flex: 1;
      min-height: 0;
    }
  }
}

.loading-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state {
  background: #fff;
  padding: 40px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.pagination-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
}
</style>