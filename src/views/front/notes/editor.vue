<template>
  <div class="notes-editor-container">
    <div class="header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" text class="back-btn">
          返回笔记
        </el-button>
      </div>
      <h2 class="header-title">{{ noteTitle ? noteTitle + ' - ' : '' }}{{ editingNoteId ? '编辑笔记' : '写笔记' }}</h2>
      <div class="header-right">
        <el-button class="header-copy-btn" @click="copyNote" text>
          📋 复制全文
        </el-button>
        <el-button class="header-export-btn" @click="exportNote">
          导出 MD
        </el-button>
      </div>
    </div>

    <div class="editor-body" ref="editorBodyRef" @click="handleBodyClick">
      <div class="editor-main">
        <TiptapEditor ref="tiptapEditorRef" v-model="editorHtmlContent" placeholder="开始写下你的笔记...">
        </TiptapEditor>
      </div>
      <div class="editor-footer">
        <el-button class="footer-cancel-btn" @click="goBack">取消</el-button>
        <el-button class="footer-save-btn" :loading="saving" @click="handlePublish">
          {{ editingNoteId ? '保存' : '发布' }}
        </el-button>
      </div>

      <div class="sidebar-overlay" v-if="!isSidebarCollapsed" @click.stop="isSidebarCollapsed = true"></div>

      <div class="meta-sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <button class="sidebar-toggle" @click.stop="isSidebarCollapsed = !isSidebarCollapsed">
          <svg v-if="isSidebarCollapsed" viewBox="0 0 24 24">
            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z" />
          </svg>
        </button>

        <div class="sidebar-scroll">
          <div class="sidebar-content" v-show="!isSidebarCollapsed">
            <div class="sidebar-section">
              <label class="sidebar-label">笔记标题</label>
              <el-input v-model="noteTitle" placeholder="请输入笔记标题..." class="sidebar-input" maxlength="100"
                show-word-limit />
            </div>

            <div class="sidebar-section">
              <label class="sidebar-label">笔记分类</label>
              <el-select v-model="selectedCategoryId" placeholder="请选择或输入新分类" allow-create filterable
                default-first-option class="sidebar-select">
                <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </div>

            <div class="sidebar-section">
              <label class="sidebar-label">笔记标签</label>
              <el-select v-model="selectedTags" multiple filterable allow-create default-first-option
                placeholder="输入标签，回车添加" class="sidebar-select">
              </el-select>
            </div>

            <div v-if="isPublic === 1" class="sidebar-section">
              <label class="sidebar-label">公开分区</label>
              <el-select v-model="selectedPublicSectionId" placeholder="请选择公开分区" class="sidebar-select">
                <el-option v-for="section in publicSectionList" :key="section.id" :label="section.name"
                  :value="section.id" />
              </el-select>
            </div>

            <div class="sidebar-section">
              <label class="sidebar-label">关联题库</label>
              <el-select v-model="selectedBankIds" multiple collapse-tags collapse-tags-tooltip
                placeholder="请选择关联题库（可多选）" class="sidebar-select">
                <el-option v-for="bank in bankList" :key="bank.id" :label="bank.bankName" :value="bank.id" />
              </el-select>
              <div v-if="selectedBankIds.length > 0" class="selected-banks-chips">
                <el-tag v-for="bankId in selectedBankIds" :key="bankId" size="small" closable
                  @close="removeBank(bankId)">
                  {{ getBankName(bankId) }}
                </el-tag>
              </div>
            </div>

            <div class="sidebar-section">
              <label class="sidebar-label">可见性</label>
              <el-radio-group v-model="isPublic" class="visibility-group">
                <el-radio :label="1" class="visibility-radio">公开</el-radio>
                <el-radio :label="0" class="visibility-radio">私有</el-radio>
              </el-radio-group>
            </div>

            <div class="sidebar-actions">
              <el-button class="save-btn" :loading="saving" @click="handlePublish">
                {{ editingNoteId ? '保存' : '发布' }}
              </el-button>
              <el-button class="cancel-btn" @click="goBack">
                取消
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动按钮 -->
      <ScrollButton :bottom="40" :right="20" />
    </div>
  </div>
</template>

<script setup name="FrontNotesEditor">
import { ref, onMounted, onActivated, onDeactivated, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { marked } from 'marked'
import TurndownService from 'turndown'
import TiptapEditor from '@/components/TiptapEditor/index.vue'
import ScrollButton from '@/components/ScrollButton/ScrollButton.vue'
import { addNote, updateNote, getNote } from '@/api/notes/note'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import useUserStore from '@/store/modules/user'
import { getAllNoteCategory, addNoteCategory } from '@/api/noteCategory/noteCategory'
import { getPublicSections } from '@/api/notes/publicSection'
import { listMyQuestionBank } from '@/api/questionBank/questionBank'
import { addNoteQuestionBank, getNoteQuestionBanksByNoteId } from '@/api/noteQuestionBank/noteQuestionBank'

const cacheStore = useFrontPageCacheStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

const editingNoteId = ref(null)

const noteTitle = ref('')
const markdownContent = ref('')
const editorHtmlContent = ref('')
const saving = ref(false)
const isPublic = ref(1)
const categoryList = ref([])
const selectedCategoryId = ref(null)
const selectedTags = ref([])
const publicSectionList = ref([])
const selectedPublicSectionId = ref(null)
const bankList = ref([])
const selectedBankIds = ref([])
const isSidebarCollapsed = ref(true)

const tiptapEditorRef = ref(null)
const editorBodyRef = ref(null)

let lastLoadedId = null
let lastLoadedBankId = null

const getBankName = (bankId) => {
  const bank = bankList.value.find(b => b.id === bankId)
  return bank ? bank.bankName : `题库${bankId}`
}

const handleBodyClick = (event) => {
  if (!isSidebarCollapsed.value) {
    const sidebar = document.querySelector('.meta-sidebar')
    if (sidebar && !sidebar.contains(event.target)) {
      isSidebarCollapsed.value = true
    }
  }
}

const removeBank = (bankId) => {
  selectedBankIds.value = selectedBankIds.value.filter(id => id !== bankId)
}

const saveNoteQuestionBanks = async (noteId) => {
  if (selectedBankIds.value.length === 0) return
  try {
    const existingRes = await getNoteQuestionBanksByNoteId(noteId)
    if (existingRes.code !== 200) return

    const existingBankIds = (existingRes.data || []).map(item => item.questionBankId)
    const newBankIds = selectedBankIds.value.filter(id => !existingBankIds.includes(id))

    for (const bankId of newBankIds) {
      await addNoteQuestionBank({
        noteId: noteId,
        questionBankId: bankId,
        userId: userStore.id
      })
    }
  } catch (error) {
    console.error('保存笔记题库关联失败:', error)
  }
}

const loadNoteQuestionBanks = async (noteId) => {
  try {
    const res = await getNoteQuestionBanksByNoteId(noteId)
    if (res.code === 200 && res.data) {
      selectedBankIds.value = res.data.map(item => item.questionBankId) || []
    }
  } catch (error) {
    console.error('加载笔记关联题库失败:', error)
  }
}

const syncEditorMode = () => {
  const id = route.query.id
  const numId = id ? Number(id) : null

  if (numId) {
    if (numId === lastLoadedId) return
    lastLoadedId = numId
    editingNoteId.value = numId
    loadNoteData(id)
  } else {
    if (!editingNoteId.value) return
    lastLoadedId = null
    editingNoteId.value = null
    noteTitle.value = ''
    markdownContent.value = ''
    editorHtmlContent.value = ''
    isPublic.value = 1
    selectedCategoryId.value = null
    selectedTags.value = []
    selectedPublicSectionId.value = null
    loadDraft()
  }
}

const DRAFT_KEY = 'note_draft'

const loadDraft = () => {
  try {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      const parsedDraft = JSON.parse(draft)
      noteTitle.value = parsedDraft.title || ''
      const md = parsedDraft.content || ''
      markdownContent.value = md
      editorHtmlContent.value = marked.parse(md)
      isPublic.value = parsedDraft.isPublic || 1
      selectedCategoryId.value = parsedDraft.categoryId || null
      selectedTags.value = parsedDraft.tags || []
      selectedPublicSectionId.value = parsedDraft.publicSectionId || null
      nextTick(() => {
        if (tiptapEditorRef.value) {
          tiptapEditorRef.value.setContent(editorHtmlContent.value)
        }
      })
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

const saveDraft = () => {
  try {
    const md = editorHtmlContent.value ? turndownService.turndown(editorHtmlContent.value) : ''
    const draft = {
      title: noteTitle.value,
      content: md,
      isPublic: isPublic.value,
      categoryId: selectedCategoryId.value,
      tags: selectedTags.value,
      publicSectionId: selectedPublicSectionId.value,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch (error) {
    console.error('保存草稿失败:', error)
  }
}

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch (error) {
    console.error('清除草稿失败:', error)
  }
}

const goBack = () => {
  saveDraft()
  if (editingNoteId.value) {
    router.push(`/front/notes/detail/${editingNoteId.value}`)
  } else {
    router.push('/front/notes/list')
  }
}

const exportNote = () => {
  const title = noteTitle.value || '笔记'
  let mdContent = markdownContent.value
  if (!mdContent && editorHtmlContent.value) {
    mdContent = turndownService.turndown(editorHtmlContent.value)
  }
  const content = `# ${title}\n\n${mdContent || ''}`
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('笔记已导出为 Markdown 文件')
}

const loadCategories = async () => {
  const res = await getAllNoteCategory({ userId: userStore.id })
  if (res.code === 200) {
    categoryList.value = res.data || []
  }
}

const loadPublicSections = async () => {
  try {
    const res = await getPublicSections()
    if (res.code === 200) {
      publicSectionList.value = res.data || []
    }
  } catch (error) {
    console.error('获取公开分区失败:', error)
  }
}

const loadQuestionBanks = async () => {
  try {
    const res = await listMyQuestionBank()
    if (res.code === 200) {
      bankList.value = res.data || []
    }
  } catch (error) {
    console.error('获取题库列表失败:', error)
  }
}

const loadNoteData = async (id) => {
  try {
    const res = await getNote(id)
    if (res.code === 200 && res.data) {
      const note = res.data
      noteTitle.value = note.title || ''
      markdownContent.value = note.markdownContent || ''
      editorHtmlContent.value = marked.parse(note.markdownContent || '')
      isPublic.value = note.isPublic ?? 1
      selectedCategoryId.value = note.categoryId || null
      selectedTags.value = typeof note.tags === 'string'
        ? note.tags.split(',').filter(t => t.trim())
        : (note.tags || [])
      selectedPublicSectionId.value = note.publicSectionId || null
      await loadNoteQuestionBanks(id)
      await nextTick()
      if (tiptapEditorRef.value) {
        tiptapEditorRef.value.setContent(editorHtmlContent.value)
      }
    }
  } catch (error) {
    ElMessage.error('加载笔记数据失败')
    console.error(error)
  }
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadPublicSections(),
    loadQuestionBanks()
  ])
  syncEditorMode()

  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

onActivated(() => {
  nextTick(() => {
    syncEditorMode()
  })
})

onDeactivated(() => {
})

watch(selectedCategoryId, async (newVal) => {
  if (typeof newVal === 'string' && newVal.trim()) {
    try {
      const res = await addNoteCategory({ name: newVal.trim(), userId: userStore.id })
      if (res.code === 200 && res.data) {
        selectedCategoryId.value = res.data.id || res.data
        await loadCategories()
      }
    } catch (error) {
      ElMessage.error('创建分类失败')
      selectedCategoryId.value = null
    }
  }
})

watch(() => route.query.id, () => {
  syncEditorMode()
})

let draftTimer = null
watch([noteTitle, editorHtmlContent, isPublic, selectedCategoryId, selectedTags], () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    saveDraft()
  }, 500)
}, { deep: true })

const handleGlobalKeydown = (event) => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    handleSave()
  }
}

const copyNote = () => {
  const content = markdownContent.value || ''
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const handleSave = async () => {
  if (!noteTitle.value.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }

  const md = editorHtmlContent.value ? turndownService.turndown(editorHtmlContent.value) : ''
  if (!md.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }

  const userId = userStore.id
  if (!userId) {
    ElMessage.error('请重新登录')
    return
  }

  saving.value = true
  try {
    const noteData = {
      title: noteTitle.value.trim(),
      markdownContent: md,
      isPublic: isPublic.value,
      userId: userId,
      categoryId: selectedCategoryId.value || null,
      tags: selectedTags.value.join(','),
      publicSectionId: selectedPublicSectionId.value || null
    }

    if (editingNoteId.value) {
      await updateNote({ id: editingNoteId.value, ...noteData })
      ElMessage.success('保存成功')
      if (editingNoteId.value && selectedBankIds.value.length > 0) {
        await saveNoteQuestionBanks(editingNoteId.value)
      }
    } else {
      ElMessage.warning('请先发布笔记')
    }

    clearDraft()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handlePublish = async () => {
  if (!noteTitle.value.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }

  const md = editorHtmlContent.value ? turndownService.turndown(editorHtmlContent.value) : ''
  if (!md.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }
  if (!selectedCategoryId.value) {
    ElMessage.warning('请选择一个笔记分类')
    return
  }
  if (isPublic.value === 1 && !selectedPublicSectionId.value) {
    ElMessage.warning('请选择一个公开分区')
    return
  }

  const userId = userStore.id
  if (!userId) {
    ElMessage.error('请重新登录')
    return
  }

  saving.value = true
  try {
    const noteData = {
      title: noteTitle.value.trim(),
      markdownContent: md,
      isPublic: isPublic.value,
      userId: userId,
      categoryId: selectedCategoryId.value || null,
      tags: selectedTags.value.join(','),
      publicSectionId: selectedPublicSectionId.value || null
    }

    let savedNoteId = editingNoteId.value

    if (editingNoteId.value) {
      await updateNote({ id: editingNoteId.value, ...noteData })
      ElMessage.success('保存成功')
    } else {
      const addRes = await addNote(noteData)
      if (addRes.code === 200 && addRes.data) {
        savedNoteId = typeof addRes.data === 'object' ? addRes.data.id : addRes.data
      }
      ElMessage.success('发布成功')
    }

    if (savedNoteId && selectedBankIds.value.length > 0) {
      await saveNoteQuestionBanks(savedNoteId)
    }

    clearDraft()
    editingNoteId.value = null
    cacheStore.setLastVisited('notes', 'list')
    router.push('/front/notes/list')
  } catch (error) {
    ElMessage.error(editingNoteId.value ? '保存失败' : '发布失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
.notes-editor-container {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    padding: 12px 24px;
    flex-shrink: 0;
  }

  .header-left {
    justify-self: start;
  }

  .back-btn {
    width: fit-content;
    border-radius: 8px;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: #4b5563;
      background: #f3f4f6;
    }
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
    gap: 8px;
    align-items: center;

    .header-export-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 7px 16px;
      color: #6b7280;
      background: #fff;
      border: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;

      &:hover {
        background: #fff;
        border-color: #d1d5db;
        color: #4b5563;
        transform: translateY(-2px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .editor-body {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .editor-main {
    flex: 1;
    min-width: 0;
    border-radius: 16px;
    overflow: hidden;
  }

  .editor-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px 0 0;
    flex-shrink: 0;

    .footer-cancel-btn,
    .footer-save-btn {
      border-radius: 8px;
      font-weight: 500;
      padding: 8px 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .footer-cancel-btn {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #d1d5db;
        color: #4b5563;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
    }

    .footer-save-btn {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #d1d5db;
        color: #4b5563;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
    }

    .footer-copy-btn {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
      }
    }
  }

  .sidebar-overlay {
    display: none;

    @media (max-width: 768px) {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9;
    }
  }

  .meta-sidebar {
    position: absolute;
    left: 16px;
    top: 0;
    width: 280px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    max-height: calc(100vh - 140px);
    overflow: hidden;

    &.collapsed {
      width: 48px;
      padding: 8px 8px;
      max-height: none;
      overflow: visible;

      .sidebar-content {
        display: none;
      }

      .sidebar-scroll {
        display: none;
      }

      .sidebar-toggle {
        position: static;
        margin: 0 auto;
        width: 32px;
        height: 24px;
        margin-bottom: 0;

        svg {
          width: 18px;
          height: 18px;
        }
      }
    }

    .sidebar-scroll {
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      padding-bottom: 12px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;

        &:hover {
          background: #9ca3af;
        }
      }
    }

    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 24px;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      margin-bottom: 8px;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: #f3f4f6;
        color: #1f2937;
      }
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 5px;
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sidebar-input,
    .sidebar-select {
      width: 100%;

      .el-input__wrapper {
        border-radius: 8px;
        box-shadow: 0 0 0 1px #e5e7eb;
        padding: 8px 12px;
        font-size: 14px;

        &:hover {
          box-shadow: 0 0 0 1px #d1d5db;
        }

        &.is-focus {
          box-shadow: 0 0 0 1px #b3b3b3;
        }
      }

      .el-input__inner {
        color: #1f2937;
      }

      .el-select__tags {
        gap: 4px;
      }

      .el-tag {
        border-radius: 4px;
        margin: 2px;
        background: #e5e7eb;
        border-color: #d1d5db;
        color: #4b5563;
      }
    }

    .selected-banks-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #e5e7eb;

      .el-tag {
        background: #e5e7eb;
        border-color: #d1d5db;
        color: #4b5563;
      }
    }

    .visibility-group {
      display: flex;
      gap: 8px;

      .visibility-radio {
        font-size: 13px;
        color: #6b7280;
        padding: 4px 12px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .el-radio__input.is-checked .el-radio__inner {
          border-color: #1f2937;
          background: #1f2937;
        }

        .el-radio__input.is-checked+.el-radio__label {
          color: #1f2937;
          font-weight: 600;
        }
      }
    }

    .sidebar-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;

      .save-btn,
      .cancel-btn {
        flex: 1;
        border-radius: 8px;
        font-weight: 500;
        padding: 8px 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-2px);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .save-btn {
        background: #fff;
        border: 1px solid #e5e7eb;
        color: #6b7280;

        &:hover {
          border-color: #d1d5db;
          color: #4b5563;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
      }

      .cancel-btn {
        background: #fff;
        border: 1px solid #e5e7eb;
        color: #6b7280;

        &:hover {
          border-color: #d1d5db;
          color: #4b5563;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}
</style>
