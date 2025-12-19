<!-- src/components/MyQuestion/QuestionCard.vue -->
<template>
  <div class="question-card" @click="$emit('view-detail', item)">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="question-type-badge" :class="getQuestionTypeClass(item.questionDetail?.questionType)">
        {{ getQuestionTypeText(item.questionDetail?.questionType) }}
      </div>
      
      <div class="header-actions">
        <!-- 标星按钮（仅收藏页面显示） -->
        <el-icon 
          v-if="showStar && questionType === 'favorite'"
          :class="['star-icon', { 'starred': item.isStarred }]"
          @click.stop="handleToggleStar"
        >
          <StarFilled v-if="item.isStarred" />
          <Star v-else />
        </el-icon>
        
        <!-- 收藏状态标签（仅收藏页面显示） -->
        <el-tag 
          v-if="showFavoriteStatus && questionType === 'favorite' && item.favoriteStatus"
          :type="getFavoriteStatusType(item.favoriteStatus)"
          size="small"
          class="status-tag"
        >
          {{ getFavoriteStatusText(item.favoriteStatus) }}
        </el-tag>
        
        <!-- 错题标签 -->
        <el-tag 
          v-if="questionType === 'wrong'"
          type="danger"
          size="small"
          class="wrong-tag"
        >
          错题
        </el-tag>
        
        <!-- 斩题标签 -->
        <el-tag 
          v-if="questionType === 'marked'"
          :type="getMarkedTypeTagType(item.markedType)"
          size="small"
          class="marked-tag"
        >
          {{ getMarkedTypeText(item.markedType) }}
        </el-tag>
      </div>
    </div>
    
    <!-- 题目内容 -->
    <div class="card-content">
      <div class="question-text" v-html="formatQuestionText(item.questionDetail?.questionText)"></div>
      
      <!-- 斩题信息（仅在斩题页面显示） -->
      <div v-if="questionType === 'marked'" class="marked-info-section">
        <!-- 斩题类型 -->
        <div class="marked-info-row">
          <span class="marked-info-label">斩题类型：</span>
          <el-tag 
            :type="getMarkedTypeTagType(item.markedType)"
            size="small"
            class="marked-type-tag"
          >
            {{ getMarkedTypeText(item.markedType) }}
          </el-tag>
        </div>
        
        <!-- 斩题难度 -->
        <div v-if="item.difficultyLevel" class="marked-info-row">
          <span class="marked-info-label">斩题难度：</span>
          <el-tag 
            :type="getMarkedDifficultyTagType(item.difficultyLevel)"
            size="small"
            class="marked-difficulty-tag"
          >
            {{ getDifficultyText(item.difficultyLevel) }}
          </el-tag>
        </div>
        
        <!-- 原题难度（单独一行，视觉区分） -->
        <div v-if="item.questionDetail?.difficulty" class="original-difficulty-row">
          <span class="original-difficulty-label">原题难度：</span>
          <el-tag 
            size="small"
            :type="getOriginalDifficultyTagType(item.questionDetail.difficulty)"
            class="original-difficulty-tag"
          >
            {{ getDifficultyText(item.questionDetail.difficulty) }}
          </el-tag>
          
        </div>
      </div>
      
      <!-- 题目难度（非斩题页面显示） -->
      <div v-else-if="item.questionDetail?.difficulty" class="difficulty-row">
        <span class="difficulty-label">题目难度：</span>
        <el-tag 
          size="small"
          :type="getDifficultyTagType(item.questionDetail.difficulty)"
        >
          {{ getDifficultyText(item.questionDetail.difficulty) }}
        </el-tag>
      </div>
      
      <!-- 选择题选项预览 -->
      <div v-if="[1, 2].includes(item.questionDetail?.questionType) && item.questionDetail?.options" class="options-preview">
        <div 
          v-for="(option, index) in getPreviewOptions(item.questionDetail.options)" 
          :key="index"
          class="option-preview"
        >
          <span class="option-letter">{{ getOptionLabel(index) }}.</span>
          <span class="option-text">{{ option }}</span>
        </div>
      </div>
      
      <!-- 填空题/简答题预览 -->
      <div v-else-if="[4, 5].includes(item.questionDetail?.questionType)" class="answer-preview">
        <div class="preview-label">答案预览：</div>
        <div class="preview-text">{{ truncateText(item.questionDetail?.answer, 60) }}</div>
      </div>
      
      <!-- 掌握状态 -->
      <div v-if="questionType !== 'favorite' && item.isMastered !== undefined" class="mastery-status">
        <el-tag 
          :type="item.isMastered ? 'success' : 'warning'"
          size="small"
        >
          {{ item.isMastered ? '已掌握' : '未掌握' }}
        </el-tag>
      </div>
      
      <!-- 题库信息 -->
      <div v-if="item.bankDetail" class="bank-info">
        <el-icon><Collection /></el-icon>
        <span>{{ item.bankDetail.bankName }}</span>
      </div>
      
      <!-- 斩题备注 -->
      <div v-if="questionType === 'marked' && item.notes" class="marked-notes">
        <div class="notes-label">斩题备注：</div>
        <div class="notes-text">{{ truncateText(item.notes, 80) }}</div>
      </div>
      
      <!-- 时间信息 -->
      <div class="time-info">
        <el-icon><Clock /></el-icon>
        <span>{{ getTimeLabel() }}：{{ formatTime(item.createTime) }}</span>
      </div>
    </div>
    
    <!-- 卡片底部操作按钮 -->
    <div v-if="showCollectActions" class="card-footer">
      <el-button 
        type="primary" 
        size="small" 
        plain
        @click.stop="$emit('view-detail', item)"
        class="view-detail-btn"
      >
        <el-icon><View /></el-icon>
        查看详情
      </el-button>
      
      <el-button 
        type="danger" 
        size="small" 
        plain
        @click.stop="handleUncollect"
        :loading="uncollectLoading"
        class="uncollect-btn"
      >
        <el-icon><Delete /></el-icon>
        {{ getUncollectText() }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { 
  Star, StarFilled, Collection, Clock, View, Delete
} from '@element-plus/icons-vue'
import { computed } from 'vue'

const props = defineProps({
  item: Object,
  questionType: {
    type: String,
    default: 'favorite'
  },
  showStar: Boolean,
  showFavoriteStatus: Boolean,
  showCollectActions: Boolean,
  showStudyStats: Boolean,
  uncollectLoading: Boolean
})

const emit = defineEmits(['view-detail', 'toggle-star', 'uncollect'])

// 计算属性
const questionDetail = computed(() => props.item?.questionDetail || {})
const bankDetail = computed(() => props.item?.bankDetail)
const isStarred = computed(() => props.item?.isStarred)
const favoriteStatus = computed(() => props.item?.favoriteStatus)

// 新增斩题相关函数
const getMarkedTypeText = (markedType) => {
  const typeMap = {
    1: '错题',
    2: '难题',
    3: '重点',
    4: '易错',
    5: '技巧'
  }
  return typeMap[markedType] || '斩题'
}

const getMarkedTypeTagType = (markedType) => {
  const typeMap = {
    1: 'danger',    // 错题 - 红色
    2: 'warning',   // 难题 - 橙色
    3: 'primary',   // 重点 - 蓝色
    4: 'info',      // 易错 - 青色
    5: 'success'    // 技巧 - 绿色
  }
  return typeMap[markedType] || ''
}

// 斩题难度标签类型
const getMarkedDifficultyTagType = (difficulty) => {
  const typeMap = {
    1: 'primary',   // 简单 - 深蓝色
    2: 'warning',   // 中等 - 橙色
    3: 'danger',    // 困难 - 红色
    4: 'danger'     // 极难 - 红色
  }
  return typeMap[difficulty] || 'primary'
}

// 原题难度标签类型（用灰色区分）
const getOriginalDifficultyTagType = (difficulty) => {
  const typeMap = {
    1: '',           // 简单 - 默认灰色
    2: '',           // 中等 - 默认灰色
    3: '',           // 困难 - 默认灰色
    4: ''            // 极难 - 默认灰色
  }
  return typeMap[difficulty] || ''
}

// 普通题目难度标签类型
const getDifficultyTagType = (difficulty) => {
  const typeMap = {
    1: 'success',   // 简单 - 绿色
    2: 'info',      // 中等 - 蓝色
    3: 'warning',   // 困难 - 橙色
    4: 'danger'     // 极难 - 红色
  }
  return typeMap[difficulty] || ''
}

const getDifficultyText = (difficulty) => {
  const diffMap = {
    1: '简单',
    2: '中等',
    3: '困难',
    4: '极难'
  }
  return diffMap[difficulty] || '未知'
}

// 工具方法
const getQuestionTypeText = (type) => {
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题',
    6: '阅读理解',
    7: '完形填空'
  }
  return typeMap[type] || '未知题型'
}

const getQuestionTypeClass = (type) => {
  const classMap = {
    1: 'type-single',
    2: 'type-multiple',
    3: 'type-truefalse',
    4: 'type-fillblank',
    5: 'type-essay',
    6: 'type-reading',
    7: 'type-cloze'
  }
  return classMap[type] || ''
}

const getFavoriteStatusText = (status) => {
  const statusMap = {
    1: '正常收藏',
    2: '已掌握',
    3: '待复习',
    0: '已取消'
  }
  return statusMap[status] || '未知'
}

const getFavoriteStatusType = (status) => {
  const typeMap = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    0: 'info'
  }
  return typeMap[status] || 'info'
}

const formatQuestionText = (text) => {
  if (!text) return ''
  return text.replace(/\n/g, '<br>').substring(0, 200) + (text.length > 200 ? '...' : '')
}

const truncateText = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index)
}

const getPreviewOptions = (options) => {
  if (!options) return []
  try {
    const opts = typeof options === 'string' ? JSON.parse(options) : options
    return Array.isArray(opts) ? opts.slice(0, 2) : []
  } catch (e) {
    return []
  }
}

const getTimeLabel = () => {
  const labelMap = {
    favorite: '收藏时间',
    wrong: '创建时间',
    marked: '标记时间'
  }
  return labelMap[props.questionType] || '时间'
}

const getUncollectText = () => {
  const textMap = {
    favorite: '取消收藏',
    wrong: '移除错题',
    marked: '取消斩题'
  }
  return textMap[props.questionType] || '取消'
}

const formatTime = (time) => {
  if (!time) return ''
  try {
    const date = new Date(time)
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } catch (e) {
    return time
  }
}

// 新增函数
const handleToggleStar = () => {
  // 错题和斩题不能标星
  if (props.questionType === 'wrong' || props.questionType === 'marked') {
    console.log(`${props.questionType === 'wrong' ? '错题' : '斩题'}不支持标星操作`)
    return
  }
  // 只有收藏页面可以标星
  if (props.questionType === 'favorite') {
    emit('toggle-star', props.item)
  }
}

const handleUncollect = () => {
  emit('uncollect', props.item)
}
</script>

<style scoped>
.question-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .question-type-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      
      &.type-single { background: #409eff; }
      &.type-multiple { background: #67c23a; }
      &.type-truefalse { background: #e6a23c; }
      &.type-fillblank { background: #909399; }
      &.type-essay { background: #f56c6c; }
      &.type-reading { background: #8e44ad; }
      &.type-cloze { background: #3498db; }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .star-icon {
        font-size: 18px;
        color: #dcdfe6;
        cursor: pointer;
        transition: color 0.2s;
        
        &:hover {
          color: #e6a23c;
        }
        
        &.starred {
          color: #e6a23c;
        }
      }
      
      .wrong-tag {
        background-color: #fef0f0;
        border-color: #fde2e2;
        color: #f56c6c;
      }
      
      .marked-tag {
        font-weight: 500;
      }
    }
  }
  
  .card-content {
    flex: 1;
    
    .question-text {
      font-size: 14px;
      line-height: 1.5;
      color: #303133;
      margin-bottom: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    
    /* 斩题信息区域 */
    .marked-info-section {
      margin-bottom: 16px;
      padding: 12px;
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border-radius: 6px;
      border-left: 4px solid #409eff;
      border-top: 1px solid #e4e7ed;
      border-right: 1px solid #e4e7ed;
      border-bottom: 1px solid #e4e7ed;
      
      .marked-info-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        
        .marked-info-label {
          color: #606266;
          font-weight: 500;
          min-width: 75px;
          flex-shrink: 0;
        }
        
        .marked-type-tag {
          font-weight: 500;
        }
        
        .marked-difficulty-tag {
          font-weight: 500;
          border-style: solid;
          border-width: 2px;
        }
      }
      
      /* 原题难度行 - 单独一行，视觉区分 */
      .original-difficulty-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #e4e7ed;
        font-size: 12px;
        
        .original-difficulty-label {
          color: #909399;
          font-weight: 500;
          min-width: 75px;
          flex-shrink: 0;
        }
        
        .original-difficulty-tag {
          background: #f5f7fa;
          border-color: #dcdfe6;
          color: #909399;
          border-style: dotted;
          opacity: 0.8;
        }
        
        .original-difficulty-hint {
          color: #c0c4cc;
          font-size: 11px;
          font-style: italic;
          margin-left: 4px;
        }
      }
    }
    
    /* 普通难度行（非斩题页面） */
    .difficulty-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 13px;
      
      .difficulty-label {
        color: #606266;
        font-weight: 500;
      }
    }
    
    /* 掌握状态 */
    .mastery-status {
      margin-bottom: 16px;
    }
    
    .options-preview {
      margin-bottom: 12px;
      
      .option-preview {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
        
        .option-letter {
          font-weight: 500;
          margin-right: 4px;
        }
      }
    }
    
    .answer-preview {
      margin-bottom: 16px;
      
      .preview-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .preview-text {
        font-size: 13px;
        color: #606266;
        line-height: 1.4;
        font-style: italic;
        background: #f8f9fa;
        padding: 6px 10px;
        border-radius: 4px;
        border-left: 3px solid #e6a23c;
      }
    }
    
    .bank-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #409eff;
      margin-bottom: 16px;
      font-weight: 500;
      
      .el-icon {
        font-size: 14px;
      }
    }
    
    .marked-notes {
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #f0f9ff;
      border-radius: 6px;
      border-left: 3px solid #409eff;
      
      .notes-label {
        font-size: 12px;
        color: #409eff;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .notes-text {
        font-size: 13px;
        color: #606266;
        line-height: 1.4;
      }
    }
    
    .time-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #909399;
      margin-bottom: 16px;
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
  
  .card-footer {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
    
    :deep(.el-button) {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 12px;
    }
    
    .view-detail-btn {
      border-color: #409eff;
      color: #409eff;
      
      &:hover {
        background: #ecf5ff;
        border-color: #79bbff;
        color: #79bbff;
      }
    }
    
    .uncollect-btn {
      border-color: #f56c6c;
      color: #f56c6c;
      
      &:hover {
        background: #fef0f0;
        border-color: #f89898;
        color: #f89898;
      }
    }
  }
}

/* 不同类型斩题的特定样式 */
.marked-tag[type="danger"] { /* 错题 */
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
  color: #f56c6c;
}

.marked-tag[type="warning"] { /* 难题 */
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #f8d4a3;
  color: #e6a23c;
}

.marked-tag[type="primary"] { /* 重点 */
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #a0cfff;
  color: #409eff;
}

.marked-tag[type="info"] { /* 易错 */
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  border-color: #c8c9cc;
  color: #909399;
}

.marked-tag[type="success"] { /* 技巧 */
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-color: #b3e19d;
  color: #67c23a;
}

/* 斩题难度标签样式 */
.marked-difficulty-tag[type="primary"] { /* 斩题简单 */
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #409eff;
  color: #409eff;
  border-width: 2px;
}

.marked-difficulty-tag[type="warning"] { /* 斩题中等 */
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #e6a23c;
  color: #e6a23c;
  border-width: 2px;
}

.marked-difficulty-tag[type="danger"] { /* 斩题困难和极难 */
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #f56c6c;
  color: #f56c6c;
  border-width: 2px;
}

/* 题目原始难度标签样式（统一灰色） */
.original-difficulty-tag {
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%) !important;
  border-color: #dcdfe6 !important;
  color: #909399 !important;
  border-style: dotted !important;
  opacity: 0.8;
}

/* 普通题目难度标签样式 */
[type="success"] { /* 简单 */
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
  border-color: #b3e19d;
  color: #67c23a;
}

[type="info"] { /* 中等 */
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  border-color: #c8c9cc;
  color: #909399;
}

[type="warning"] { /* 困难 */
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #f8d4a3;
  color: #e6a23c;
}

[type="danger"] { /* 极难 */
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border-color: #fbc4c4;
  color: #f56c6c;
}

/* 视觉对比强调 */
.marked-difficulty-tag {
  font-weight: 600 !important;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.original-difficulty-tag {
  font-weight: 400 !important;
  text-shadow: none;
}
</style>