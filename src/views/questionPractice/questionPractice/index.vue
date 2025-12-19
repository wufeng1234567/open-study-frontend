<!-- src/views/questionPractice/index.vue -->
<template>
  <div class="app-container">
    <!-- 练习界面 -->
    <PracticeComponent
      v-if="showPractice && selectedBank"
      :bank-id="selectedBank.id"
      :bank-name="selectedBank.bankName"
      :mode="practiceMode"
      @close="exitPractice"
    />
    
    <!-- 详情页 -->
    <QuestionBankDetail
      v-else-if="selectedBank"
      :bank="selectedBank"
      :show-practice="showPractice"
      :practice-mode="practiceMode"
      @back="goBack"
      @collect-success="handleCollectSuccess"
      @uncollect-success="handleUncollectSuccess"
      @start-practice="handleStartPractice"
      @exit-practice="exitPractice"
    />
    
    <!-- 题库列表（使用 BankCardGrid） -->
    <BankCardGrid
      v-else
      :banks="questionBankList"
      :loading="loading"
      title="全部题库"
      :show-total-count="true"
      :show-search="true"
      :show-refresh="true"
      :show-pagination="true"
      :show-favorite-status="false"
      :show-star="false"
      :show-stats="true"
      :show-collect-count="true"
      :show-create-time="true"
      :show-notes="false"
      :show-study-info="false"
      :show-description="true"
      :show-favorite-button="true"
      :show-uncollect-action="false"
      :search-keyword="searchKeyword"
      :use-full-data-search="true"
      :enable-card-click-modal="true"
      @search="handleSearch"
      @refresh="getList"
      @card-click="handleCardClick"
      @card-click-confirm="handleCardClickConfirm"
      @view-detail="viewBankDetail"
      @collect-success="handleCollectSuccess"
      @uncollect-success="handleUncollectSuccess"
      @empty-action="handleEmptyAction"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 自定义空状态 -->
      <template #empty>
        <el-empty description="暂无题库数据">
          <template #image>
            <el-icon size="80"><Collection /></el-icon>
          </template>
          <el-button type="primary" @click="handleRefresh">
            刷新列表
          </el-button>
        </el-empty>
      </template>
    </BankCardGrid>
  </div>
</template>

<script setup name="QuestionPractice">
import { ref, onMounted } from 'vue'
import { getCurrentInstance } from 'vue'
import useUserStore from '@/store/modules/user'
import { listQuestionBankAll } from '@/api/questionBank/questionBank'
import { listFavoriteBankAll } from '@/api/favoriteBank/favoriteBank'
import QuestionBankDetail from '@/components/QuestionBankDetail/QuestionBankDetail.vue'
import PracticeComponent from '@/components/PracticeComponent/PracticeComponent.vue'
import BankCardGrid from '@/components/BankCardGrid/BankCardGrid.vue'
import { Collection } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const questionBankList = ref([])
const selectedBank = ref(null)
const practiceMode = ref(null)
const showPractice = ref(false)
const searchKeyword = ref('')
const allFavoriteData = ref([])

// 获取题库列表
const getList = () => {
  loading.value = true
  Promise.all([
    listQuestionBankAll(),
    listFavoriteBankAll({ favoriteStatus: 1 })
  ]).then(([bankRes, favRes]) => {
    if (bankRes.code === 200) {
      const banks = bankRes.data || []
      allFavoriteData.value = favRes.data || []

      // 统计每个题库的收藏人数
      const countMap = {}
      allFavoriteData.value.forEach(favorite => {
        const bankId = favorite.bankId
        countMap[bankId] = (countMap[bankId] || 0) + 1
      })

      // 获取当前用户的收藏ID集合
      const userId = userStore.id || userStore.userId
      let userFavoriteBankIds = new Set()
      
      if (userId) {
        const userFavorites = allFavoriteData.value.filter(item => item.userId === userId)
        userFavoriteBankIds = new Set(userFavorites.map(item => item.bankId))
      }

      // 处理题库数据，添加收藏人数和当前用户收藏状态
      questionBankList.value = banks.map(bank => ({
        ...bank,
        collectCount: countMap[bank.id] || 0,
        isCollected: userId ? userFavoriteBankIds.has(bank.id) : false,
        // 确保 BankCardGrid 需要的字段都存在
        bankName: bank.bankName || `题库ID: ${bank.id}`,
        totalQuestions: bank.totalQuestions || 0,
        chapterCount: bank.chapterCount || 0,
        subject: bank.subject || '',
        coverImage: bank.coverImage || '',
        description: bank.description || '',
        createTime: bank.createTime || ''
      }))
    }
    loading.value = false
  }).catch(err => {
    console.error('获取题库失败:', err)
    proxy.$modal.msgError('获取题库失败')
    loading.value = false
  })
}

// 卡片点击处理（不弹窗，只记录点击）
const handleCardClick = (bank) => {
  // 这里只记录点击，弹窗由 BankCardGrid 处理
  // 如果需要额外的处理，可以在这里添加
}

// 卡片点击确认后的处理
const handleCardClickConfirm = (bank) => {
  // 用户确认后，直接查看详情（不再次弹窗）
  viewBankDetail(bank)
}

// 查看题库详情（直接进入，不再弹窗）
const viewBankDetail = (bank) => {
  selectedBank.value = { ...bank }
  // 注意：这里不再调用 proxy.$modal.confirm，避免重复弹窗
}

// 返回题库列表
const goBack = () => {
  selectedBank.value = null
}

// 退出练习
const exitPractice = () => {
  showPractice.value = false
  practiceMode.value = null
}

// 开始练习
const handleStartPractice = (mode) => {
  practiceMode.value = mode
  showPractice.value = true
}

// 搜索处理
const handleSearch = (keyword) => {
  searchKeyword.value = keyword
}

// 处理收藏成功事件
const handleCollectSuccess = (targetId, type) => {
  // 获取当前用户ID
  const userId = userStore.id || userStore.userId
  
  // 添加到收藏数据中
  if (userId) {
    allFavoriteData.value.push({
      userId: userId,
      bankId: targetId,
      favoriteStatus: 1
    })
  }
  
  // 更新列表中的收藏状态
  const listItem = questionBankList.value.find(item => item.id === targetId)
  if (listItem) {
    listItem.isCollected = true
    listItem.collectCount = (listItem.collectCount || 0) + 1
  }
  
  // 更新详情页的收藏状态
  if (selectedBank.value && selectedBank.value.id === targetId) {
    selectedBank.value.isCollected = true
    selectedBank.value.collectCount = (selectedBank.value.collectCount || 0) + 1
  }
}

// 处理取消收藏成功事件
const handleUncollectSuccess = (targetId, type) => {
  // 获取当前用户ID
  const userId = userStore.id || userStore.userId
  
  // 从收藏数据中移除
  if (userId) {
    allFavoriteData.value = allFavoriteData.value.filter(item => 
      !(item.userId === userId && item.bankId === targetId)
    )
  }
  
  // 更新列表中的收藏状态
  const listItem = questionBankList.value.find(item => item.id === targetId)
  if (listItem) {
    listItem.isCollected = false
    // 减少收藏人数（确保不为负数）
    listItem.collectCount = Math.max(0, (listItem.collectCount || 0) - 1)
  }
  
  // 更新详情页的收藏状态
  if (selectedBank.value && selectedBank.value.id === targetId) {
    selectedBank.value.isCollected = false
    selectedBank.value.collectCount = Math.max(0, (selectedBank.value.collectCount || 0) - 1)
  }
}

// 空状态操作
const handleEmptyAction = () => {
  proxy.$modal.msgInfo('暂无题库，请等待管理员添加')
}

// 刷新列表
const handleRefresh = () => {
  getList()
}

// 分页处理
const handlePageChange = (page) => {
  console.log('页面改变到:', page)
}

const handleSizeChange = (size) => {
  console.log('每页大小改变到:', size)
}

// 组件挂载
onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 100px);
}

/* 可以添加一些自定义样式 */
::v-deep(.bank-card-grid .header-section) {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

::v-deep(.bank-card-grid .bank-card) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

::v-deep(.bank-card-grid .bank-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #409EFF;
}
</style>