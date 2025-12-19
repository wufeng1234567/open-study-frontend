<!-- src/views/favorite/MyFavoriteBank.vue -->
<template>
  <div class="app-container">
    <!-- 练习界面 -->
    <PracticeComponent
      v-if="showPractice && currentBank"
      :bank-id="currentBank.bankId"
      :bank-name="currentBank.bank?.bankName || `题库ID: ${currentBank.bankId}`"
      :mode="practiceMode"
      @close="exitPractice"
    />
    
    <!-- 详情页面 -->
    <div v-else-if="viewingDetail && currentBank">
      <QuestionBankDetail
        :bank="{
          id: currentBank.bankId,
          bankName: currentBank.bank?.bankName || `题库ID: ${currentBank.bankId}`,
          chapterCount: 0,
          totalQuestions: currentBank.bank?.totalQuestions || 0,
          collectCount: 0,
          isCollected: true
        }"
        :show-practice="showPractice"
        :practice-mode="practiceMode"
        @back="goBackToList"
        @collect-success="handleCollectSuccess"
        @uncollect-success="handleUncollectSuccess"
        @start-practice="handleStartPractice"
        @exit-practice="exitPractice"
      />
    </div>
    
    <!-- 收藏列表页面 -->
    <div v-else>
      <!-- 搜索和标题区域 -->
      <div class="search-area">
        <div class="title-section">
          <h2 class="page-title">我的收藏题库</h2>
          <span class="total-count">共 {{ total }} 个收藏题库</span>
        </div>
        
        <div class="search-section">
          <el-input
            v-model="searchQuery.bankName"
            placeholder="搜索题库名称"
            clearable
            @keyup.enter="handleQuery"
            @clear="handleQueryClear"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-button 
            type="primary" 
            @click="handleQuery"
            class="search-btn"
          >
            搜索
          </el-button>
          
          <el-button 
            @click="handleRefresh"
            class="refresh-btn"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 收藏题库列表 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="favoriteBanks.length === 0" class="empty-state">
        <el-empty description="暂无收藏的题库">
          <template #image>
            <el-icon size="80"><Star /></el-icon>
          </template>
          <el-button type="primary" @click="goToQuestionBank">
            去发现题库
          </el-button>
        </el-empty>
      </div>

      <!-- 卡片列表 -->
      <div v-else class="favorite-list">
        <el-row :gutter="20">
          <el-col 
            v-for="item in favoriteBanks" 
            :key="item.favoriteId" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6" 
            :xl="4"
            class="bank-card-col"
          >
            <!-- 与QuestionPractice完全相同的卡片结构 -->
            <div class="bank-card">
              <!-- 可点击区域 -->
              <div class="clickable-area" @click="handleCardClick(item)">
                <!-- 题库封面 -->
                <div class="card-cover">
                  <el-image
                    :src="getImageUrl(item.bank?.coverImage)"
                    fit="cover"
                    class="cover-image"
                    @error="handleImageError"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                        <span>题库封面</span>
                      </div>
                    </template>
                  </el-image>
                  
                  <!-- 收藏状态 -->
                  <div class="favorite-status">
                    <el-tag 
                      type="warning" 
                      size="small" 
                      class="favorite-tag"
                    >
                      已收藏
                    </el-tag>
                  </div>
                  
                  <!-- 标星 -->
                  <div 
                    v-if="item.isStarred" 
                    class="star-icon"
                    @click.stop="toggleStar(item)"
                  >
                    <el-icon color="#f4c542"><StarFilled /></el-icon>
                  </div>
                </div>
                
                <!-- 题库信息 -->
                <div class="card-content">
                  <div class="bank-name">
                    <h3>{{ item.bank?.bankName || `题库ID: ${item.bankId}` }}</h3>
                    <el-tag 
                      v-if="item.bank?.subject" 
                      size="small" 
                      type="info"
                    >
                      {{ item.bank.subject }}
                    </el-tag>
                  </div>
                  
                  <!-- 题库统计 -->
                  <div class="bank-stats">
                    <div class="stat-item">
                      <el-icon><Document /></el-icon>
                      <span>{{ item.bank?.totalQuestions || 0 }} 题</span>
                    </div>
                    <div class="stat-item">
                      <el-icon><User /></el-icon>
                      <span>收藏于 {{ formatTime(item.createTime) }}</span>
                    </div>
                  </div>
                  
                  <!-- 描述 -->
                  <div v-if="item.notes" class="bank-description">
                    <div class="description-text">{{ item.notes }}</div>
                  </div>
                  
                  <!-- 学习信息 -->
                  <div class="study-info">
                    <el-icon><Clock /></el-icon>
                    <span>学习 {{ item.studyCount || 0 }} 次</span>
                    <span v-if="item.lastStudyTime" class="last-study">
                      最后: {{ formatTime(item.lastStudyTime) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="card-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  plain
                  @click.stop="handleViewDetail(item)"
                  class="action-btn"
                >
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
                
                <!-- 修改点1：简化取消收藏按钮 -->
                <el-button 
                  type="danger" 
                  size="small" 
                  plain
                  @click.stop="handleUncollectClick(item)"
                  :loading="uncollectLoading[item.favoriteId]"
                  class="action-btn"
                >
                  <el-icon><Delete /></el-icon>
                  取消收藏
                </el-button>
              </div>
            </div>
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
</template>

<script setup name="MyFavoriteBank">
import { ref, reactive, onMounted } from 'vue'
import { getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { parseTime } from '@/utils/ruoyi'
import { 
  Search, Refresh, Star, StarFilled, Picture, 
  Document, User, Clock, View, Delete
} from '@element-plus/icons-vue'

// API导入
import { 
  listFavoriteBank, 
  delFavoriteBank,
  updateFavoriteBank 
} from '@/api/favoriteBank/favoriteBank'
import { getQuestionBank } from '@/api/questionBank/questionBank'
import QuestionBankDetail from '@/components/QuestionBankDetail/QuestionBankDetail.vue'
import PracticeComponent from '@/components/PracticeComponent/PracticeComponent.vue'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(true)
const total = ref(0)
const allFavoriteBanks = ref([]) // 存储所有收藏记录
const favoriteBanks = ref([]) // 显示的数据
const currentBank = ref(null)
const viewingDetail = ref(false)
const practiceMode = ref(null)
const showPractice = ref(false)
const uncollectLoading = ref({})

// 搜索参数
const searchQuery = reactive({
  pageNum: 1,
  pageSize: 12,
  bankName: '',
  userId: null,
  favoriteStatus: 1
})

// 题库数据缓存
const bankCache = ref({})

// 获取当前用户ID
const getCurrentUserId = () => {
  return userStore.id || userStore.userId
}

// 图片URL处理
const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  const baseApi = import.meta.env.VITE_APP_BASE_API || ''
  return imagePath.startsWith('http') ? imagePath : `${baseApi}${imagePath}`
}

// 图片加载失败处理
const handleImageError = (e) => {
  console.log('图片加载失败:', e)
}

// 格式化时间
const formatTime = (time) => {
  return parseTime(time, '{y}-{m}-{d}')
}

// 获取所有收藏题库列表
const getAllFavorites = () => {
  loading.value = true
  const userId = getCurrentUserId()
  
  if (!userId) {
    proxy.$modal.msgWarning('请先登录')
    loading.value = false
    return
  }
  
  listFavoriteBank({
    userId: userId,
    favoriteStatus: 1,
    pageNum: 1,
    pageSize: 1000
  }).then(response => {
    if (response.code === 200) {
      allFavoriteBanks.value = response.rows || []
      total.value = allFavoriteBanks.value.length
      
      fetchBankDetails().then(() => {
        applySearchFilter()
        loading.value = false
      })
    } else {
      console.error('API返回错误码:', response.code, response.msg)
      proxy.$modal.msgError(response.msg || '获取收藏题库失败')
      loading.value = false
    }
  }).catch(error => {
    console.error('获取收藏题库失败:', error)
    proxy.$modal.msgError('获取收藏题库失败')
    loading.value = false
  })
}

// 获取题库详细信息
const fetchBankDetails = () => {
  if (allFavoriteBanks.value.length === 0) {
    return Promise.resolve()
  }
  
  const promises = allFavoriteBanks.value.map(item => {
    if (bankCache.value[item.bankId]) {
      item.bank = bankCache.value[item.bankId]
      return Promise.resolve(item)
    }
    
    return getQuestionBank(item.bankId).then(bankResponse => {
      if (bankResponse.code === 200) {
        const bankData = bankResponse.data || {}
        item.bank = bankData
        bankCache.value[item.bankId] = bankData
      } else {
        item.bank = { bankName: '未知题库' }
      }
      return item
    }).catch(error => {
      console.error(`获取题库 ${item.bankId} 详情失败:`, error)
      item.bank = { bankName: '未知题库' }
      return item
    })
  })
  
  return Promise.all(promises)
}

// 应用搜索过滤
const applySearchFilter = () => {
  if (!searchQuery.bankName || searchQuery.bankName.trim() === '') {
    const startIndex = (searchQuery.pageNum - 1) * searchQuery.pageSize
    const endIndex = startIndex + searchQuery.pageSize
    favoriteBanks.value = allFavoriteBanks.value.slice(startIndex, endIndex)
    total.value = allFavoriteBanks.value.length
  } else {
    const searchKeyword = searchQuery.bankName.toLowerCase().trim()
    
    const filteredBanks = allFavoriteBanks.value.filter(item => {
      const bankName = (item.bank?.bankName || '').toLowerCase()
      return bankName.includes(searchKeyword)
    })
    
    total.value = filteredBanks.length
    
    const startIndex = (searchQuery.pageNum - 1) * searchQuery.pageSize
    const endIndex = startIndex + searchQuery.pageSize
    favoriteBanks.value = filteredBanks.slice(startIndex, endIndex)
  }
}

// 搜索处理
const handleQuery = () => {
  searchQuery.pageNum = 1
  applySearchFilter()
}

// 清空搜索
const handleQueryClear = () => {
  searchQuery.bankName = ''
  handleQuery()
}

// 刷新 - 重新获取所有数据
const handleRefresh = () => {
  searchQuery.bankName = ''
  searchQuery.pageNum = 1
  getAllFavorites()
}

// 卡片点击
const handleCardClick = (item) => {
  currentBank.value = item
  proxy.$modal.confirm(
    `是否查看题库 "${item.bank?.bankName || '未知题库'}" 的详细信息？`,
    '提示',
    {
      confirmButtonText: '查看详情',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    handleViewDetail(item)
  }).catch(() => {
    // 取消操作
  })
}

// 查看详情
const handleViewDetail = (item) => {
  currentBank.value = item
  viewingDetail.value = true
  showPractice.value = false
}

// 返回列表
const goBackToList = () => {
  viewingDetail.value = false
  currentBank.value = null
  showPractice.value = false
}

// 修改点2：重写取消收藏方法，避免重复弹窗
const handleUncollectClick = async (item) => {
  try {
    // 先设置loading状态
    uncollectLoading.value[item.favoriteId] = true
    
    // 显示确认弹窗
    await proxy.$modal.confirm(
      `确定要取消收藏 "${item.bank?.bankName || '该题库'}" 吗？`,
      '取消收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API取消收藏
    const result = await delFavoriteBank(item.favoriteId)
    
    if (result.code === 200) {
      proxy.$modal.msgSuccess('已取消收藏')
      
      // 从所有收藏中移除
      const allIndex = allFavoriteBanks.value.findIndex(bank => bank.favoriteId === item.favoriteId)
      if (allIndex !== -1) {
        allFavoriteBanks.value.splice(allIndex, 1)
      }
      
      // 重新应用过滤
      applySearchFilter()
      
      // 如果当前页没有数据且不是第一页，返回上一页
      if (favoriteBanks.value.length === 0 && searchQuery.pageNum > 1) {
        searchQuery.pageNum = Math.max(1, searchQuery.pageNum - 1)
        applySearchFilter()
      }
    } else {
      proxy.$modal.msgError(result.msg || '取消收藏失败')
    }
  } catch (error) {
    // 用户取消操作或其他错误
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      proxy.$modal.msgError('取消收藏失败，请重试')
    }
  } finally {
    // 清除loading状态
    uncollectLoading.value[item.favoriteId] = false
  }
}

// 修改点3：移除原来的handleUncollect方法，用上面的handleUncollectClick替代

// 切换标星状态
const toggleStar = async (item) => {
  try {
    const newStarStatus = item.isStarred ? 0 : 1
    const result = await updateFavoriteBank({
      favoriteId: item.favoriteId,
      isStarred: newStarStatus
    })
    
    if (result.code === 200) {
      item.isStarred = newStarStatus
      proxy.$modal.msgSuccess(newStarStatus ? '已标星' : '已取消标星')
    } else {
      proxy.$modal.msgError(result.msg || '操作失败')
    }
  } catch (error) {
    console.error('切换标星状态失败:', error)
    proxy.$modal.msgError('操作失败')
  }
}

// 去题库练习页面
const goToQuestionBank = () => {
  router.push('/questionPractice')
}

// 分页大小改变
const handleSizeChange = (val) => {
  searchQuery.pageSize = val
  searchQuery.pageNum = 1
  applySearchFilter()
}

// 当前页改变
const handleCurrentChange = (val) => {
  searchQuery.pageNum = val
  applySearchFilter()
}

// 收藏成功事件
const handleCollectSuccess = (targetId, type) => {
  proxy.$modal.msgSuccess('收藏成功')
  getAllFavorites()
}

// 取消收藏成功事件
const handleUncollectSuccess = (targetId, type) => {
  proxy.$modal.msgSuccess('已取消收藏')
  getAllFavorites()
}

// 开始练习
const handleStartPractice = (type) => {
  practiceMode.value = type
  showPractice.value = true
}

// 退出练习
const exitPractice = () => {
  showPractice.value = false
  practiceMode.value = null
}

// 组件挂载
onMounted(() => {
  getAllFavorites()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 100px);
}

/* 搜索区域 */
.search-area {
  margin-bottom: 24px;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.total-count {
  font-size: 14px;
  color: #909399;
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.loading-container {
  padding: 40px 0;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.favorite-list {
  margin-top: 20px;
}

.bank-card-col {
  margin-bottom: 24px;
}

/* 与QuestionPractice完全相同的卡片样式 */
.bank-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.clickable-area {
  flex: 1;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-area:hover {
  background-color: #f8fafc;
}

.card-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  transition: transform 0.3s ease;
}

.card-cover:hover .cover-image {
  transform: scale(1.05);
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #909399;
}

.image-error .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.favorite-status {
  position: absolute;
  top: 12px;
  left: 12px;
}

.favorite-tag {
  font-weight: 600;
}

.star-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
}

.star-icon:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.card-content {
  padding: 16px;
}

.bank-name {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.bank-name h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bank-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item .el-icon {
  font-size: 14px;
  color: #909399;
}

.bank-description {
  margin-bottom: 12px;
}

.description-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.study-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.study-info .el-icon {
  font-size: 12px;
}

.last-study {
  font-size: 11px;
  color: #c0c4cc;
}

.card-actions {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.card-actions .el-button,
.card-actions .action-btn {
  flex: 1;
}

.pagination-section {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .app-container {
    padding: 12px;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: 100%;
  }
  
  .search-btn,
  .refresh-btn {
    width: 100%;
  }
  
  .card-cover {
    height: 140px;
  }
  
  .bank-name h3 {
    font-size: 15px;
  }
}
</style>