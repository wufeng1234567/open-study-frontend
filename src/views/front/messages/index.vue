<template>
  <div class="messages-layout">
    <div class="messages-sidebar">
      <div class="sidebar-header">
        <el-button text :icon="ArrowLeft" @click="$router.go(-1)" class="back-btn" />
        <span class="sidebar-title">消息中心</span>
      </div>
      <el-menu :default-active="activeMenu" class="sidebar-menu" @select="handleSelect">
        <el-menu-item index="/front/messages/notifications">
          <el-icon>
            <Bell />
          </el-icon>
          <span>系统通知</span>
          <el-badge v-if="sysUnreadCount > 0" :value="sysUnreadCount" :max="99" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/front/messages/mentions">
          <el-icon>
            <ChatDotSquare />
          </el-icon>
          <span>@我</span>
          <el-badge v-if="mentionUnreadCount > 0" :value="mentionUnreadCount" :max="99" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/front/messages/chats">
          <el-icon>
            <Message />
          </el-icon>
          <span>私信</span>
          <el-badge v-if="chatUnreadCount > 0" :value="chatUnreadCount" :max="99" class="menu-badge" />
        </el-menu-item>
      </el-menu>
    </div>
    <div class="messages-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Bell, ChatDotSquare, Message } from '@element-plus/icons-vue'
import { listAllNotice } from '@/api/system/notice'
import { getUnreadCount as getChatUnreadCount } from '@/api/system/chat'

const router = useRouter()
const route = useRoute()

const sysUnreadCount = ref(0)
const mentionUnreadCount = ref(0)
const chatUnreadCount = ref(0)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/front/messages/notifications')) return '/front/messages/notifications'
  if (path.startsWith('/front/messages/mentions')) return '/front/messages/mentions'
  if (path.startsWith('/front/messages/chats')) return '/front/messages/chats'
  return '/front/messages/notifications'
})

const handleSelect = (index) => {
  router.push(index)
}

const fetchUnreadCounts = async () => {
  try {
    const res = await listAllNotice()
    const all = res.data || []
    console.log('=== fetchUnreadCounts 返回数据 ===')
    console.log('总条数:', all.length)
    all.forEach(n => {
      console.log(`  noticeId=${n.noticeId}, isRead=${n.isRead}, remark=${n.remark}`)
    })
    let sysCount = 0
    let mentionCount = 0
    for (const n of all) {
      if (n.isRead) continue
      try {
        const remark = n.remark ? JSON.parse(n.remark) : null
        if (remark?.type === 'mention') {
          mentionCount++
        } else {
          sysCount++
        }
      } catch (e) {
        sysCount++
      }
    }
    sysUnreadCount.value = sysCount
    mentionUnreadCount.value = mentionCount
  } catch (e) {
    // ignore
  }

  try {
    const chatRes = await getChatUnreadCount()
    chatUnreadCount.value = chatRes.data || 0
  } catch (e) {
    // ignore
  }
}

const refreshBadge = (type, count) => {
  console.log('=== refreshBadge 被调用: type=' + type + ', count=' + count)
  if (type === 'sys') {
    sysUnreadCount.value = Math.max(0, count)
  } else if (type === 'mention') {
    mentionUnreadCount.value = Math.max(0, count)
  } else if (type === 'chat') {
    chatUnreadCount.value = Math.max(0, count)
  }
}

provide('refreshBadge', refreshBadge)

onMounted(() => {
  fetchUnreadCounts()
})

watch(() => route.path, () => {
  fetchUnreadCounts()
})
</script>

<style scoped lang="scss">
.messages-layout {
  display: flex;
  gap: 12px;

  .messages-sidebar {
    width: 160px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 12px;
    background: #ffffff;
    overflow-y: auto;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .back-btn {
      font-size: 18px;
      color: #6b7280;
      padding: 4px;

      &:hover {
        color: #4b5563;
      }
    }

    .sidebar-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .sidebar-menu {
    border-right: none;
    background: transparent;

    .el-menu-item {
      position: relative;
      height: 44px;
      line-height: 44px;
      border-radius: 8px;
      margin-bottom: 4px;
      color: #6b7280;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f7fa;
        color: #6b7280;
      }

      &.is-active {
        background: #f9fafb;
        color: #4b5563;
        border-left: 2px solid #6b7280;
        font-weight: 600;
      }

      .el-icon {
        font-size: 18px;
        margin-right: 8px;
      }

      span {
        font-size: 14px;
      }
    }

    .menu-badge {
      margin-left: auto;
      transform: translate(6px, -8px);

      :deep(.el-badge__content) {
        font-size: 11px;
        height: 18px;
        line-height: 18px;
        padding: 0 5px;
      }
    }
  }
}

.messages-content {
  flex: 1;
  min-width: 0;
}
</style>
