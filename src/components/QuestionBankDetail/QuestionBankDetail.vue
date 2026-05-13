<template>
  <div class="bank-detail-container" ref="containerRef">
    <div>
      <!-- 头部信息 -->
      <div class="bank-header">
        <!-- 左侧：返回 -->
        <div class="header-left">
          <div class="back-link" @click="goBack">
            <el-icon size="20">
              <ArrowLeft />
            </el-icon>
            <span>返回</span>
          </div>
        </div>

        <!-- 中间：标题（绝对居中） -->
        <div class="header-center">
          <div class="bank-info">
            <h2 class="bank-name">{{ bank.bankName }}</h2>
            <div class="bank-stats">
              <span class="stat-item">
                <el-icon>
                  <Folder />
                </el-icon>
                <span>{{ bank.chapterCount || 0 }} 个章节</span>
              </span>
              <span class="stat-item">
                <el-icon>
                  <Document />
                </el-icon>
                <span>{{ bank.totalQuestions || 0 }} 道题目</span>
              </span>
              <span v-if="bank.collectedCount" class="stat-item">
                <el-icon>
                  <Star />
                </el-icon>
                <span>{{ bank.collectedCount }} 人收藏</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="header-right">
          <div class="fav-wrapper">
            <FavoriteButton :type="'bank'" :target-id="bank.id" :initial-collected="bank.isCollected" size="small"
              :plain="true" :text="true" collected-button-type="warning" uncollected-button-type="default"
              @collect-success="handleCollectSuccess" @uncollect-success="handleUncollectSuccess" />
          </div>

          <el-button v-if="isCreator" type="info" link class="action-link" @click="editBankQuestions">
            <el-icon>
              <Edit />
            </el-icon> 编辑题目
          </el-button>

          <el-button type="info" link class="action-link" @click="shareBank">
            <el-icon>
              <Share />
            </el-icon> 分享
          </el-button>
        </div>
      </div>

      <!-- 我的学习模块 -->
      <div class="my-learning">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon>
              <User />
            </el-icon>
            <span>我的学习</span>
          </h3>
          <!-- ✅ 这里改成了 刷题设置 按钮 -->
          <el-button size="small" plain class="rounded-btn" @click="openPracticeSettings">
            <el-icon>
              <Setting />
            </el-icon> 刷题设置
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="learning-card"
              :class="{ 'compact-mode': isCompactMode, 'empty-card': myMistakesCount === 0 }" @click="goToMyMistakes">
              <div class="card-content" :class="{ 'compact': isCompactMode }">
                <div class="card-icon mistake"><el-icon>
                    <Warning />
                  </el-icon></div>
                <div v-if="!isCompactMode" class="card-info">
                  <div class="card-title">我的错题</div>
                  <div class="card-count" :class="{ 'zero': myMistakesCount === 0 }">{{ myMistakesCount }}</div>
                  <div class="card-unit">道题目</div>
                </div>
                <div v-else class="card-info-compact">
                  <div class="card-count-compact" :class="{ 'zero': myMistakesCount === 0 }">{{ myMistakesCount }}</div>
                </div>
              </div>
              <div v-if="!isCompactMode" class="card-footer">
                <span class="go-text">查看错题</span>
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="learning-card"
              :class="{ 'compact-mode': isCompactMode, 'empty-card': myFavoriteCount === 0 }"
              @click="goToMyFavoriteQuestion">
              <div class="card-content" :class="{ 'compact': isCompactMode }">
                <div class="card-icon favorite"><el-icon>
                    <Star />
                  </el-icon></div>
                <div v-if="!isCompactMode" class="card-info">
                  <div class="card-title">我的收藏</div>
                  <div class="card-count" :class="{ 'zero': myFavoriteCount === 0 }">{{ myFavoriteCount }}</div>
                  <div class="card-unit">道题目</div>
                </div>
                <div v-else class="card-info-compact">
                  <div class="card-count-compact" :class="{ 'zero': myFavoriteCount === 0 }">{{ myFavoriteCount }}</div>
                </div>
              </div>
              <div v-if="!isCompactMode" class="card-footer">
                <span class="go-text">查看收藏</span>
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="learning-card"
              :class="{ 'compact-mode': isCompactMode, 'empty-card': myMarkedCount === 0 }" @click="goToMyMarked">
              <div class="card-content" :class="{ 'compact': isCompactMode }">
                <div class="card-icon marked"><el-icon>
                    <Flag />
                  </el-icon></div>
                <div v-if="!isCompactMode" class="card-info">
                  <div class="card-title">我的斩题</div>
                  <div class="card-count" :class="{ 'zero': myMarkedCount === 0 }">{{ myMarkedCount }}</div>
                  <div class="card-unit">道题目</div>
                </div>
                <div v-else class="card-info-compact">
                  <div class="card-count-compact" :class="{ 'zero': myMarkedCount === 0 }">{{ myMarkedCount }}</div>
                </div>
              </div>
              <div v-if="!isCompactMode" class="card-footer">
                <span class="go-text">查看斩题</span>
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="learning-card"
              :class="{ 'compact-mode': isCompactMode, 'empty-card': myNotesCount === 0 }" @click="goToNotesEditor">
              <div class="card-content" :class="{ 'compact': isCompactMode }">
                <div class="card-icon note"><el-icon>
                    <Notebook />
                  </el-icon></div>
                <div v-if="!isCompactMode" class="card-info">
                  <div class="card-title">我的笔记</div>
                  <div class="card-count" :class="{ 'zero': myNotesCount === 0 }">{{ myNotesCount }}</div>
                  <div class="card-unit">篇笔记</div>
                </div>
                <div v-else class="card-info-compact">
                  <div class="card-count-compact" :class="{ 'zero': myNotesCount === 0 }">{{ myNotesCount }}</div>
                </div>
              </div>
              <div v-if="!isCompactMode" class="card-footer">
                <span class="go-text">编辑笔记</span>
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 专项练习模块 -->
      <div class="special-practice">
        <div class="section-header">
          <div class="section-header-left">
            <h3 class="section-title">
              <el-icon>
                <Trophy />
              </el-icon>
              <span>专项练习</span>
            </h3>
            <div class="section-subtitle">选择练习模式，巩固知识点</div>
          </div>
          <!-- ✅ 这里删除了刷题设置按钮 -->
        </div>
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="practice-card" :class="{ 'compact-mode': isCompactMode }"
              @click="startPractice('sequential')">
              <div class="practice-icon-wrapper">
                <div class="practice-icon sequential"><el-icon>
                    <Sort />
                  </el-icon></div>
              </div>
              <div class="practice-content">
                <h4>顺序练习</h4>
                <p>按章节顺序逐题练习</p>
                <div class="practice-meta"><span>{{ bank.totalQuestions || 0 }} 题</span></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="practice-card" :class="{ 'compact-mode': isCompactMode }"
              @click="startPractice('random')">
              <div class="practice-icon-wrapper">
                <div class="practice-icon random"><el-icon>
                    <Refresh />
                  </el-icon></div>
              </div>
              <div class="practice-content">
                <h4>随机练习</h4>
                <p>随机抽取题目进行练习</p>
                <div class="practice-meta"><span>{{ bank.totalQuestions || 0 }} 题</span></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="practice-card" :class="{ 'compact-mode': isCompactMode }"
              @click="startPractice('custom')">
              <div class="practice-icon-wrapper">
                <div class="practice-icon custom"><el-icon>
                    <Setting />
                  </el-icon></div>
              </div>
              <div class="practice-content">
                <h4>自定义练习</h4>
                <p>自由配置顺序、乱序、错题等参数</p>
                <div class="practice-meta"><span>灵活配置</span></div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
            <el-card shadow="hover" class="practice-card" :class="{ 'compact-mode': isCompactMode }"
              @click="startPractice('mock')">
              <div class="practice-icon-wrapper">
                <div class="practice-icon exam"><el-icon>
                    <Clock />
                  </el-icon></div>
              </div>
              <div class="practice-content">
                <h4>模拟考试</h4>
                <p>仿真考试环境模拟</p>
                <div class="practice-meta"><span>限时完成</span></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <PracticeSettings v-model="showPracticeSettings" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentInstance } from 'vue'
import useUserStore from '@/store/modules/user'
import usePracticeSettingsStore from '@/store/modules/practiceSettings'
import PracticeSettings from '@/components/PracticeComponent/PracticeSettings.vue'
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
import { getNoteQuestionBanksByBankId } from '@/api/noteQuestionBank/noteQuestionBank'

import {
  Collection, Folder, Document, Star, Share, ArrowLeft,
  User, Refresh, Warning, Flag, Notebook, ArrowRight,
  Trophy, Sort, Setting, Aim, Clock, Timer,
  Edit
} from '@element-plus/icons-vue'

const router = useRouter()
const { proxy } = getCurrentInstance()
const userStore = useUserStore()
const practiceSettingsStore = usePracticeSettingsStore()
const currentUserId = userStore.id

const showPracticeSettings = ref(false)

const props = defineProps({
  bank: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'collect-success', 'uncollect-success'])

const isCreator = computed(() => {
  const bankUserId = props.bank.userId || props.bank.user_id || props.bank.createById
  if (bankUserId) {
    return Number(bankUserId) === Number(currentUserId)
  }
  if (props.bank.createBy) {
    return props.bank.createBy === userStore.name
  }
  return false
})

const loading = ref(false)
const myMistakesCount = ref(0)
const myFavoriteCount = ref(0)
const myMarkedCount = ref(0)
const myNotesCount = ref(0)
const containerRef = ref(null)
const containerWidth = ref(0)
let resizeObserver = null

const isCompactMode = computed(() => {
  return containerWidth.value > 0 && containerWidth.value < 600
})

const updateContainerWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
  }
}

onMounted(() => {
  updateContainerWidth()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    resizeObserver.observe(containerRef.value)
  }
  loadStatistics()
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const getUserId = () => currentUserId

const editBankQuestions = () => {
  const type = props.bank.isPublic === 0 ? 'public' : 'private'
  router.push({
    path: '/front/studio/create',
    query: { bankId: props.bank.id, type }
  })
}

async function loadStatistics() {
  loading.value = true
  try {
    const userId = getUserId()
    const bankId = props.bank.id

    const mistakeRes = await listQuestionErrorAll({ userId, bankId })
    myMistakesCount.value = mistakeRes.data?.length || mistakeRes.rows?.length || 0

    const favoriteRes = await listFavoriteQuestionAll({ userId, bankId })
    myFavoriteCount.value = favoriteRes.data?.length || 0

    const markedRes = await listQuestionMarkedAll({ userId, bankId })
    myMarkedCount.value = markedRes.data?.length || markedRes.rows?.length || 0

    const notesRes = await getNoteQuestionBanksByBankId(bankId)
    myNotesCount.value = notesRes.data?.length || 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
    proxy.$modal.msgError('数据加载失败')
  } finally {
    loading.value = false
  }
}

function goToMyMistakes() {
  router.push({ path: '/front/myQuestion/wrongQuestion', query: { bankId: props.bank.id } })
}

function goToMyFavoriteQuestion() {
  router.push({ path: '/front/myQuestion/questionCollect', query: { bankId: props.bank.id } })
}

function goToMyMarked() {
  router.push({ path: '/front/myQuestion/masteredQuestion', query: { bankId: props.bank.id } })
}

function goToNotesEditor() {
  router.push({ path: '/front/myQuestion/myNotes', query: { bankId: props.bank.id } })
}

function startPractice(type) {
  router.push(`/front/questionPractice/${props.bank.id}/practice/${type}?bankName=${encodeURIComponent(props.bank.bankName || '')}`)
}

function openPracticeSettings() {
  practiceSettingsStore.setCurrentBank(props.bank.id, props.bank.bankName)
  showPracticeSettings.value = true
}

function shareBank() {
  const shareUrl = `${window.location.origin}/#/bank/${props.bank.id}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    proxy.$modal.msgSuccess('链接已复制到剪贴板')
  }).catch(() => {
    proxy.$modal.msgError('复制失败，请手动复制')
  })
}

const handleCollectSuccess = (targetId, type) => emit('collect-success', targetId, type)
const handleUncollectSuccess = (targetId, type) => emit('uncollect-success', targetId, type)

function goBack() {
  emit('back')
}
</script>

<style scoped>
.bank-detail-container {
  padding: 20px;
}

/* --- 头部 --- */
.bank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  min-height: 80px;
}

/* 左侧：返回 */
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: #333;
}

/* 中间：标题 - 绝对居中 */
.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bank-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bank-name {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
}

.bank-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 右侧：操作按钮 */
.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex: 1;
}

.action-link {
  color: #6b7280;
  font-weight: 400;
}

.action-link:hover {
  color: #409EFF;
}

.fav-wrapper {
  display: flex;
  align-items: center;
}

.fav-wrapper :deep(.el-button) {
  border: none;
  background: transparent !important;
  padding: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .bank-header {
    flex-direction: column;
    align-items: flex-start;
    min-height: auto;
    gap: 12px;
  }

  .header-center {
    position: static;
    transform: none;
    width: 100%;
    align-items: flex-start;
    padding: 8px 0;
  }

  .bank-info {
    align-items: flex-start;
  }

  .bank-name {
    font-size: 20px;
  }

  .bank-stats {
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

/* 左侧：返回 */
.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  flex-shrink: 0;
}

.back-link:hover {
  color: #333;
}

/* 中间：标题居中 */
.bank-title {
  display: flex;
  justify-content: center;
  flex: 1;
  padding: 0 20px;
}

.bank-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bank-name {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.bank-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 右侧：操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.action-link {
  color: #6b7280;
  font-weight: 400;
}

.action-link:hover {
  color: #409EFF;
}

.fav-wrapper {
  display: flex;
  align-items: center;
}

.fav-wrapper :deep(.el-button) {
  border: none;
  background: transparent !important;
  padding: 0;
}

.header-left-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
}

/* 返回按钮独立一行，靠左上角 */
.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  margin-bottom: 8px;
}

.back-link:hover {
  color: #333;
}

.bank-title {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.bank-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bank-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.bank-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  align-self: flex-end;
}

.action-link {
  color: #6b7280;
  font-weight: 400;
}

.action-link:hover {
  color: #409EFF;
}

.fav-wrapper {
  display: flex;
  align-items: center;
}

.fav-wrapper :deep(.el-button) {
  border: none;
  background: transparent !important;
  padding: 0;
}

.header-left-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: #333;
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
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
}

.bank-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.bank-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-link {
  color: #6b7280;
  font-weight: 400;
}

.action-link:hover {
  color: #409EFF;
}

.fav-wrapper {
  display: flex;
  align-items: center;
}

.fav-wrapper :deep(.el-button) {
  border: none;
  background: transparent !important;
  padding: 0;
}

/* --- 我的学习 --- */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.section-title .el-icon {
  color: #6b7280;
}

.section-subtitle {
  color: #9ca3af;
  font-size: 13px;
  margin-left: 28px;
}

.rounded-btn {
  border-radius: 8px !important;
}

.learning-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin-bottom: 20px;
}

.learning-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
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
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.card-icon.mistake {
  background-color: #f56c6c;
}

.card-icon.favorite {
  background-color: #e6a23c;
}

.card-icon.marked {
  background-color: #f59e0b;
}

.card-icon.note {
  background-color: #67c23a;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.card-count {
  font-size: 32px;
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

/* 卡片底部 - 去掉背景，左对齐，灰色文字 */
.card-footer {
  background: transparent;
  border-top: none;
  padding: 12px 20px 8px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* ✅ 改为 center 实现水平居中 */
  gap: 4px;
  color: #6b7280;
  font-size: 13px;
  transition: color 0.2s;
}

.card-footer:hover {
  color: #409EFF;
}

/* 紧凑模式适配 */
.learning-card.compact-mode .card-content {
  flex-direction: column;
  padding: 16px;
  justify-content: center;
  align-items: center;
}

.learning-card.compact-mode .card-icon {
  margin-right: 0;
  margin-bottom: 12px;
  width: 48px;
  height: 48px;
}

.learning-card.compact-mode .card-info-compact {
  text-align: center;
}

.learning-card.compact-mode .card-count-compact {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.learning-card.compact-mode .card-count-compact.zero {
  color: #c0c4cc;
}

/* --- 专项练习 --- */
.practice-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  margin-bottom: 20px;
  min-height: 200px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.practice-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.practice-icon-wrapper {
  margin-bottom: 12px;
}

.practice-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  margin: 0 auto;
  flex-shrink: 0;
}

.practice-icon.sequential {
  background-color: rgba(64, 158, 255, 0.9);
}

.practice-icon.random {
  background-color: rgba(245, 108, 108, 0.9);
}

.practice-icon.custom {
  background-color: rgba(103, 194, 58, 0.9);
}

.practice-icon.exam {
  background-color: rgba(230, 162, 60, 0.9);
}

.practice-content {
  text-align: center;
  width: 100%;
}

.practice-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.practice-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #909399;
  word-break: break-word;
  line-height: 1.4;
}

.practice-meta {
  font-size: 12px;
  color: #c0c4cc;
}

.practice-card.compact-mode {
  min-height: auto;
  padding: 16px;
}

.practice-card.compact-mode .practice-icon {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.practice-card.compact-mode .practice-content p {
  display: none;
}

/* --- 响应式 --- */
@media (max-width: 768px) {
  .bank-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-left-wrapper {
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
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

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .learning-card,
  .practice-card {
    margin-bottom: 16px;
  }
}

/* 动画 */
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

:deep(.el-progress-bar__inner) {
  background-color: #409EFF;
}
</style>