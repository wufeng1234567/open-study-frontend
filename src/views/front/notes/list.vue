<template>
  <div class="notes-list-container">
    <div class="header">
      <div class="header-left"></div>
      <h2 class="header-title">📝 学习分享</h2>
      <div class="header-right">
        <el-button class="refresh-btn" :icon="Refresh" @click="fetchNotes">刷新</el-button>
        <el-button class="create-btn" @click="goEditor">
          + 写笔记
        </el-button>
      </div>
    </div>

    <div class="content-layout">
      <div class="left-column">
        <div class="search-bar">
          <div class="search-wrapper">
            <el-input ref="searchInputRef" v-model="searchKeyword" placeholder="搜索笔记..." clearable @input="handleSearch"
              @focus="handleFocus" @blur="handleBlur" class="search-input">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <div v-show="showSearchHistory && searchHistory.length > 0" class="search-history-dropdown"
              @mousedown.prevent>
              <div class="history-header">
                <span class="history-title">搜索历史</span>
                <span class="clear-history" @click="clearHistory">清空</span>
              </div>
              <div class="history-tags">
                <div v-for="(keyword, index) in searchHistory" :key="index" class="history-tag-item"
                  @click="selectHistory(keyword)">
                  <span class="tag-text">{{ keyword }}</span>
                  <span class="tag-close" @click.stop="removeHistory(keyword)">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="filter-area">
          <div class="filter-row">
            <div class="category-tags">
              <el-tag class="tag-item" :class="{ active: selectedPublicSectionId === null }"
                @click="selectSection(null)">全部</el-tag>
              <el-tag v-for="section in publicSectionList" :key="section.id" class="tag-item"
                :class="{ active: selectedPublicSectionId === section.id }" @click="selectSection(section.id)">{{
                  section.name
                }}</el-tag>
            </div>
            <el-select v-model="sortBy" class="sort-select" size="small" @change="handleSortChange">
              <el-option label="最新发布" value="create_time" />
              <el-option label="最早发布" value="create_time_asc" />
              <el-option label="内容最长" value="content_length" />
              <el-option label="最多点击" value="click_count" />
            </el-select>
          </div>

          <div class="filter-row">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" class="date-picker" size="small" value-format="YYYY-MM-DD"
              @change="handleDateChange" />
          </div>

          <div v-if="hotTags.length > 0" class="filter-row tags-row">
            <div class="hot-tags">
              <el-tag v-if="selectedTag" class="tag-item active" closable @close="selectTag('')">标签：{{ selectedTag
                }}</el-tag>
              <el-tag v-for="tag in hotTags" :key="tag" class="tag-item" :class="{ active: selectedTag === tag }"
                @click="selectTag(tag)">{{ tag }}</el-tag>
            </div>
          </div>
        </div>

        <div v-loading="loading" class="notes-list">
          <div v-for="note in notesList" :key="note.id" class="note-item" @click="goDetail(note.id)">
            <div class="note-avatar">
              <el-avatar :size="44" :src="getAvatarUrl(note.avatar)" class="user-link"
                @click.stop="goToProfile(note.userId)" />
            </div>
            <div class="note-content">
              <h3 class="note-title">{{ note.title }}</h3>
              <p class="note-summary">{{ getSummary(note.markdownContent) }}</p>
              <div class="note-meta">
                <span class="author user-link" @click.stop="goToProfile(note.userId)">{{ note.authorName || '匿名用户'
                }}</span>
                <span class="separator">·</span>
                <span class="time">{{ formatTime(note.createTime) }}</span>
                <template v-if="note.tags">
                  <span class="separator">·</span>
                  <span class="tags">
                    <el-tag v-for="tag in getTagList(note.tags).slice(0, 3)" :key="tag" size="small"
                      class="clickable-tag" @click.stop="selectTag(tag)">{{ tag }}</el-tag>
                  </span>
                </template>
              </div>
            </div>
            <div v-if="note.userId === userStore.id" class="note-actions">
              <el-button class="edit-btn" :icon="Edit" text size="small" @click.stop="goEditor(note.id)">
                编辑
              </el-button>
            </div>
          </div>

          <el-empty v-if="!loading && notesList.length === 0"
            :description="searchKeyword ? '没有找到相关笔记' : '还没有人分享笔记，快来写一篇吧'" />
        </div>

        <div v-if="total > 0" class="pagination">
          <el-pagination v-model:current-page="pageNum" :page-size="pageSize" :total="total" layout="prev, pager, next"
            @current-change="handlePageChange" />
        </div>
      </div>

      <div class="right-column">
        <div class="ranking-card">
          <div class="ranking-header">
            <span class="ranking-title">🔥 热榜</span>
            <div class="ranking-tabs">
              <span :class="{ active: rankingPeriod === 'today' }"
                @click="rankingPeriod = 'today'; fetchRanking()">今日</span>
              <span :class="{ active: rankingPeriod === 'week' }"
                @click="rankingPeriod = 'week'; fetchRanking()">周榜</span>
            </div>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in rankingList" :key="item.id" class="ranking-item" @click="goDetail(item.id)">
              <div class="ranking-rank">
                <span v-if="index === 0" class="medal">🥇</span>
                <span v-else-if="index === 1" class="medal">🥈</span>
                <span v-else-if="index === 2" class="medal">🥉</span>
                <span v-else class="rank-num">{{ index + 1 }}</span>
              </div>
              <div class="ranking-title-text">{{ item.title }}</div>
              <div class="ranking-clicks">{{ item.clickCount || 0 }}</div>
            </div>
            <el-empty v-if="rankingList.length === 0" description="暂无数据" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="FrontNotesList">
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Edit, Refresh, Close } from '@element-plus/icons-vue'
import { listPublicNotes, getRanking } from '@/api/notes/public'
import { getPublicSections } from '@/api/notes/publicSection'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import useUserStore from '@/store/modules/user'

import defAva from '@/assets/images/profile.jpg'
const cacheStore = useFrontPageCacheStore()
const userStore = useUserStore()
const router = useRouter()

const loading = ref(false)
const notesList = ref([])
const searchKeyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const publicSectionList = ref([])
const selectedPublicSectionId = ref(null)
const sortBy = ref('create_time')
const sortOrder = ref('desc')
const dateRange = ref(null)
const rankingList = ref([])
const rankingPeriod = ref('today')
const selectedTag = ref('')
const showSearchHistory = ref(false)
const searchHistory = ref([])
const searchInputRef = ref(null)

let blurTimer = null

const handleFocus = () => {
  clearTimeout(blurTimer)
  if (searchHistory.value.length > 0) {
    showSearchHistory.value = true
  }
}

const handleBlur = () => {
  blurTimer = setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

const HISTORY_KEY = 'search_history_notes'
const MAX_HISTORY = 10

const loadHistory = () => {
  const history = localStorage.getItem(HISTORY_KEY)
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

const saveHistory = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory.value))
}

const addHistory = (keyword) => {
  if (!keyword || !keyword.trim()) return
  const trimmed = keyword.trim()
  const index = searchHistory.value.indexOf(trimmed)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  searchHistory.value.unshift(trimmed)
  if (searchHistory.value.length > MAX_HISTORY) {
    searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY)
  }
  saveHistory()
}

const removeHistory = (keyword) => {
  const index = searchHistory.value.indexOf(keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
    saveHistory()
  }
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
  showSearchHistory.value = false
}

const selectHistory = (keyword) => {
  searchKeyword.value = keyword
  showSearchHistory.value = false
  fetchNotes()
}

let searchTimer = null

const baseUrl = import.meta.env.VITE_APP_BASE_API || ''

const getAvatarUrl = (avatar) => {
  if (!avatar) return defAva
  if (avatar.startsWith('http')) return avatar
  return baseUrl + avatar
}

const getSummary = (content) => {
  if (!content) return ''
  let plainText = content

  plainText = plainText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  plainText = plainText.replace(codeBlockRegex, (match, lang, code) => {
    return code.trim()
  })

  plainText = plainText.replace(/`{1,3}[^`\n]*?`{1,3}/g, '')

  plainText = plainText
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>/g, '')
    .replace(/-/g, '')
    .replace(/\n/g, ' ')
    .trim()
  if (plainText.length > 200) {
    return plainText.substring(0, 200) + '...'
  }
  return plainText
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTags = (tags) => {
  if (!tags) return ''
  if (typeof tags === 'string') {
    return tags.split(',').slice(0, 3).join('、')
  }
  return tags.slice(0, 3).join('、')
}

const getTagList = (tags) => {
  if (!tags) return []
  if (typeof tags === 'string') {
    return tags.split(',').filter(t => t.trim())
  }
  return tags
}

const hotTags = computed(() => {
  const tagMap = new Map()
  notesList.value.forEach(note => {
    const tags = getTagList(note.tags)
    tags.forEach(t => {
      tagMap.set(t, (tagMap.get(t) || 0) + 1)
    })
  })
  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)
})

const getSortParams = () => {
  if (sortBy.value === 'create_time_asc') {
    return { sortBy: 'create_time', order: 'asc' }
  }
  return { sortBy: sortBy.value, order: sortOrder.value }
}

const getFilterTime = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    return {
      startTime: dateRange.value[0] + ' 00:00:00',
      endTime: dateRange.value[1] + ' 23:59:59'
    }
  }
  return {}
}

const fetchNotes = async () => {
  loading.value = true
  try {
    const sortParams = getSortParams()
    const timeParams = getFilterTime()
    const keyword = selectedTag.value ? selectedTag.value : searchKeyword.value
    const res = await listPublicNotes({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword,
      publicSectionId: selectedPublicSectionId.value,
      ...sortParams,
      ...timeParams
    })
    notesList.value = res.rows || []
    total.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取笔记列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchRanking = async () => {
  try {
    const res = await getRanking(rankingPeriod.value)
    rankingList.value = res.data || []
  } catch (error) {
    console.error('获取热榜失败:', error)
    rankingList.value = []
  }
}
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (searchKeyword.value && searchKeyword.value.trim()) {
      addHistory(searchKeyword.value)
    }
    showSearchHistory.value = false
    pageNum.value = 1
    fetchNotes()
  }, 300)
}

const handlePageChange = (page) => {
  pageNum.value = page
  fetchNotes()
}

const selectSection = (id) => {
  selectedPublicSectionId.value = id
  pageNum.value = 1
  fetchNotes()
}

const handleSortChange = () => {
  pageNum.value = 1
  fetchNotes()
}

const handleDateChange = () => {
  pageNum.value = 1
  fetchNotes()
}

const selectTag = (tag) => {
  selectedTag.value = tag
  pageNum.value = 1
  fetchNotes()
}

const fetchPublicSections = async () => {
  try {
    const res = await getPublicSections()
    if (res.code === 200) {
      publicSectionList.value = res.data || []
    }
  } catch (error) {
    console.error('获取公开分区失败:', error)
  }
}

const goDetail = (id) => {
  cacheStore.setLastVisited('notes', `detail/${id}`)
  router.push(`/front/notes/detail/${id}`)
}

const goToProfile = (userId) => {
  if (!userId) return
  router.push(`/front/profile/${userId}`)
}

const goEditor = (id) => {
  cacheStore.setLastVisited('notes', 'editor')
  if (id) {
    router.push(`/front/notes/editor?id=${id}`)
  } else {
    router.push('/front/notes/editor')
  }
}

onMounted(() => {
  loadHistory()
  fetchPublicSections()
  fetchNotes()
  fetchRanking()
})

onActivated(() => {
  fetchRanking()
})
</script>

<style lang="scss">
.notes-list-container {
  padding: 24px;

  .header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    margin-bottom: 28px;
  }

  .header-left {
    justify-self: start;
  }

  .header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    text-align: center;
  }

  .header-right {
    justify-self: end;
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    .refresh-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 8px 16px;
      height: auto;
      min-height: 38px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        background: #fff;
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .create-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 8px 20px;
      height: auto;
      min-height: 38px;
      letter-spacing: 0.01em;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        background: #fff;
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .content-layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .left-column {
    flex: 1;
    min-width: 0;
  }

  .right-column {
    width: 280px;
    flex-shrink: 0;
  }

  .search-bar {
    margin-bottom: 20px;
    position: relative;

    .search-wrapper {
      position: relative;
    }

    .search-input {
      .el-input__wrapper {
        border-radius: 8px;
        box-shadow: 0 0 0 1px #e5e7eb;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          box-shadow: 0 0 0 1px #d1d5db;
        }

        &.is-focus {
          box-shadow: 0 0 0 1px #b3b3b3;
        }
      }
    }

    .search-history-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 400px;
      margin-top: 8px;
      padding: 16px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      z-index: 100;

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .history-title {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
        }

        .clear-history {
          font-size: 12px;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: #6b7280;
          }
        }
      }

      .history-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .history-tag-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            background: #e5e7eb;
            border-color: #d1d5db;
            color: #4b5563;
          }

          .tag-text {
            color: #6b7280;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .tag-close {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            transition: color 0.2s;

            &:hover {
              color: #4b5563;
            }

            .el-icon {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  .filter-area {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      .category-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        flex: 1;

        .tag-item {
          cursor: pointer;
          border-radius: 6px;
          padding: 0 12px;
          height: 30px;
          line-height: 30px;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #f3f4f6;
          border-color: #e5e7eb;
          color: #6b7280;

          &:hover {
            background: #e5e7eb;
            border-color: #d1d5db;
          }

          &.active {
            background: #e5e7eb;
            border-color: #d1d5db;
            color: #1f2937;
            font-weight: 600;
          }
        }
      }

      .sort-select {
        width: 140px;
        flex-shrink: 0;

        .el-input__wrapper {
          border-radius: 8px;
          box-shadow: 0 0 0 1px #e5e7eb;

          &:hover {
            box-shadow: 0 0 0 1px #d1d5db;
          }

          &.is-focus {
            box-shadow: 0 0 0 1px #b3b3b3;
          }
        }
      }

      .date-picker {
        width: 260px;
        flex-shrink: 0;

        .el-input__wrapper {
          border-radius: 8px;
          box-shadow: 0 0 0 1px #e5e7eb;

          &:hover {
            box-shadow: 0 0 0 1px #d1d5db;
          }

          &.is-focus {
            box-shadow: 0 0 0 1px #b3b3b3;
          }
        }
      }
    }
  }

  .tags-row {
    .hot-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .tag-item {
        cursor: pointer;
        border-radius: 6px;
        padding: 0 10px;
        height: 26px;
        line-height: 26px;
        font-size: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: #f3f4f6;
        border-color: #e5e7eb;
        color: #6b7280;

        &:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        &.active {
          background: #e5e7eb;
          border-color: #d1d5db;
          color: #1f2937;
          font-weight: 600;
        }
      }
    }
  }

  .notes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;

    .el-pager li {
      border-radius: 6px;

      &.is-active {
        background: #f3f4f6;
        color: #1f2937;
      }
    }
  }
}

.right-column {
  width: 280px;
  flex-shrink: 0;
}

.note-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }

  .note-avatar {
    flex-shrink: 0;

    .el-avatar {
      background: #f3f4f6;
      color: #6b7280;
      font-weight: 600;
    }
  }

  .note-content {
    flex: 1;
    min-width: 0;

    .note-title {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .note-summary {
      margin: 0 0 10px 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .note-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;

      .separator {
        color: #d1d5db;
      }

      .tags {
        color: #947a4a;

        .clickable-tag {
          cursor: pointer;
          border-radius: 4px;
          padding: 0 6px;
          height: 20px;
          line-height: 20px;
          font-size: 11px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #fefce8;
          border-color: #e5e0c0;
          color: #947a4a;
          margin: 0 2px;

          &:hover {
            background: #fef3c7;
            border-color: #d4c89a;
            color: #7a6239;
          }
        }
      }
    }
  }

  .note-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: 12px;

    .edit-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 6px 14px;
      color: #6b7280;
      background: #fff;
      border: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: #fff;
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.ranking-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  position: sticky;
  top: 24px;

  .ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;

    .ranking-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .ranking-tabs {
      display: flex;
      gap: 4px;

      span {
        cursor: pointer;
        padding: 2px 10px;
        border-radius: 6px;
        font-size: 12px;
        color: #9ca3af;
        background: #f3f4f6;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          color: #6b7280;
        }

        &.active {
          background: #e5e7eb;
          color: #1f2937;
          font-weight: 600;
        }
      }
    }
  }

  .ranking-list {
    max-height: 480px;
    overflow-y: auto;

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        padding-left: 6px;
      }

      &:last-child {
        border-bottom: none;
      }

      .ranking-rank {
        width: 30px;
        text-align: center;
        flex-shrink: 0;

        .medal {
          font-size: 18px;
        }

        .rank-num {
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
        }
      }

      .ranking-title-text {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        font-weight: 500;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ranking-clicks {
        font-size: 12px;
        color: #9ca3af;
        flex-shrink: 0;
      }
    }
  }
}

.el-empty__description {
  color: #9ca3af;
}

.user-link {
  cursor: pointer;
  transition: all 0.2s ease;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover {
    color: #409eff;
    border-bottom: 1px dashed #409eff;
  }
}

.user-link.el-avatar {
  border-bottom: none;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  }
}
</style>
