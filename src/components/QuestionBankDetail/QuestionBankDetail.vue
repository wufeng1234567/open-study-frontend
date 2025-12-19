<!-- src/components/QuestionBankDetail.vue -->
<template>
  <div class="bank-detail-container">
    <!-- 题库详情页面内容 -->
    <div v-if="!showPractice">
      <!-- 头部信息 -->
      <div class="bank-header">
        <div class="bank-title">
          <div class="bank-tag">
            <el-icon><Collection /></el-icon>
            <span>题库</span>
          </div>
          <div class="bank-info">
            <h2 class="bank-name">{{ bank.bankName }}</h2>
            <div class="bank-stats">
              <span class="stat-item">
                <el-icon><Folder /></el-icon>
                <span>{{ bank.chapterCount || 0 }} 个章节</span>
              </span>
              <span class="stat-item">
                <el-icon><Document /></el-icon>
                <span>{{ bank.totalQuestions || 0 }} 道题目</span>
              </span>
              <span v-if="bank.collectedCount" class="stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ bank.collectedCount }} 人收藏</span>
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <FavoriteButton 
            :type="'bank'" 
            :target-id="bank.id" 
            :initial-collected="bank.isCollected"
            size="small"
            :plain="true"
            collected-button-type="warning"
            uncollected-button-type="warning"
            @collect-success="handleCollectSuccess"
            @uncollect-success="handleUncollectSuccess"
          />
          <el-button type="primary" plain size="small" @click="shareBank">
            <el-icon><Share /></el-icon> 分享
          </el-button>
          <el-button type="info" plain size="small" @click="goBack">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
        </div>
      </div>
      
      <!-- 我的学习模块 -->
      <div class="my-learning">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon><User /></el-icon>
            <span>我的学习</span>
          </h3>
          <el-button 
            type="text" 
            size="small" 
            @click="loadStatistics"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card 
              shadow="hover" 
              class="learning-card" 
              @click="goToMyMistakes"
              :class="{ 'empty-card': myMistakesCount === 0 }"
            >
              <div class="card-content">
                <div class="card-icon mistake">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">我的错题</div>
                  <div class="card-count" :class="{ 'zero': myMistakesCount === 0 }">
                    {{ myMistakesCount }}
                  </div>
                  <div class="card-unit">道题目</div>
                </div>
              </div>
              <div class="card-footer">
                <span class="go-text">查看错题</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card 
              shadow="hover" 
              class="learning-card" 
              @click="goToMyFavoriteQuestion"
              :class="{ 'empty-card': myFavoriteCount === 0 }"
            >
              <div class="card-content">
                <div class="card-icon favorite">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">我的收藏</div>
                  <div class="card-count" :class="{ 'zero': myFavoriteCount === 0 }">
                    {{ myFavoriteCount }}
                  </div>
                  <div class="card-unit">道题目</div>
                </div>
              </div>
              <div class="card-footer">
                <span class="go-text">查看收藏</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card 
              shadow="hover" 
              class="learning-card" 
              @click="goToMyMarked"
              :class="{ 'empty-card': myMarkedCount === 0 }"
            >
              <div class="card-content">
                <div class="card-icon marked">
                  <el-icon><Flag /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">我的斩题</div>
                  <div class="card-count" :class="{ 'zero': myMarkedCount === 0 }">
                    {{ myMarkedCount }}
                  </div>
                  <div class="card-unit">道题目</div>
                </div>
              </div>
              <div class="card-footer">
                <span class="go-text">查看斩题</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card 
              shadow="hover" 
              class="learning-card" 
              @click="goToNotesEditor"
              :class="{ 'empty-card': myNotesCount === 0 }"
            >
              <div class="card-content">
                <div class="card-icon note">
                  <el-icon><Notebook /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-title">我的笔记</div>
                  <div class="card-count" :class="{ 'zero': myNotesCount === 0 }">
                    {{ myNotesCount }}
                  </div>
                  <div class="card-unit">篇笔记</div>
                </div>
              </div>
              <div class="card-footer">
                <span class="go-text">编辑笔记</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 专项练习模块 -->
      <div class="special-practice">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon><Trophy /></el-icon>
            <span>专项练习</span>
          </h3>
          <div class="section-subtitle">选择练习模式，巩固知识点</div>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="practice-card" @click="startPractice('sequential')">
              <div class="practice-icon sequential">
                <el-icon><Sort /></el-icon>
              </div>
              <div class="practice-content">
                <h4>顺序练习</h4>
                <p>按章节顺序逐题练习</p>
                <div class="practice-progress">
                  <div class="progress-text">进度：0 / {{ bank.totalQuestions || 0 }}</div>
                  <el-progress 
                    :percentage="0" 
                    :show-text="false" 
                    :stroke-width="4"
                    color="#409EFF"
                  />
                </div>
              </div>
              <el-button type="primary" size="small" plain class="start-btn">开始练习</el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="practice-card" @click="startPractice('random')">
              <div class="practice-icon random">
                <el-icon><Refresh /></el-icon>
              </div>
              <div class="practice-content">
                <h4>随机练习</h4>
                <p>随机抽取题目进行练习</p>
                <div class="practice-progress">
                  <div class="progress-text">自定义题目数量</div>
                  <div class="custom-hint">
                    <el-icon><Setting /></el-icon>
                    <span>可设置练习量</span>
                  </div>
                </div>
              </div>
              <el-button type="primary" size="small" plain class="start-btn">开始练习</el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="practice-card" @click="startPractice('byType')">
              <div class="practice-icon type">
                <el-icon><List /></el-icon>
              </div>
              <div class="practice-content">
                <h4>题型专项</h4>
                <p>按题目类型专项突破</p>
                <div class="practice-progress">
                  <div class="progress-text">针对性练习</div>
                  <div class="custom-hint">
                    <el-icon><Aim /></el-icon>
                    <span>强化薄弱题型</span>
                  </div>
                </div>
              </div>
              <el-button type="primary" size="small" plain class="start-btn">开始练习</el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="practice-card" @click="startPractice('mock')">
              <div class="practice-icon exam">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="practice-content">
                <h4>模拟考试</h4>
                <p>仿真考试环境模拟</p>
                <div class="practice-progress">
                  <div class="progress-text">考试模式</div>
                  <div class="custom-hint">
                    <el-icon><Timer /></el-icon>
                    <span>限时完成</span>
                  </div>
                </div>
              </div>
              <el-button type="primary" size="small" plain class="start-btn">开始考试</el-button>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    
    <!-- 练习界面 -->
    <PracticeComponent
      v-else
      :bank-id="bank.id"
      :bank-name="bank.bankName"
      :mode="practiceMode"
      @close="exitPractice"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'
import PracticeComponent from '@/components/PracticeComponent/PracticeComponent'
import FavoriteButton from '@/components/FavoriteButton/FavoriteButton'
import { 
  listFavoriteQuestionAll 
} from '@/api/favoriteQuestion/favoriteQuestion'
import { 
  listQuestionErrorAll
} from '@/api/questionError/questionError'
import { 
  listQuestionMarkedAll
} from '@/api/questionMarked/questionMarked'

// 图标导入
import { 
  Collection, Folder, Document, Star, Share, ArrowLeft,
  User, Refresh, Warning, Flag, Notebook, ArrowRight,
  Trophy, Sort, List, Setting, Aim, Clock, Timer
} from '@element-plus/icons-vue'

const router = useRouter()
const { proxy } = getCurrentInstance()

// 定义props
const props = defineProps({
  bank: {
    type: Object,
    required: true
  },
  showPractice: {
    type: Boolean,
    default: false
  },
  practiceMode: {
    type: String,
    default: ''
  }
})

// 定义emits
const emit = defineEmits(['back', 'collect-success', 'uncollect-success', 'start-practice', 'exit-practice'])

// 响应式数据
const loading = ref(false)
const myMistakesCount = ref(0)
const myFavoriteCount = ref(0)
const myMarkedCount = ref(0)
const myNotesCount = ref(0)

// 获取当前用户ID
const getUserId = () => {
  // 这里根据你的实际情况获取用户ID
  // 假设从store或localStorage获取
  return localStorage.getItem('userId') || 1
}

// 加载统计数据
async function loadStatistics() {
  loading.value = true
  try {
    const userId = getUserId()
    const bankId = props.bank.id
    
    // 获取错题数量 - 注意响应格式
    const mistakeRes = await listQuestionErrorAll({
      userId: userId,
      bankId: bankId
    })
    // 不分页接口可能返回 data 而不是 rows
    myMistakesCount.value = mistakeRes.data?.length || mistakeRes.rows?.length || 0
    
    // 获取收藏数量
    const favoriteRes = await listFavoriteQuestionAll({
      userId: userId,
      bankId: bankId
    })
    // 注意：listFavoriteQuestionAll 返回的是 data
    myFavoriteCount.value = favoriteRes.data?.length || 0
    
    // 获取斩题数量 - 注意响应格式
    const markedRes = await listQuestionMarkedAll({
      userId: userId,
      bankId: bankId
    })
    // 不分页接口可能返回 data 而不是 rows
    myMarkedCount.value = markedRes.data?.length || markedRes.rows?.length || 0
    
    // 笔记数量（暂时设为0，有笔记功能后再实现）
    myNotesCount.value = 0
    
    // proxy.$modal.msgSuccess('数据刷新成功')
    
    // 调试输出
    console.log('错题响应:', mistakeRes)
    console.log('收藏响应:', favoriteRes)
    console.log('斩题响应:', markedRes)
    
  } catch (error) {
    console.error('加载统计数据失败:', error)
    proxy.$modal.msgError('数据加载失败')
  } finally {
    loading.value = false
  }
}
// 跳转到错题页面，带上题库ID参数
function goToMyMistakes() {
  router.push({
    path: '/myQuestion/myMistakes',
    query: { bankId: props.bank.id }
  })
}

// 跳转到收藏页面，带上题库ID参数
function goToMyFavoriteQuestion() {
  router.push({
    path: '/myQuestion/myFavoriteQuestion',
    query: { bankId: props.bank.id }
  })
}

// 跳转到斩题页面，带上题库ID参数
function goToMyMarked() {
  router.push({
    path: '/myQuestion/myMarked',
    query: { bankId: props.bank.id }
  })
}

// 跳转到笔记编辑器
function goToNotesEditor() {
  router.push('/notesEditor')
}

// 开始练习
function startPractice(type) {
  const modeText = 
    type === 'sequential' ? '顺序练习' : 
    type === 'random' ? '随机练习' : 
    type === 'byType' ? '题型专项练习' : 
    '模拟考试'

  proxy.$modal.confirm(`是否开始${modeText}？`).then(() => {
    emit('start-practice', type)
  }).catch(() => {})
}

// 退出练习
function exitPractice() {
  emit('exit-practice')
}

// 分享功能
function shareBank() {
  // 这里可以生成分享链接
  const shareUrl = `${window.location.origin}/#/bank/${props.bank.id}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    proxy.$modal.msgSuccess('链接已复制到剪贴板')
  }).catch(() => {
    proxy.$modal.msgError('复制失败，请手动复制')
  })
}

// 处理收藏成功事件
const handleCollectSuccess = (targetId, type) => {
  emit('collect-success', targetId, type)
}

// 处理取消收藏成功事件
const handleUncollectSuccess = (targetId, type) => {
  emit('uncollect-success', targetId, type)
}

// 返回题库列表
function goBack() {
  emit('back')
}

// 页面加载时获取数据
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.bank-detail-container {
  padding: 20px;
}

/* 头部信息样式 */
.bank-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.bank-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bank-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 16px;
  color: #409EFF;
  font-size: 14px;
}

.bank-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.bank-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 模块标题样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.section-title .el-icon {
  color: #409EFF;
}

.section-subtitle {
  color: #909399;
  font-size: 14px;
}

/* 学习卡片样式 */
.learning-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 20px;
}

.learning-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.learning-card.empty-card {
  opacity: 0.8;
}

.learning-card.empty-card:hover {
  transform: none;
  box-shadow: none;
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.card-icon.mistake { background-color: #f56c6c; }
.card-icon.favorite { background-color: #e6a23c; }
.card-icon.marked { background-color: #409EFF; }
.card-icon.note { background-color: #67c23a; }

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.card-count {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.card-count.zero {
  color: #c0c4cc;
}

.card-unit {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  color: #409EFF;
  font-size: 14px;
  transition: all 0.2s;
}

.learning-card:hover .card-footer {
  background: #f0f9ff;
}

/* 练习卡片样式 */
.practice-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 20px;
}

.practice-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.practice-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 28px;
  color: white;
}

.practice-icon.sequential { background-color: #409EFF; }
.practice-icon.random { background-color: #f56c6c; }
.practice-icon.type { background-color: #67c23a; }
.practice-icon.exam { background-color: #e6a23c; }

.practice-content {
  text-align: center;
  padding: 0 16px;
}

.practice-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.practice-content p {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.practice-progress {
  margin-bottom: 16px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.custom-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #409EFF;
}

.start-btn {
  width: 100%;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border: none;
  border-top: 1px solid #e4e7ed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bank-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .bank-title {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .bank-stats {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .learning-card,
  .practice-card {
    margin-bottom: 16px;
  }
}

/* 动画效果 */
.learning-card,
.practice-card {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 进度条样式 */
:deep(.el-progress-bar__inner) {
  background-color: #409EFF;
}
</style>