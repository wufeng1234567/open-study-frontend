<template>
    <div class="knowledge-home-page">
        <div class="page-header">
            <h1 class="page-title">📚 知识库管理</h1>
            <p class="page-subtitle">管理你的知识库、文档和智能问答</p>
        </div>

        <div class="tool-grid">
            <!-- 知识库列表 -->
            <div class="tool-card" @click="goToKnowledgeList">
                <div class="tool-icon" style="background: #e8f4ff;">
                    <el-icon :size="32">
                        <FolderOpened />
                    </el-icon>
                </div>
                <div class="tool-content">
                    <h3 class="tool-title">知识库列表</h3>
                    <p class="tool-desc">管理你的所有知识库</p>
                </div>
                <div class="tool-arrow">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>

            <!-- 快速上传 -->
            <div class="tool-card" @click="openKbDialog('upload')">
                <div class="tool-icon" style="background: #f0f9eb;">
                    <el-icon :size="32">
                        <Upload />
                    </el-icon>
                </div>
                <div class="tool-content">
                    <h3 class="tool-title">快速上传</h3>
                    <p class="tool-desc">快速上传文档到知识库</p>
                </div>
                <div class="tool-arrow">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>

            <!-- 快速问答 -->
            <div class="tool-card" @click="openKbDialog('qa')">
                <div class="tool-icon" style="background: #fdf6ec;">
                    <el-icon :size="32">
                        <ChatDotRound />
                    </el-icon>
                </div>
                <div class="tool-content">
                    <h3 class="tool-title">快速问答</h3>
                    <p class="tool-desc">基于知识库的智能问答</p>
                </div>
                <div class="tool-arrow">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>

            <!-- 文档管理 -->
            <div class="tool-card" @click="openKbDialog('docs')">
                <div class="tool-icon" style="background: #fef0f0;">
                    <el-icon :size="32">
                        <Document />
                    </el-icon>
                </div>
                <div class="tool-content">
                    <h3 class="tool-title">文档管理</h3>
                    <p class="tool-desc">查看和管理文档列表</p>
                </div>
                <div class="tool-arrow">
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </div>
            </div>
        </div>

        <el-dialog v-model="showKbDialog" title="选择知识库" width="560px" :close-on-click-modal="false" append-to-body>
            <div v-loading="loadingKb" class="kb-dialog-body">
                <el-table v-if="kbList.length > 0" :data="kbList" class="kb-table">
                    <el-table-column prop="name" label="名称" min-width="140" />
                    <el-table-column prop="description" label="描述" min-width="180">
                        <template #default="{ row }">
                            <span class="kb-desc">{{ row.description || '暂无描述' }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="documentCount" label="文档数量" width="90" align="center" />
                    <el-table-column label="操作" width="80" align="center">
                        <template #default="{ row }">
                            <el-button type="primary" size="small" @click="handleSelectKb(row.id)">选择</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-if="!loadingKb && kbList.length === 0" description="暂无知识库">
                    <el-button type="primary" @click="goToCreate">去创建知识库</el-button>
                </el-empty>
            </div>
        </el-dialog>
    </div>
</template>

<script setup name="FrontKnowledgeHome">
import { useRouter } from 'vue-router'
import { FolderOpened, Upload, ChatDotRound, Document, ArrowRight } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { getKnowledgeBaseList } from '@/api/knowledge'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import useUserStore from '@/store/modules/user'

const router = useRouter()
const cacheStore = useFrontPageCacheStore()
const userStore = useUserStore()

const showKbDialog = ref(false)
const targetAction = ref(null)
const kbList = ref([])
const loadingKb = ref(false)

// home.vue
const goToKnowledgeList = () => {
    cacheStore.setLastVisited('knowledge', 'list')
    router.push('/front/knowledge/list')
}

const openKbDialog = (action) => {
    targetAction.value = action
    showKbDialog.value = true
    fetchKbList()
}

const fetchKbList = async () => {
    loadingKb.value = true
    try {
        const res = await getKnowledgeBaseList(userStore.id)
        kbList.value = res.data || []
    } catch (error) {
        console.error('获取知识库列表失败:', error)
        kbList.value = []
    } finally {
        loadingKb.value = false
    }
}

const handleSelectKb = (id) => {
    showKbDialog.value = false
    const action = targetAction.value
    if (action === 'upload') {
        cacheStore.setLastVisited('knowledge', `upload/${id}`)
        router.push(`/front/knowledge/upload/${id}`)
    } else if (action === 'qa') {
        cacheStore.setLastVisited('knowledge', `qa/${id}`)
        router.push(`/front/knowledge/qa/${id}`)
    } else if (action === 'docs') {
        cacheStore.setLastVisited('knowledge', `docs/${id}`)
        router.push(`/front/knowledge/docs/${id}`)
    }
    targetAction.value = null
}

const goToCreate = () => {
    showKbDialog.value = false
    targetAction.value = null
    cacheStore.setLastVisited('knowledge', 'list')
    router.push('/front/knowledge/list')
}

</script>

<style scoped lang="scss">
.knowledge-home-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 20px;

    .page-header {
        text-align: center;
        margin-bottom: 40px;

        .page-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 8px 0;
        }

        .page-subtitle {
            font-size: 15px;
            color: #6b7280;
            margin: 0;
        }
    }

    .tool-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .tool-card {
        display: flex;
        align-items: center;
        padding: 24px;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            border-color: #d1d5db;
        }

        .tool-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            margin-right: 20px;
            flex-shrink: 0;
        }

        .tool-content {
            flex: 1;

            .tool-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 6px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tool-desc {
                font-size: 13px;
                color: #9ca3af;
                margin: 0;
            }
        }

        .tool-arrow {
            color: #9ca3af;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-shrink: 0;
        }

        &:hover .tool-arrow {
            transform: translateX(4px);
            color: #6b7280;
        }
    }
}

.kb-dialog-body {
    min-height: 200px;
}

.kb-desc {
    color: #6b7280;
    font-size: 13px;
}

@media (max-width: 640px) {
    .tool-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<style lang="scss">
.kb-table {
    border-radius: 8px;
    overflow: hidden;

    .el-table__header th {
        background: #f8f9fa;
        color: #6b7280;
        font-weight: 500;
        border-bottom: 1px solid #e5e7eb;
    }

    .el-table__body td {
        color: #1f2937;
        border-bottom: 1px solid #f3f4f6;
    }

    .el-table__row:hover>td {
        background: #fafafa;
    }
}

.el-overlay-dialog .el-dialog {
    border-radius: 16px;

    .el-dialog__header {
        padding: 24px 24px 0;
        margin-right: 0;

        .el-dialog__title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-button--primary {
        border-radius: 8px;
        font-weight: 500;
        padding: 7px 16px;
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

    .el-button--primary.el-button--small {
        padding: 5px 12px;
    }
}
</style>
