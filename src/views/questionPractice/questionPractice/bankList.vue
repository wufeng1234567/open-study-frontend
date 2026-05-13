<!-- src/views/questionPractice/bankList.vue -->
<template>
  <div class="app-container">
    <BankCardGrid :banks="questionBankList" :loading="loading" title="全部题库" :show-total-count="true" :show-search="true"
      :show-refresh="true" :show-pagination="true" :show-favorite-status="false" :show-star="false" :show-stats="true"
      :show-collect-count="true" :show-create-time="true" :show-notes="false" :show-study-info="false"
      :show-description="true" :show-favorite-button="true" :show-uncollect-action="false"
      :use-full-data-search="true" :enable-card-click-modal="true" @refresh="getList"
      @card-click="handleCardClick" @card-click-confirm="handleCardClickConfirm" @view-detail="viewBankDetail"
      @collect-success="handleCollectSuccess" @uncollect-success="handleUncollectSuccess"
      @empty-action="handleEmptyAction" @page-change="handlePageChange" @size-change="handleSizeChange">
      <template #empty>
        <el-empty description="暂无题库数据">
          <template #image>
            <el-icon size="80">
              <Collection />
            </el-icon>
          </template>
          <el-button type="primary" @click="handleRefresh">
            刷新列表
          </el-button>
        </el-empty>
      </template>
    </BankCardGrid>
  </div>
</template>

<script setup name="FrontQuestionBankList">
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'
import useUserStore from '@/store/modules/user'
import { listQuestionBankAll } from '@/api/questionBank/questionBank'
import { listFavoriteBankAll } from '@/api/favoriteBank/favoriteBank'
import BankCardGrid from '@/components/BankCardGrid/BankCardGrid.vue'
import { Collection } from '@element-plus/icons-vue'

const router = useRouter()
const { proxy } = getCurrentInstance()
const userStore = useUserStore()

const loading = ref(false)
const questionBankList = ref([])
const allFavoriteData = ref([])

const getList = () => {
  loading.value = true
  Promise.all([
    listQuestionBankAll(),
    listFavoriteBankAll({ favoriteStatus: 1 })
  ]).then(([bankRes, favRes]) => {
    if (bankRes.code === 200) {
      const banks = bankRes.data || []
      allFavoriteData.value = favRes.data || []

      const countMap = {}
      allFavoriteData.value.forEach(favorite => {
        const bankId = favorite.bankId
        countMap[bankId] = (countMap[bankId] || 0) + 1
      })

      const userId = userStore.id || userStore.userId
      let userFavoriteBankIds = new Set()

      if (userId) {
        const userFavorites = allFavoriteData.value.filter(item => item.userId === userId)
        userFavoriteBankIds = new Set(userFavorites.map(item => item.bankId))
      }

      questionBankList.value = banks.map(bank => ({
        ...bank,
        collectCount: countMap[bank.id] || 0,
        isCollected: userId ? userFavoriteBankIds.has(bank.id) : false,
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

const handleCardClick = (bank) => {
}

const handleCardClickConfirm = (bank) => {
  viewBankDetail(bank)
}

const viewBankDetail = (bank) => {
  router.push(`/front/questionPractice/${bank.id}?from=questionPractice`)
}

const handleCollectSuccess = (targetId, type) => {
  const userId = userStore.id || userStore.userId
  if (userId) {
    allFavoriteData.value.push({
      userId: userId,
      bankId: targetId,
      favoriteStatus: 1
    })
  }
  const listItem = questionBankList.value.find(item => item.id === targetId)
  if (listItem) {
    listItem.isCollected = true
    listItem.collectCount = (listItem.collectCount || 0) + 1
  }
}

const handleUncollectSuccess = (targetId, type) => {
  const userId = userStore.id || userStore.userId
  if (userId) {
    allFavoriteData.value = allFavoriteData.value.filter(item =>
      !(item.userId === userId && item.bankId === targetId)
    )
  }
  const listItem = questionBankList.value.find(item => item.id === targetId)
  if (listItem) {
    listItem.isCollected = false
    listItem.collectCount = Math.max(0, (listItem.collectCount || 0) - 1)
  }
}

const handleEmptyAction = () => {
  proxy.$modal.msgInfo('暂无题库，请等待管理员添加')
}

const handleRefresh = () => {
  getList()
}

const handlePageChange = (page) => {
  console.log('页面改变到:', page)
}

const handleSizeChange = (size) => {
  console.log('每页大小改变到:', size)
}

onMounted(() => {
  getList()
})

onActivated(() => {
  getList()
})
</script>

<style scoped lang="scss">
.app-container {
  padding: 24px;
  min-height: calc(100vh - 100px);
}
</style>
