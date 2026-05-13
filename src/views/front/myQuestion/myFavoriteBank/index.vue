<template>
  <div class="bank-collect-page">
    <BankCardList ref="bankListRef" mode="favorite" :data-list="allFavoriteList" :loading="loading"
      :action-loading="uncollectLoading" title="我的收藏题库" empty-description="暂无收藏的题库" :empty-icon="Star"
      empty-action-text="去发现题库" @search="handleSearch" @refresh="fetchFavorites" @card-click="handleCardClick"
      @view-detail="handleViewDetail" @uncollect="handleUncollect" @toggle-star="handleToggleStar"
      @empty-action="goToQuestionBank" />
  </div>
</template>

<script setup name="FrontBankCollect">
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import BankCardList from '@/components/BankCardList/index.vue'
import { listFavoriteBank, delFavoriteBank, updateFavoriteBank } from '@/api/favoriteBank/favoriteBank'
import { getQuestionBank } from '@/api/questionBank/questionBank'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const allFavoriteList = ref([])
const uncollectLoading = ref({})
const bankCache = ref({})

onActivated(() => {
})

const fetchFavorites = () => {
  loading.value = true
  const userId = userStore.id || userStore.userId
  if (!userId) {
    proxy.$modal.msgWarning('请先登录')
    loading.value = false
    return
  }

  listFavoriteBank({ userId, favoriteStatus: 1, pageNum: 1, pageSize: 1000 })
    .then(res => {
      if (res.code === 200) {
        const favorites = res.rows || []
        const promises = favorites.map(item => {
          if (bankCache.value[item.bankId]) {
            item.bank = bankCache.value[item.bankId]
            return Promise.resolve(item)
          }
          return getQuestionBank(item.bankId).then(bankRes => {
            if (bankRes.code === 200) {
              item.bank = bankRes.data || {}
              bankCache.value[item.bankId] = item.bank
            } else {
              item.bank = { bankName: '未知题库' }
            }
            return item
          }).catch(() => {
            item.bank = { bankName: '未知题库' }
            return item
          })
        })
        Promise.all(promises).then(() => {
          allFavoriteList.value = favorites
          loading.value = false
        })
      } else {
        ElMessage.error(res.msg || '获取收藏失败')
        loading.value = false
      }
    })
    .catch(() => {
      ElMessage.error('获取收藏失败')
      loading.value = false
    })
}

const handleSearch = (keyword) => {
}

const handleCardClick = (item) => {
  proxy.$modal.confirm(
    `是否查看题库 "${item.bank?.bankName || '未知题库'}" 的详细信息？`,
    '提示',
    { confirmButtonText: '查看详情', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    handleViewDetail(item)
  }).catch(() => { })
}

const handleViewDetail = (item) => {
  router.push(`/front/questionPractice/${item.bankId}?from=myLearning`)
}

const handleUncollect = async (item) => {
  try {
    uncollectLoading.value[item.favoriteId] = true
    await proxy.$modal.confirm(
      `确定取消收藏"${item.bank?.bankName || '该题库'}"吗？`,
      '取消收藏',
      { type: 'warning' }
    )
    const res = await delFavoriteBank(item.favoriteId)
    if (res.code === 200) {
      ElMessage.success('已取消收藏')
      fetchFavorites()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (e) {
  } finally {
    uncollectLoading.value[item.favoriteId] = false
  }
}

const handleToggleStar = async (item) => {
  const newStatus = item.isStarred ? 0 : 1
  try {
    const res = await updateFavoriteBank({ favoriteId: item.favoriteId, isStarred: newStatus })
    if (res.code === 200) {
      item.isStarred = newStatus
      ElMessage.success(newStatus ? '已标星' : '已取消标星')
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (e) {
  }
}

const goToQuestionBank = () => {
  router.push('/front/questionPractice')
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.bank-collect-page {
  height: 100%;
}
</style>
