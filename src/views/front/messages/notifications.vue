<template>
  <div class="notifications-page">
    <div class="page-header">
      <h3 class="page-title">系统通知</h3>
      <div class="header-actions">
        <el-button v-if="noticeList.length > 0" class="delete-all-btn" size="small" @click="handleDeleteAll">
          清空全部
        </el-button>
        <el-button v-if="unreadCount > 0" class="read-all-btn" size="small" @click="handleReadAll">
          全部已读
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="notice-list">
      <div v-for="notice in noticeList" :key="notice.noticeId || notice.id" class="notice-card"
        :class="{ unread: !notice.isRead }" @click="handleClick(notice)">
        <div class="notice-left">
          <span v-if="!notice.isRead" class="unread-dot" />
        </div>
        <div class="notice-body">
          <div class="notice-title">{{ notice.noticeTitle || notice.title }}</div>
          <div class="notice-summary">
            {{ displayContent(notice) }}
          </div>
          <div v-if="needsExpand(notice.noticeContent || notice.content || '')" class="notice-expand-btn"
            @click.stop="toggleExpand(notice)">
            {{ expandedId === (notice.noticeId || notice.id) ? '收起' : '展开全文' }}
          </div>
          <div class="notice-time">{{ relativeTime(notice.createTime) }}</div>
        </div>
        <div class="notice-actions" @click.stop>
          <el-button class="delete-btn" :icon="Delete" circle @click="handleDelete(notice)" />
        </div>
      </div>
      <el-empty v-if="!loading && noticeList.length === 0" description="暂无系统通知" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { listAllNotice, markRead, markReadAll, deleteFrontNotice, deleteFrontNoticeBatch } from '@/api/system/notice'

const router = useRouter()

const loading = ref(false)
const noticeList = ref([])
const unreadCount = ref(0)
const expandedId = ref(null)

const refreshBadge = inject('refreshBadge', () => { })

const fetchNotices = async () => {
  loading.value = true
  try {
    const res = await listAllNotice()
    const all = res.data || []
    noticeList.value = all.filter(n => {
      // 没有 remark 的是管理员公告，保留
      if (!n.remark || n.remark === '') return true
      try {
        const remark = JSON.parse(n.remark)
        // 排除 @ 通知（@ 通知归 mentions 页面管理）
        if (remark.type === 'mention') return false
        return true
      } catch (e) {
        // JSON 解析失败，保留显示
        return true
      }
    })
    unreadCount.value = noticeList.value.length
  } catch (e) {
    ElMessage.error('获取通知失败')
  } finally {
    loading.value = false
  }
}

const handleClick = (notice) => {
  const id = notice.noticeId || notice.id

  if (id) {
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    refreshBadge('sys', unreadCount.value)
    markRead(id).catch(() => { })
    console.log('=== notifications markRead 完成: noticeId=' + id)
    console.log('=== notifications 调用 refreshBadge: type=sys, count=' + unreadCount.value)
  }

  if (needsExpand(notice.noticeContent || notice.content || '')) return

  try {
    const remark = notice.remark ? JSON.parse(notice.remark) : null
    if (remark?.noteId) {
      let path = `/front/notes/detail/${remark.noteId}`
      if (remark.commentId) {
        path += `?focusComment=${remark.commentId}`
      }
      router.replace(path)
    }
  } catch (e) {
    // remark 解析失败，不跳转
  }
}

const toggleExpand = (notice) => {
  const id = notice.noticeId || notice.id
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

const displayContent = (notice) => {
  const content = notice.noticeContent || notice.content || ''
  if (needsExpand(content) && expandedId.value !== (notice.noticeId || notice.id)) {
    return content.substring(0, 50) + '...'
  }
  return content
}

const handleReadAll = () => {
  const ids = noticeList.value
    .map(n => n.noticeId || n.id)
    .filter(Boolean)
    .join(',')
  if (!ids) return
  unreadCount.value = 0
  refreshBadge('sys', 0)
  ElMessage.success('已全部标记为已读')
  markReadAll(ids).catch(() => { })
  console.log('=== notifications markReadAll 完成: ids=' + ids)
  console.log('=== notifications 调用 refreshBadge: type=sys, count=0')
}

const handleDelete = async (notice) => {
  const id = notice.noticeId || notice.id
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFrontNotice(id)
    noticeList.value = noticeList.value.filter(n => (n.noticeId || n.id) !== id)
    if (!notice.isRead) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      refreshBadge('sys', unreadCount.value)
    }
    ElMessage.success('删除成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleDeleteAll = async () => {
  if (noticeList.value.length === 0) return
  try {
    await ElMessageBox.confirm('确定要清空全部通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const ids = noticeList.value
      .map(n => n.noticeId || n.id)
      .filter(Boolean)
    await deleteFrontNoticeBatch(ids)
    noticeList.value = []
    unreadCount.value = 0
    refreshBadge('sys', 0)
    ElMessage.success('清空成功')
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('清空失败')
    }
  }
}

const CONTENT_THRESHOLD = 50

const hasMoreContent = (content) => {
  if (!content) return false
  return content.length > CONTENT_THRESHOLD
}

const needsExpand = (content) => {
  return hasMoreContent(content)
}

const relativeTime = (time) => {
  if (!time) return ''
  const now = Date.now()
  const diff = now - new Date(time).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchNotices()
})
</script>

<style scoped lang="scss">
.notifications-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .delete-all-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 5px 14px;
      color: #b45353;
      background: #fef2f2;
      border: 1px solid #e5d0d0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #f56c6c;
        color: #f56c6c;
      }
    }

    .read-all-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 5px 14px;
      color: #6b7280;
      background: #fff;
      border: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }
  }

  .notice-list {
    .notice-card {
      display: flex;
      gap: 12px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        .notice-actions {
          opacity: 1;
        }
      }

      .notice-left {
        width: 12px;
        flex-shrink: 0;
        padding-top: 6px;

        .unread-dot {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #409eff;
        }
      }

      &.unread .notice-title {
        font-weight: 600;
      }

      .notice-body {
        flex: 1;
        min-width: 0;

        .notice-title {
          font-size: 15px;
          color: #1f2937;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .notice-summary {
          font-size: 14px;
          line-height: 1.6;
          color: #6b7280;
          word-break: break-word;
          white-space: pre-wrap;
          margin-bottom: 4px;

          &.expanded {
            white-space: normal;
          }
        }

        .notice-expand-btn {
          font-size: 12px;
          color: #409eff;
          margin-bottom: 8px;
          cursor: pointer;
          user-select: none;

          &:hover {
            color: #66b1ff;
          }
        }

        .notice-time {
          font-size: 12px;
          color: #9ca3af;
        }
      }

      .notice-actions {
        display: flex;
        align-items: flex-start;
        opacity: 0;
        transition: opacity 0.2s;

        .delete-btn {
          padding: 4px;
          color: #9ca3af;
          background: transparent;
          border: none;
          transition: all 0.2s;

          &:hover {
            color: #b45353;
            background: #fef2f2;
          }
        }
      }
    }
  }
}
</style>
