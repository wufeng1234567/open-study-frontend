<template>
  <div class="my-bank-page">
    <BankCardList ref="bankListRef" mode="my" :data-list="allBankList" :loading="loading"
      :action-loading="deleteLoading" title="我的题库" empty-description="还没有创建任何题库" :empty-icon="FolderOpened"
      empty-action-text="去创建题库" @search="handleSearch" @refresh="fetchBanks" @card-click="handleCardClick"
      @view-detail="handleViewDetail" @delete="handleDelete" @empty-action="goCreateBank" />
  </div>
</template>

<script setup name="FrontMyBank">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened } from '@element-plus/icons-vue'
import BankCardList from '@/components/BankCardList/index.vue'
import { listMyQuestionBank, delQuestionBank } from '@/api/questionBank/questionBank'

const router = useRouter()

const loading = ref(false)
const allBankList = ref([])
const deleteLoading = ref({})
const bankListRef = ref(null)

const fetchBanks = () => {
  loading.value = true
  listMyQuestionBank().then(res => {
    if (res.code === 200) {
      allBankList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取题库失败')
    }
    loading.value = false
  }).catch(() => {
    ElMessage.error('获取题库失败')
    loading.value = false
  })
}

const handleSearch = (keyword) => {
}

const handleCardClick = (item) => {
  ElMessageBox.confirm(
    `是否查看题库 "${item.bankName}" 的详细信息？`,
    '提示',
    { confirmButtonText: '查看详情', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    handleViewDetail(item)
  }).catch(() => { })
}

const handleViewDetail = (item) => {
  router.push(`/front/questionPractice/${item.id}?from=myLearning`)
}

const handleDelete = (item) => {
  ElMessageBox.confirm(`确定删除题库"${item.bankName}"吗？删除后无法恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteLoading.value[item.id] = true
    return delQuestionBank(item.id)
  }).then(() => {
    ElMessage.success('删除成功')
    fetchBanks()
  }).catch(() => { }).finally(() => {
    deleteLoading.value[item.id] = false
  })
}

const goCreateBank = () => {
  router.push('/front/studio')
}

onMounted(() => {
  fetchBanks()
})
</script>

<style scoped></style>
