<template>
    <div class="docs-container">
        <el-page-header @back="goBack" title="返回">
            <template #content>
                <span class="page-title">{{ kbName || '文档列表' }}</span>
            </template>
        </el-page-header>

        <!-- 统计卡片 -->
        <div class="stats-section" v-if="documentList.length > 0">
            <div class="stat-card">
                <div class="stat-icon">📄</div>
                <div class="stat-info">
                    <span class="stat-value">{{ documentList.length }}</span>
                    <span class="stat-label">总文档数</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                    <span class="stat-value">{{ totalChunks }}</span>
                    <span class="stat-label">总分块数</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                    <span class="stat-value">{{ vectoredCount }}</span>
                    <span class="stat-label">已向量化</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                    <span class="stat-value">{{ totalSize }}</span>
                    <span class="stat-label">总大小</span>
                </div>
            </div>
        </div>

        <!-- 文档名称搜索 -->
        <div class="doc-search-section">
            <el-input v-model="docSearchKeyword" placeholder="搜索文档名称" clearable class="doc-search-input">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
        </div>

        <!-- 文档卡片列表 -->
        <div class="doc-list" v-loading="loading">
            <div v-for="doc in filteredDocumentList" :key="doc.id" class="doc-card">
                <div class="doc-header">
                    <div class="doc-icon">📄</div>
                    <div class="doc-title-info">
                        <span class="doc-name">{{ doc.fileName }}</span>
                        <div class="doc-meta">
                            <span class="meta-item">{{ doc.fileType || '-' }} 文件</span>
                            <span class="meta-divider">｜</span>
                            <span class="meta-item">{{ formatFileSize(doc.fileSize) }}</span>
                            <span class="meta-divider">｜</span>
                            <span class="meta-item">{{ doc.chunkCount || 0 }} 个分块</span>
                            <span class="meta-divider">｜</span>
                            <el-tag :type="getStatusType(doc.status)" size="small">
                                {{ getStatusText(doc.status) }}
                            </el-tag>
                            <span class="meta-divider">｜</span>
                            <span class="meta-item">{{ doc.createTime || '-' }}</span>
                        </div>
                    </div>
                    <el-button class="expand-btn" size="small" @click="toggleExpand(doc.id)">
                        {{ expandedDocId === doc.id ? '收起 ▲' : '预览内容 ▼' }}
                    </el-button>
                </div>

                <!-- 展开预览区 -->
                <div v-if="expandedDocId === doc.id" class="doc-preview">
                    <div v-if="isMarkdownType(doc.fileType) && docPreviews[doc.id]" class="preview-markdown">
                        <div class="rendered-preview" v-html="renderMarkdown(docPreviews[doc.id])"></div>
                    </div>
                    <div v-else-if="docPreviews[doc.id]" class="preview-content">
                        {{ docPreviews[doc.id] }}
                    </div>
                    <div v-else class="preview-loading">加载中...</div>
                    <div class="preview-actions">
                        <el-button class="action-btn" size="small" @click="openPreviewDialog(doc)">
                            查看完整内容
                        </el-button>
                        <el-button class="action-btn" size="small" @click="openChunkDialog(doc)">
                            查看分块列表
                        </el-button>
                        <el-button class="action-btn delete-btn" size="small"
                            @click="handleDeleteDocument(doc.id, doc.fileName)">
                            删除
                        </el-button>
                    </div>
                </div>
            </div>
            <el-empty v-if="!loading && filteredDocumentList.length === 0"
                :description="docSearchKeyword ? '未找到匹配的文档' : '暂无文档'" />
        </div>

        <!-- 全屏阅读模式 -->
        <div v-if="readingMode" class="reading-overlay">
            <div class="reading-container">
                <!-- 顶部工具栏 -->
                <div class="reading-toolbar">
                    <div class="toolbar-left">
                        <el-button class="toolbar-btn" size="small" @click="exitReading">
                            <el-icon>
                                <ArrowLeft />
                            </el-icon>
                            <span>退出阅读</span>
                        </el-button>
                        <span class="reading-doc-name">{{ readingDoc?.fileName }}</span>
                    </div>
                    <div class="toolbar-center">
                        <el-button-group class="font-size-group">
                            <el-button class="toolbar-btn" size="small" :type="fontSize === 14 ? 'primary' : ''"
                                @click="fontSize = 14">小</el-button>
                            <el-button class="toolbar-btn" size="small" :type="fontSize === 16 ? 'primary' : ''"
                                @click="fontSize = 16">中</el-button>
                            <el-button class="toolbar-btn" size="small" :type="fontSize === 18 ? 'primary' : ''"
                                @click="fontSize = 18">大</el-button>
                            <el-button class="toolbar-btn" size="small" :type="fontSize === 20 ? 'primary' : ''"
                                @click="fontSize = 20">超大</el-button>
                        </el-button-group>
                    </div>
                    <div class="toolbar-right">
                        <el-input v-model="searchText" placeholder="搜索内容..." size="small" class="search-input" clearable
                            @keyup.enter="searchInContent">
                            <template #prefix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                        </el-input>
                        <span v-if="searchResult.total > 0" class="search-count">
                            {{ searchResult.current }}/{{ searchResult.total }}
                        </span>
                        <el-button class="toolbar-btn" size="small" @click="searchInContent">搜索</el-button>
                    </div>
                </div>

                <!-- 内容阅读区 -->
                <div v-loading="readingLoading" class="reading-body">
                    <div v-if="isMarkdownType(readingDoc?.fileType)" class="reading-markdown"
                        :style="{ fontSize: fontSize + 'px', lineHeight: fontSize > 16 ? '2' : '1.8' }">
                        <div class="rendered-preview" v-html="renderMarkdown(readingContent)"></div>
                    </div>
                    <pre v-else class="reading-plain" :style="{ fontSize: fontSize + 'px', lineHeight: '1.8' }">{{
                        readingContent }}</pre>
                </div>
            </div>
        </div>

        <!-- 分块列表弹窗 -->
        <el-dialog v-model="showChunkDialog" title="文档分块列表" width="700px" :close-on-click-modal="false"
            class="chunk-dialog">
            <div v-loading="chunkLoading">
                <el-table :data="chunkList" stripe max-height="400">
                    <el-table-column prop="chunkIndex" label="索引" width="70" align="center">
                        <template #default="{ row }">
                            <span class="chunk-index">#{{ row.chunkIndex ?? row.chunk_index }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="content" label="内容" min-width="400">
                        <template #default="{ row }">
                            <span class="chunk-content-preview">{{ truncateText(row.content || row.content, 100)
                                }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                        <template #default="{ row }">
                            <el-button class="chunk-view-btn" size="small" @click="viewChunkDetail(row)">查看</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-if="!chunkLoading && chunkList.length === 0" description="暂无分块" />
            </div>
        </el-dialog>

        <!-- 分块详情弹窗 -->
        <el-dialog v-model="showChunkDetail" title="分块内容详情" width="650px" :close-on-click-modal="false"
            class="chunk-detail-dialog">
            <div class="chunk-detail-body">
                <div class="chunk-detail-header">
                    <span class="chunk-detail-index">分块 #{{ currentChunk?.chunkIndex ?? currentChunk?.chunk_index
                        }}</span>
                    <span class="chunk-detail-length">长度：{{ currentChunk?.content?.length || 0 }} 字符</span>
                </div>
                <pre class="chunk-detail-content">{{ currentChunk?.content }}</pre>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="FrontKnowledgeDocs">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getDocumentList, deleteDocument as deleteDocumentApi, getKnowledgeBaseDetail } from '@/api/knowledge'
import request from '@/utils/request'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'

const route = useRoute()
const router = useRouter()
const cacheStore = useFrontPageCacheStore()
const kbName = ref('')
const documentList = ref([])
const loading = ref(false)
const docSearchKeyword = ref('')

// 展开预览
const expandedDocId = ref(null)
const docPreviews = ref({})

// 全屏阅读模式
const readingMode = ref(false)
const readingDoc = ref(null)
const readingContent = ref('')
const readingLoading = ref(false)
const fontSize = ref(16)

// 搜索
const searchText = ref('')
const searchResult = ref({ total: 0, current: 0 })

// 分块列表弹窗
const showChunkDialog = ref(false)
const chunkList = ref([])
const chunkLoading = ref(false)

// 分块详情弹窗
const showChunkDetail = ref(false)
const currentChunk = ref(null)

// 统计数据
const totalChunks = computed(() => documentList.value.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0))
const vectoredCount = computed(() => documentList.value.filter(doc => doc.status === 5).length)
const totalSize = computed(() => formatFileSize(documentList.value.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)))

const filteredDocumentList = computed(() => {
    if (!docSearchKeyword.value) {
        return documentList.value
    }
    const keyword = docSearchKeyword.value.toLowerCase()
    return documentList.value.filter(doc =>
        doc.fileName.toLowerCase().includes(keyword)
    )
})

const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const getStatusText = (status) => {
    const map = { 0: '等待', 1: '待解析', 2: '解析中', 3: '解析完成', 4: '失败', 5: '已向量化' }
    return map[status] || '未知'
}

const getStatusType = (status) => {
    if (status === 5 || status === 3) return 'success'
    if (status === 4) return 'danger'
    return 'info'
}

const truncateText = (text, maxLength) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const isMarkdownType = (fileType) => {
    if (!fileType) return false
    const type = fileType.toLowerCase()
    return type === 'md' || type === 'markdown' || type === 'txt'
}

const renderMarkdown = (content) => {
    if (!content) return ''
    const html = marked.parse(content)
    return DOMPurify.sanitize(html)
}

// 展开/收起预览
const toggleExpand = async (docId) => {
    if (expandedDocId.value === docId) {
        expandedDocId.value = null
        return
    }
    expandedDocId.value = docId

    if (!docPreviews.value[docId]) {
        try {
            const res = await request({
                url: `/rag/document/content/${docId}`,
                method: 'get'
            })
            const content = res.data?.content || res.data || ''
            docPreviews.value[docId] = content.length > 3000
                ? content.substring(0, 3000) + '\n\n...（内容过长，点击"查看完整内容"查看全部）'
                : content
        } catch (e) {
            docPreviews.value[docId] = '（无法加载预览内容）'
        }
    }
}

// 打开全屏阅读模式
const openPreviewDialog = async (doc) => {
    readingDoc.value = doc
    readingMode.value = true
    readingLoading.value = true
    readingContent.value = ''
    searchText.value = ''
    searchResult.value = { total: 0, current: 0 }
    try {
        const res = await request({
            url: `/rag/document/content/${doc.id}`,
            method: 'get'
        })
        readingContent.value = res.data?.content || res.data || ''
    } catch (e) {
        ElMessage.error('获取文档内容失败')
        readingMode.value = false
    } finally {
        readingLoading.value = false
    }
}

// 退出阅读模式
const exitReading = () => {
    readingMode.value = false
    readingDoc.value = null
    readingContent.value = ''
    searchText.value = ''
    searchResult.value = { total: 0, current: 0 }
}

// 搜索内容
const searchInContent = () => {
    if (!searchText.value.trim() || !readingContent.value) return

    const regex = new RegExp(searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = readingContent.value.match(regex)
    searchResult.value.total = matches ? matches.length : 0
    searchResult.value.current = 1

    if (matches && matches.length > 0) {
        ElMessage.success(`找到 ${matches.length} 处匹配`)
    } else {
        ElMessage.info('未找到匹配内容')
    }
}

// 打开分块列表弹窗
const openChunkDialog = async (doc) => {
    showChunkDialog.value = true
    chunkLoading.value = true
    chunkList.value = []
    try {
        const res = await request({
            url: `/rag/document/chunks/${doc.id}`,
            method: 'get'
        })
        chunkList.value = res.data || []
    } catch (e) {
        ElMessage.error('获取分块列表失败')
    } finally {
        chunkLoading.value = false
    }
}

// 查看分块详情
const viewChunkDetail = (chunk) => {
    currentChunk.value = chunk
    showChunkDetail.value = true
}

const fetchDocs = async () => {
    const kbId = route.params.id
    if (!kbId) return
    loading.value = true
    expandedDocId.value = null
    docPreviews.value = {}
    try {
        const res = await getDocumentList(kbId)
        documentList.value = res.data || []
        try {
            const kbRes = await getKnowledgeBaseDetail(kbId)
            kbName.value = kbRes.data?.name || ''
        } catch (e) { }
    } catch (error) {
        ElMessage.error('获取文档列表失败')
    } finally {
        loading.value = false
    }
}

const handleDeleteDocument = async (id, name) => {
    ElMessageBox.confirm(`确定删除文档「${name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await deleteDocumentApi(id)
            ElMessage.success('删除成功')
            if (expandedDocId.value === id) {
                expandedDocId.value = null
                delete docPreviews.value[id]
            }
            fetchDocs()
        } catch (error) {
            ElMessage.error('删除失败')
        }
    }).catch(() => { })
}

const goBack = () => {
    cacheStore.setLastVisited('knowledge', 'list')
    router.push('/front/knowledge/list')
}

onMounted(() => {
    fetchDocs()
})

onActivated(() => {
    fetchDocs()
})

watch(() => route.params.id, (newId) => {
    if (newId) {
        fetchDocs()
    }
})
</script>

<style scoped lang="scss">
.docs-container {
    padding: 24px;
}

.page-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
}

// 统计卡片
.stats-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 20px;
    margin-bottom: 16px;

    .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .stat-icon {
            font-size: 30px;
            line-height: 1;
        }

        .stat-info {
            display: flex;
            flex-direction: column;

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                line-height: 1.2;
            }

            .stat-label {
                font-size: 13px;
                color: #6b7280;
                margin-top: 2px;
            }
        }
    }
}

.doc-search-section {
    margin-bottom: 16px;

    .doc-search-input {
        max-width: 320px;

        :deep(.el-input__wrapper) {
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
}

// 文档卡片列表
.doc-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .doc-card {
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        padding: 16px 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .doc-header {
            display: flex;
            align-items: center;
            gap: 14px;

            .doc-icon {
                font-size: 28px;
                line-height: 1;
                flex-shrink: 0;
            }

            .doc-title-info {
                flex: 1;
                min-width: 0;

                .doc-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1f2937;
                    display: block;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .doc-meta {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #6b7280;
                    flex-wrap: wrap;

                    .meta-item {
                        color: #6b7280;
                    }

                    .meta-divider {
                        color: #d1d5db;
                        margin: 0 2px;
                    }
                }
            }

            .expand-btn {
                flex-shrink: 0;
                background: #fff;
                border: 1px solid #e5e7eb;
                color: #6b7280;
                border-radius: 8px;
                font-weight: 500;
                padding: 5px 12px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

                &:hover {
                    border-color: #409eff;
                    color: #409eff;
                    transform: translateY(-2px);
                }

                &:active {
                    transform: translateY(0);
                }
            }
        }

        .doc-preview {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid #f3f4f6;

            .preview-content {
                font-size: 13px;
                color: #4b5563;
                line-height: 1.7;
                padding: 12px 16px;
                background: #f9fafb;
                border-radius: 8px;
                max-height: 120px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-all;
            }

            .preview-loading {
                font-size: 13px;
                color: #9ca3af;
                padding: 12px 16px;
            }

            .preview-markdown {
                padding: 12px 16px;
                background: #f9fafb;
                border-radius: 8px;
                max-height: 300px;
                overflow-y: auto;
            }

            .preview-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;

                .action-btn {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    color: #6b7280;
                    border-radius: 8px;
                    font-weight: 500;
                    padding: 5px 14px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

                    &:hover {
                        border-color: #409eff;
                        color: #409eff;
                        transform: translateY(-2px);
                    }

                    &:active {
                        transform: translateY(0);
                    }
                }

                .delete-btn {
                    &:hover {
                        border-color: #f56c6c;
                        color: #f56c6c;
                    }
                }
            }
        }
    }
}

// 全屏阅读模式
.reading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
}

.reading-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.reading-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;

    .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .reading-doc-name {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
        }
    }

    .toolbar-center {
        display: flex;
        align-items: center;
    }

    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .search-input {
            width: 200px;
        }

        .search-count {
            font-size: 13px;
            color: #6b7280;
            min-width: 40px;
            text-align: center;
        }
    }
}

.toolbar-btn {
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 8px;
    font-weight: 500;
    padding: 5px 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
}

.font-size-group {
    .el-button {
        padding: 4px 10px;
        border-radius: 6px;
    }
}

.reading-body {
    flex: 1;
    overflow-y: auto;
    padding: 32px 48px;
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
}

.reading-markdown {
    background: #fff;
    border-radius: 16px;
    padding: 40px 48px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    min-height: calc(100vh - 120px);

    .rendered-preview {
        line-height: 1.7;
        font-size: 16px;
        color: #1f2937;

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            margin: 1.2em 0 0.6em;
            color: #1f2937;
            font-weight: 700;
            line-height: 1.3;
        }

        h1 {
            font-size: 2em;
        }

        h2 {
            font-size: 1.5em;
        }

        h3 {
            font-size: 1.25em;
        }

        p {
            margin: 0 0 12px;
        }

        ul,
        ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
        }

        blockquote {
            margin: 0.8em 0;
            padding: 8px 16px;
            border-left: 4px solid #d1d5db;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 0 8px 8px 0;
        }

        pre {
            background: #1f2937;
            color: #e5e7eb;
            padding: 16px;
            border-radius: 8px;
            margin: 0.8em 0;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.5;
        }

        code {
            background: #f3f4f6;
            color: #b45353;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
        }

        pre code {
            color: inherit;
            background: none;
            padding: 0;
            font-size: inherit;
        }

        a {
            color: #6b7280;
            text-decoration: underline;

            &:hover {
                color: #1f2937;
            }
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 0.8em 0;
            border: 1px solid #f3f4f6;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.8em 0;
            border-radius: 8px;
            overflow: hidden;

            th,
            td {
                border: 1px solid #e5e7eb;
                padding: 10px 14px;
                text-align: left;
            }

            th {
                background: #f9fafb;
                font-weight: 600;
                color: #1f2937;
            }

            td {
                color: #6b7280;
            }
        }

        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 1.5em 0;
        }
    }
}

.reading-plain {
    background: #fff;
    border-radius: 16px;
    padding: 40px 48px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    min-height: calc(100vh - 120px);
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    color: #1f2937;
    white-space: pre-wrap;
    word-break: break-all;
}

// 分块列表
.chunk-index {
    font-family: monospace;
    color: #6b7280;
    font-weight: 500;
}

.chunk-content-preview {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
}

.chunk-view-btn {
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 6px;
    font-weight: 500;
    padding: 4px 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
}

// 分块详情
.chunk-detail-body {
    .chunk-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;

        .chunk-detail-index {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
        }

        .chunk-detail-length {
            font-size: 13px;
            color: #6b7280;
        }
    }

    .chunk-detail-content {
        font-size: 14px;
        line-height: 1.7;
        color: #1f2937;
        white-space: pre-wrap;
        word-break: break-all;
        background: #f9fafb;
        padding: 16px;
        border-radius: 8px;
        max-height: 400px;
        overflow-y: auto;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        margin: 0;
    }
}
</style>

<style lang="scss">
.docs-container .el-page-header {
    .el-page-header__title {
        color: #6b7280;
        font-weight: 500;
    }

    .el-page-header__content {
        color: #1f2937;
        font-weight: 600;
    }
}

.docs-container .el-tag--info {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
}

.docs-container .el-tag--success {
    background: #f0f9eb;
    border-color: #e1f3d8;
    color: #67c23a;
}

.docs-container .el-tag--danger {
    background: #fef2f2;
    border-color: #e5d0d0;
    color: #b45353;
}

.docs-container .el-dialog {
    border-radius: 16px;
}

.docs-container .el-empty__description {
    color: #9ca3af;
}
</style>
