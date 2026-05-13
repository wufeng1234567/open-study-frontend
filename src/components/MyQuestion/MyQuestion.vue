﻿﻿﻿<!-- src/components/MyQuestion/MyQuestion.vue -->
<template>
  <div class="app-container">
    <!-- 题目详情弹框 -->
    <QuestionDetailDialog v-model:visible="detailDialogVisible" :current-favorite-question="currentFavoriteQuestion"
      :current-question-detail="currentQuestionDetail" :current-question-index="currentQuestionIndex"
      :dialog-questions="dialogQuestions" :is-fullscreen="isFullscreen" :selected-answer="selectedAnswer"
      :sub-fill-blank-answers="subFillBlankAnswers" :sub-essay-answers="subEssayAnswers" :answers="answers"
      :question-type="questionType" @close="closeDetailDialog" @toggle-fullscreen="toggleFullscreen"
      @prev-question="prevQuestionInDialog" @next-question="nextQuestionInDialog" @select-option="selectOption"
      @update-answer="value => selectedAnswer = value" @select-sub-option="selectSubOption"
      @update-sub-fill-blank-answer="updateSubFillBlankAnswer" @update-sub-essay-answer="updateSubEssayAnswer"
      @mark="markQuestion" @add-note="addNote" @report="reportQuestion" />

    <!-- 主页面 -->
    <div class="favorite-container">
      <!-- 搜索和标题区域 -->
      <QuestionHeader :title="headerTitle" :total="total" :search-keyword="searchQuery?.keyword || ''"
        :question-type="questionType" @search="handleSearch" @clear-search="handleClearSearch"
        @refresh="handleRefresh" />

      <div class="content-wrapper">
        <!-- 左侧筛选栏 -->
        <QuestionFilterSidebar ref="filterSidebarRef" :filter-form="filterForm" :question-banks="questionBanks"
          :question-types="questionTypes" :difficulty-options="difficultyOptions" :show-star-filter="showStarFilter"
          :show-favorite-status-filter="showFavoriteStatusFilter" :question-type="questionType"
          @filter-change="handleFilterChange" @reset-filters="resetFilters" />

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
                <el-icon size="80">
                  <Star />
                </el-icon>
              </template>
              <el-button type="primary" @click="handleEmptyAction">
                {{ emptyActionText }}
              </el-button>
            </el-empty>
          </div>

          <!-- 题目卡片列表 -->
          <div v-else class="question-list">
            <el-row :gutter="20">
              <el-col v-for="item in questions" :key="getItemKey(item)" :xs="24" :sm="12" :md="12" :lg="8"
                class="question-card-col">
                <QuestionCard :item="item" :question-type="questionType" :show-star="showStar"
                  :show-favorite-status="showFavoriteStatus" :show-collect-actions="showCollectActions"
                  :show-study-stats="showStudyStats" :uncollect-loading="uncollectLoading[getItemKey(item)]"
                  @view-detail="handleViewDetail" @toggle-star="toggleStar" @uncollect="handleUncollect" />
              </el-col>
            </el-row>

            <!-- 分页 -->
            <div class="pagination-section">
              <el-pagination v-model:current-page="searchQuery.pageNum" v-model:page-size="searchQuery.pageSize"
                :page-sizes="[12, 24, 48, 96]" layout="total, sizes, prev, pager, next, jumper" :total="total"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
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

import QuestionDetailDialog from './QuestionDetailDialog.vue'
import QuestionHeader from './QuestionHeader.vue'
import QuestionFilterSidebar from './QuestionFilterSidebar.vue'
import QuestionCard from './QuestionCard.vue'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const props = defineProps({
  questionType: {
    type: String,
    default: 'favorite',
    validator: (value) => ['favorite', 'wrong', 'marked'].includes(value)
  },
  headerTitle: {
    type: String,
    default: ''
  },
  showStarFilter: {
    type: Boolean,
    default: true
  },
  showFavoriteStatusFilter: {
    type: Boolean,
    default: true
  },
  showStar: {
    type: Boolean,
    default: true
  },
  showFavoriteStatus: {
    type: Boolean,
    default: true
  },
  showCollectActions: {
    type: Boolean,
    default: true
  },
  showStudyStats: {
    type: Boolean,
    default: true
  },
  emptyActionText: {
    type: String,
    default: '去发现题目'
  },
  apiConfig: {
    type: Object,
    default: () => ({})
  },
  questionBanks: {
    type: Array,
    default: () => []
  },
  userStore: {
    type: Object,
    default: null
  }
})

const questionTypes = [
  { value: 1, label: '单选题' },
  { value: 2, label: '多选题' },
  { value: 3, label: '判断题' },
  { value: 4, label: '填空题' },
  { value: 5, label: '简答题' },
  { value: 6, label: '组合题' }
]

const difficultyOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '中等' },
  { value: 3, label: '困难' },
  { value: 4, label: '极难' }
]

const loading = ref(true)
const total = ref(0)
const allQuestions = ref([])
const questions = ref([])
const detailDialogVisible = ref(false)
const isFullscreen = ref(false)
const uncollectLoading = ref({})
const filterSidebarRef = ref(null)

const currentFavoriteQuestion = ref(null)
const currentQuestionDetail = ref(null)
const currentQuestionIndex = ref(0)
const dialogQuestions = ref([])

const selectedAnswer = ref('')
const subFillBlankAnswers = ref({})
const subEssayAnswers = ref({})
const answers = ref([])

const searchQuery = reactive({
  pageNum: 1,
  pageSize: 12,
  keyword: '',
  userId: null
})

const filterForm = reactive({
  bankId: null,
  isStarred: null,
  favoriteStatus: props.questionType === 'favorite' ? 1 : null,
  difficulty: [],
  questionType: [],
  isMastered: props.questionType === 'wrong' ? 0 : null,
  markedType: null
})

const hasAutoAppliedFilter = ref(false)

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

const emptyText = computed(() => {
  const textMap = {
    favorite: '暂无收藏的题目',
    wrong: '暂无错题记录',
    marked: '暂无斩题记录'
  }
  return textMap[props.questionType] || '暂无数据'
})

const getCurrentUserId = () => {
  if (!props.userStore) {
    return null
  }
  const userId = props.userStore.id || props.userStore.userId || props.userStore.user?.userId
  if (!userId) {
    return null
  }
  return userId
}

const getItemKey = (item) => {
  if (props.questionType === 'wrong') {
    return item.errorId || item.id
  }
  return item.favoriteId || item.wrongId || item.markedId || item.id
}

onMounted(() => {
  if (!props.questionBanks || props.questionBanks.length === 0) {
  }
  initData()

  watch(
    () => route.query.bankId,
    (newBankId) => {
      hasAutoAppliedFilter.value = false
      if (newBankId) {
        setTimeout(() => {
          applyBankIdFilter(newBankId)
        }, 100)
      } else {
        filterForm.bankId = null
        hasAutoAppliedFilter.value = false
        handleFilterChange({ bankId: null })
      }
    },
    { immediate: true }
  )
})

const initData = () => {
  loading.value = true
  if (props.questionType === 'favorite' && props.apiConfig.listApi) {
    initFavoriteData()
  } else if (props.questionType === 'wrong' && props.apiConfig.listApi) {
    initWrongData()
  } else if (props.questionType === 'marked' && props.apiConfig.listApi) {
    initMarkedData()
  } else {
    loading.value = false
  }
}

const initMarkedData = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      markedStatus: 1
    })
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        applySearchAndFilter()
      }
    } else {
      proxy.$modal.msgError(response.msg || '获取斩题数据失败')
    }
  } catch (error) {
    proxy.$modal.msgError('加载斩题数据失败')
  } finally {
    loading.value = false
  }
}

const initFavoriteData = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      favoriteStatus: 1
    })
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        applySearchAndFilter()
      }
    } else {
      proxy.$modal.msgError(response.msg || '获取数据失败')
    }
  } catch (error) {
    proxy.$modal.msgError('加载数据失败')
  } finally {
    loading.value = false
  }
}

const initWrongData = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      proxy.$modal.msgWarning('请先登录')
      loading.value = false
      return
    }
    const response = await props.apiConfig.listApi({
      pageNum: 1,
      pageSize: 1000,
      userId: userId,
      status: 1,
      isMastered: filterForm.isMastered
    })
    if (response.code === 200) {
      allQuestions.value = response.rows || []
      total.value = allQuestions.value.length
      if (allQuestions.value.length > 0) {
        questions.value = [...allQuestions.value]
        applySearchAndFilter()
      }
    } else {
      proxy.$modal.msgError(response.msg || '获取错题数据失败')
    }
  } catch (error) {
    proxy.$modal.msgError('加载错题数据失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.questionBanks, (newBanks) => {
  if (route.query.bankId && newBanks.length > 0) {
    hasAutoAppliedFilter.value = false
    setTimeout(() => {
      applyBankIdFilter(route.query.bankId)
    }, 100)
  }
}, { immediate: true })

const applyBankIdFilter = async (bankId) => {
  if (!bankId) {
    return
  }
  const bankIdNum = Number(bankId)
  if (filterForm.bankId === bankIdNum) {
    return
  }
  hasAutoAppliedFilter.value = false
  filterForm.bankId = bankIdNum
  hasAutoAppliedFilter.value = true
  await nextTick()
  handleFilterChange({ bankId: bankIdNum })
  if (allQuestions.value && allQuestions.value.length > 0) {
    applySearchAndFilter()
  }
}

const applySearchAndFilter = () => {
  if (!allQuestions.value || allQuestions.value.length === 0) {
    questions.value = []
    total.value = 0
    return
  }
  let filtered = [...allQuestions.value]
  if (searchQuery.keyword && searchQuery.keyword.trim()) {
    const keyword = searchQuery.keyword.toLowerCase().trim()
    filtered = filtered.filter(item => {
      const questionText = (item.questionDetail?.questionText || '').toLowerCase()
      const matches = questionText.includes(keyword)
      return matches
    })
  }
  if (filterForm.bankId) {
    filtered = filtered.filter(item => item.bankId === filterForm.bankId)
  }
  if (filterForm.isStarred !== null && props.questionType === 'favorite') {
    filtered = filtered.filter(item => item.isStarred === filterForm.isStarred)
  }
  if (filterForm.favoriteStatus && props.questionType === 'favorite') {
    filtered = filtered.filter(item => item.favoriteStatus === filterForm.favoriteStatus)
  }
  if (filterForm.isMastered !== null && (props.questionType === 'wrong' || props.questionType === 'marked')) {
    filtered = filtered.filter(item => item.isMastered === filterForm.isMastered)
  }
  if (filterForm.markedType && props.questionType === 'marked') {
    filtered = filtered.filter(item => item.markedType === filterForm.markedType)
  }
  if (filterForm.difficulty.length > 0) {
    filtered = filtered.filter(item => {
      const difficulty = item.questionDetail?.difficulty
      const matches = difficulty && filterForm.difficulty.includes(difficulty)
      return matches
    })
  }
  if (filterForm.questionType.length > 0) {
    filtered = filtered.filter(item => {
      const questionType = item.questionDetail?.questionType
      const matches = questionType && filterForm.questionType.includes(questionType)
      return matches
    })
  }
  total.value = filtered.length
  const startIndex = (searchQuery.pageNum - 1) * searchQuery.pageSize
  const endIndex = startIndex + searchQuery.pageSize
  questions.value = filtered.slice(startIndex, endIndex)
}

const handleViewDetail = async (item) => {
  currentFavoriteQuestion.value = item
  currentQuestionIndex.value = 0
  dialogQuestions.value = [item]
  try {
    if (props.apiConfig.detailApi && item.questionId) {
      const response = await props.apiConfig.detailApi(item.questionId)
      if (response.code === 200) {
        let questionData = response.data
        if (questionData.transformed) {
          currentQuestionDetail.value = {
            ...questionData.transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType || item.questionDetail?.questionType,
            bankName: item.bankDetail?.bankName,
            difficulty: item.questionDetail?.difficulty
          }
        } else if (props.apiConfig.transformQuestion) {
          const transformed = props.apiConfig.transformQuestion(questionData)
          currentQuestionDetail.value = {
            ...transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType || item.questionDetail?.questionType,
            bankName: item.bankDetail?.bankName,
            difficulty: item.questionDetail?.difficulty
          }
        } else {
          currentQuestionDetail.value = {
            ...questionData,
            showAnalysis: true,
            id: item.questionId,
            bankName: item.bankDetail?.bankName,
            difficulty: item.questionDetail?.difficulty
          }
        }
        detailDialogVisible.value = true
        resetAnswerState()
      }
    } else {
      let questionData = item.questionDetail || {}
      if (questionData.transformed) {
        currentQuestionDetail.value = {
          ...questionData.transformed,
          showAnalysis: true,
          id: item.questionId,
          questionType: questionData.questionType,
          bankName: item.bankDetail?.bankName,
          difficulty: item.questionDetail?.difficulty
        }
      } else {
        if (props.apiConfig.transformQuestion) {
          const transformed = props.apiConfig.transformQuestion(questionData)
          currentQuestionDetail.value = {
            ...transformed,
            showAnalysis: true,
            id: item.questionId,
            questionType: questionData.questionType,
            bankName: item.bankDetail?.bankName,
            difficulty: item.questionDetail?.difficulty
          }
        } else {
          currentQuestionDetail.value = {
            ...questionData,
            showAnalysis: true,
            id: item.questionId,
            bankName: item.bankDetail?.bankName,
            difficulty: item.questionDetail?.difficulty
          }
        }
      }
      detailDialogVisible.value = true
      resetAnswerState()
    }
  } catch (error) {
    proxy.$modal.msgError('加载题目详情失败')
  }
  emit('view-detail', item)
}

const resetAnswerState = () => {
  selectedAnswer.value = ''
  subFillBlankAnswers.value = {}
  subEssayAnswers.value = {}
  answers.value = []
}

const handleSearch = (keyword) => {
  if (!searchQuery) {
    return
  }
  searchQuery.keyword = keyword
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

const handleClearSearch = () => {
  if (!searchQuery) {
    return
  }
  searchQuery.keyword = ''
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

const handleRefresh = () => {
  searchQuery.keyword = ''
  searchQuery.pageNum = 1
  filterForm.bankId = null
  filterForm.isStarred = null
  filterForm.favoriteStatus = props.questionType === 'favorite' ? 1 : null
  filterForm.difficulty = []
  filterForm.questionType = []
  filterForm.isMastered = props.questionType === 'wrong' ? 0 : null
  filterForm.markedType = null
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

const handleFilterChange = (newFilter) => {
  Object.assign(filterForm, newFilter)
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

const resetFilters = () => {
  filterForm.bankId = null
  filterForm.isStarred = null
  filterForm.favoriteStatus = props.questionType === 'favorite' ? 1 : null
  filterForm.difficulty = []
  filterForm.questionType = []
  filterForm.isMastered = props.questionType === 'wrong' ? 0 : null
  filterForm.markedType = null
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

const closeDetailDialog = () => {
  detailDialogVisible.value = false
  isFullscreen.value = false
  currentQuestionDetail.value = null
  currentFavoriteQuestion.value = null
  dialogQuestions.value = []
  resetAnswerState()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

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

const loadQuestionForDialog = async (index) => {
  const item = dialogQuestions.value[index]
  if (item && props.apiConfig.detailApi) {
    try {
      const response = await props.apiConfig.detailApi(item.questionId)
      if (response.code === 200) {
        const data = response.data.transformed || response.data
        currentQuestionDetail.value = {
          ...data,
          bankName: item.bankDetail?.bankName,
          difficulty: item.questionDetail?.difficulty
        }
        resetAnswerState()
      }
    } catch (error) {
    }
  }
}

const toggleStar = async (item) => {
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
      proxy.$modal.msgError('操作失败')
    }
  }
  emit('toggle-star', item)
}

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
      proxy.$modal.msgError('操作失败')
    }
  }).finally(() => {
    uncollectLoading.value[getItemKey(item)] = false
  })
  emit('uncollect', item)
}

const handleEmptyAction = () => {
  emit('empty-action')
}

const handleSizeChange = (val) => {
  searchQuery.pageSize = val
  searchQuery.pageNum = 1
  applySearchAndFilter()
}

const handleCurrentChange = (val) => {
  searchQuery.pageNum = val
  applySearchAndFilter()
}

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

defineExpose({
  refresh: handleRefresh,
  resetFilters,
  getQuestions: () => questions.value
})
</script>

<style scoped lang="scss">
.app-container {
  height: 100%;
}

.question-card-col {
  margin-bottom: 20px;
}

.favorite-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 20px;

  .content-wrapper {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    flex: 1;
    min-height: 0;
    position: relative;

    .content-main {
      padding: 10px 0;
      flex: 1;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
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