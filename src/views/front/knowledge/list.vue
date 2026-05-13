<template>
    <div class="knowledge-list-container">
        <div class="header">
            <el-button @click="goBack" :icon="ArrowLeft" text class="back-btn">
                返回首页
            </el-button>
            <h2 class="header-title">知识库</h2>
            <div class="header-right">
                <el-button class="create-btn" @click="showCreateDialog = true">
                    + 新建知识库
                </el-button>
            </div>
        </div>

        <div class="search-section">
            <el-input v-model="searchKeyword" placeholder="搜索知识库名称" clearable class="search-input">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
        </div>

        <el-row v-loading="loading" :gutter="20" class="knowledge-row">
            <el-col :xs="24" :sm="12" :lg="8" v-for="kb in filteredList" :key="kb.id" class="knowledge-col">
                <el-card shadow="hover" class="knowledge-card">
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="card-title">{{ kb.name }}</h3>
                            <p class="description">{{ kb.description || '暂无描述' }}</p>
                        </div>
                        <div class="card-footer">
                            <p class="info">文档数量：{{ kb.documentCount || 0 }}</p>
                            <div class="actions">
                                <el-button size="small" @click="goUpload(kb.id)">上传</el-button>
                                <el-button size="small" class="qa-btn" @click="goQa(kb.id)">问答</el-button>
                                <el-button size="small" type="warning" @click="goDocs(kb.id)">文档</el-button>
                                <el-button size="small" type="info" @click="editKnowledgeBase(kb)">编辑</el-button>
                                <el-button size="small" type="danger"
                                    @click="deleteKnowledgeBase(kb.id, kb.name)">删除</el-button>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-empty v-if="!loading && filteredList.length === 0 && searchKeyword" description="未找到匹配的知识库" />
        <el-empty v-if="!loading && knowledgeList.length === 0 && !searchKeyword" description="暂无知识库，点击右上角创建" />

        <!-- 创建知识库对话框 -->
        <el-dialog v-model="showCreateDialog" title="新建知识库" width="500px">
            <el-form :model="createForm" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="createForm.name" placeholder="请输入知识库名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="createForm.description" type="textarea" placeholder="请输入描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showCreateDialog = false">取消</el-button>
                <el-button type="primary" @click="handleCreate">确定</el-button>
            </template>
        </el-dialog>

        <!-- 编辑知识库对话框 -->
        <el-dialog v-model="showEditDialog" title="编辑知识库" width="500px">
            <el-form :model="editForm" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="editForm.name" placeholder="请输入知识库名称" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="editForm.description" type="textarea" placeholder="请输入描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button type="primary" @click="handleEdit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="FrontKnowledgeList">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKnowledgeBaseList, createKnowledgeBase, deleteKnowledgeBase as deleteKnowledgeBaseApi, updateKnowledgeBase } from '@/api/knowledge'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import useUserStore from '@/store/modules/user'
import { ArrowLeft, Search } from '@element-plus/icons-vue'

const cacheStore = useFrontPageCacheStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const knowledgeList = ref([])
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const createForm = ref({
    name: '',
    description: ''
})
const editForm = ref({
    id: null,
    name: '',
    description: ''
})

const filteredList = computed(() => {
    if (!searchKeyword.value) {
        return knowledgeList.value
    }
    const keyword = searchKeyword.value.toLowerCase()
    return knowledgeList.value.filter(kb =>
        kb.name.toLowerCase().includes(keyword)
    )
})


// 新增返回方法
const goBack = () => {
    cacheStore.setLastVisited('knowledge', 'list')  // 记录当前页面
    router.push('/front/knowledge/home')
}

const goDocs = (id) => {
    cacheStore.setLastVisited('knowledge', `docs/${id}`)
    router.push(`/front/knowledge/docs/${id}`)
}

const goQa = (id) => {
    cacheStore.setLastVisited('knowledge', `qa/${id}`)
    router.push(`/front/knowledge/qa/${id}`)
}

const goUpload = (id) => {
    cacheStore.setLastVisited('knowledge', `upload/${id}`)
    router.push(`/front/knowledge/upload/${id}`)
}

const editKnowledgeBase = (kb) => {
    editForm.value = { id: kb.id, name: kb.name, description: kb.description || '' }
    showEditDialog.value = true
}

const handleEdit = async () => {
    if (!editForm.value.name) {
        ElMessage.warning('请输入知识库名称')
        return
    }
    try {
        await updateKnowledgeBase(editForm.value.id, {
            name: editForm.value.name,
            description: editForm.value.description
        })
        ElMessage.success('修改成功')
        showEditDialog.value = false
        fetchList()
    } catch (error) {
        ElMessage.error('修改失败')
    }
}

const deleteKnowledgeBase = async (id, name) => {
    ElMessageBox.confirm(`确定删除知识库「${name}」吗？其中的所有文档也会被删除。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await deleteKnowledgeBaseApi(id)
            ElMessage.success('删除成功')
            fetchList()
        } catch (error) {
            ElMessage.error('删除失败')
        }
    }).catch(() => { })
}

const fetchList = async () => {
    loading.value = true
    try {
        const res = await getKnowledgeBaseList(userStore.id)
        knowledgeList.value = res.data || []
    } catch (error) {
        ElMessage.error('获取知识库列表失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

const handleCreate = async () => {
    if (!createForm.value.name) {
        ElMessage.warning('请输入知识库名称')
        return
    }
    try {
        await createKnowledgeBase({
            ...createForm.value,
            userId: userStore.id
        })
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        createForm.value = { name: '', description: '' }
        fetchList()
    } catch (error) {
        ElMessage.error('创建失败')
        console.error(error)
    }
}

onMounted(() => {
    fetchList()
})

onActivated(() => {
    fetchList()
})

watch(() => route.path, () => {
    fetchList()
})
</script>

<style scoped>
.knowledge-list-container {
    padding: 24px;
}

.header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    margin-bottom: 24px;
}

.search-section {
    margin-bottom: 24px;

    .search-input {
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

.back-btn {
    justify-self: start;
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
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.3px;
    text-align: center;
    white-space: nowrap;
}

.header-right {
    justify-self: end;
    display: flex;
    justify-content: flex-end;

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

.knowledge-row {
    margin: 0;
}

.knowledge-col {
    margin-bottom: 24px;
}

.knowledge-card {
    border-radius: 16px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        border-color: #409eff;
    }

    .card-content {
        .card-header {
            .card-title {
                font-size: 17px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 8px 0;
            }

            .description {
                font-size: 13px;
                color: #9ca3af;
                line-height: 1.5;
                margin: 0;
            }
        }

        .card-footer {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #f3f4f6;

            .info {
                font-size: 13px;
                color: #6b7280;
                margin: 0 0 12px 0;
            }
        }
    }
}

.actions {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    justify-content: space-between;

    .el-button {
        flex: 1;
        border-radius: 8px;
        font-weight: 500;
        font-size: 12px;
        padding: 5px 8px;
        height: auto;
        min-height: 30px;
        letter-spacing: 0.01em;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: #f8f9fa;
        border-color: #e5e7eb;
        color: #6b7280;

        &:hover {
            transform: translateY(-2px);
            border-color: #409eff;
            color: #409eff;
            background: #fff;
        }

        &:active {
            transform: translateY(0);
        }
    }

    .el-button--info {
        background: #f3f4f6;
        border-color: #e5e7eb;
        color: #6b7280;

        &:hover {
            background: #fff;
            border-color: #409eff;
            color: #409eff;
        }
    }

    .el-button--warning {
        background: #fefce8;
        border-color: #e5e0c0;
        color: #947a4a;

        &:hover {
            background: #fff;
            border-color: #e6a23c;
            color: #e6a23c;
        }
    }

    .el-button--danger {
        background: #fef2f2;
        border-color: #e5d0d0;
        color: #b45353;

        &:hover {
            background: #fff;
            border-color: #f56c6c;
            color: #f56c6c;
        }
    }
}

:deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;

    .el-dialog__header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #f3f4f6;

        .el-dialog__title {
            font-size: 17px;
            font-weight: 600;
            color: #1f2937;
        }
    }

    .el-dialog__body {
        padding: 24px;
    }

    .el-dialog__footer {
        padding: 16px 24px 20px;
        border-top: 1px solid #f3f4f6;

        .el-button {
            border-radius: 8px;
            font-weight: 500;
            padding: 8px 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &.el-button--primary {
                background: #409eff;
                border-color: #409eff;

                &:hover {
                    background: #337ecc;
                    border-color: #337ecc;
                    transform: translateY(-2px);
                }
            }

            &:not(.el-button--primary) {
                background: #fff;
                border: 1px solid #e5e7eb;
                color: #6b7280;

                &:hover {
                    border-color: #409eff;
                    color: #409eff;
                    transform: translateY(-2px);
                }
            }
        }
    }
}

:deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
        font-weight: 500;
        color: #374151;
        margin-bottom: 8px;
    }

    .el-input__wrapper {
        border-radius: 8px;
        box-shadow: 0 0 0 1px #e5e7eb;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            box-shadow: 0 0 0 1px #d1d5db;
        }

        &.is-focus {
            box-shadow: 0 0 0 1px #409eff;
        }
    }

    .el-textarea__inner {
        border-radius: 8px;
        border-color: #e5e7eb;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            border-color: #d1d5db;
        }

        &:focus {
            border-color: #409eff;
        }
    }
}

:deep(.el-dialog__footer) {
    padding: 16px 24px 20px;
    border-top: 1px solid #f3f4f6;

    .el-button {
        border-radius: 8px;
        font-weight: 500;
        padding: 8px 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &.el-button--primary {
            background: #fff;
            border: 1px solid #e5e7eb;
            color: #6b7280;

            &:hover {
                border-color: #409eff;
                color: #409eff;
                transform: translateY(-2px);
            }
        }
    }
}
</style>

<style lang="scss">
.knowledge-list-container {
    .header-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
    }

    .actions {
        .el-button {
            border-radius: 8px;
            font-weight: 500;
            padding: 6px 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: #fff;
            border: 1px solid #e5e7eb;
            color: #6b7280;

            &:hover {
                transform: translateY(-2px);
                border-color: #b3b3b3;
                color: #4b5563;
            }

            &:active {
                transform: translateY(0);
            }
        }

        .el-button--info {
            background: #f3f4f6;
            border-color: #e5e7eb;
            color: #6b7280;

            &:hover {
                background: #fff;
                border-color: #b3b3b3;
                color: #4b5563;
            }
        }

        .el-button--warning {
            background: #fefce8;
            border-color: #e5e0c0;
            color: #947a4a;

            &:hover {
                background: #fff;
                border-color: #b3a080;
                color: #7a6238;
            }
        }

        .el-button--danger {
            background: #fef2f2;
            border-color: #e5d0d0;
            color: #b45353;

            &:hover {
                background: #fff;
                border-color: #b38080;
                color: #9b3a3a;
            }
        }
    }

    .knowledge-card {
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        background: #fff;

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            border-color: #d1d5db;
        }
    }
}
</style>
