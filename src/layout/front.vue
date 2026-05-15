<template>
    <div class="front-layout" :class="{ 'hide-footer': hideFooter, 'notes-editor-mode': isNotesEditorPage }">
        <header class="front-header">
            <div class="header-container">
                <div class="logo" @click="$router.push('/front/index')">
                    <h1>📚 OpenStudy</h1>
                </div>
                <nav class="nav-menu">
                    <router-link to="/front/index">首页</router-link>
                    <router-link to="/front/questionPractice">题库练习</router-link>
                    <!-- 改为自定义点击 -->
                    <a @click.prevent="goToModule('myQuestion', 'myBank')"
                        :class="{ 'router-link-active': isModuleActive('myQuestion') }">
                        我的学习
                    </a>
                    <a @click.prevent="goToModule('english', 'home')"
                        :class="{ 'router-link-active': isModuleActive('english') }">
                        英语学习
                    </a>
                    <a @click.prevent="goToModule('knowledge', 'home')"
                        :class="{ 'router-link-active': isModuleActive('knowledge') }">
                        知识库
                    </a>
                    <a @click.prevent="goToModule('notes', 'list')"
                        :class="{ 'router-link-active': isModuleActive('notes') }">
                        学习分享
                    </a>
                    <router-link to="/front/tools">工具</router-link>
                    <router-link to="/front/studio">上传题库</router-link>
                </nav>
                <div class="user-area">
                    <el-badge v-if="isLogin" :value="unreadCount" :hidden="unreadCount === 0" class="bell-badge">
                        <el-button class="bell-btn" :icon="Bell" circle @click="$router.push('/front/messages')" />
                    </el-badge>
                    <template v-if="!isLogin">
                        <el-button text @click="$router.push('/login')">登录</el-button>
                        <el-button type="primary" @click="$router.push('/register')">注册</el-button>
                    </template>
                    <el-dropdown v-else>
                        <span class="user-name">
                            {{ userStore.name || '用户' }} <el-icon>
                                <ArrowDown />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-item @click="$router.push('/front/profile')">
                                <el-icon>
                                    <User />
                                </el-icon>个人中心
                            </el-dropdown-item>
                            <el-dropdown-item v-if="isAdmin" @click="goAdmin">
                                <el-icon>
                                    <Switch />
                                </el-icon>切换到后台
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="logout">
                                <el-icon>
                                    <Back />
                                </el-icon>退出登录
                            </el-dropdown-item>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </header>

        <main class="front-main">
            <router-view v-slot="{ Component }">
                <keep-alive :include="cachedViews">
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </main>

        <footer class="front-footer">
            <p>© 2026 OpenStudy 开源学习平台. All rights reserved.</p>
        </footer>
        <!-- AI 悬浮助手 -->
        <AiAssistant />
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown, Switch, User, Back, Bell } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import useTagsViewStore from '@/store/modules/tagsView'
import { checkRole } from "@/utils/permission"
import AiAssistant from '@/components/AiAssistant/index.vue'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import { listAllNotice } from '@/api/system/notice'
import { getToken } from '@/utils/auth'
const cacheStore = useFrontPageCacheStore()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const tagsViewStore = useTagsViewStore()

const cachedViews = computed(() => tagsViewStore.cachedViews)

const unreadCount = ref(0)

const fetchUnread = async () => {
    try {
        const res = await listAllNotice()
        const all = res.data || []
        const unreadCountValue = all.filter(n => !n.isRead).length
        unreadCount.value = unreadCountValue
    } catch (e) {
        // ignore
    }
}

onMounted(() => {
    fetchUnread()
    if (getToken() && !userStore.name) {
        userStore.getInfo().catch(() => { })
    }
})

watch(() => route.path, () => {
    fetchUnread()
})


/** 判断当前路径是否属于该模块 */
const isModuleActive = (moduleKey) => {
    return route.path.startsWith(`/front/${moduleKey}`)
}

/** 跳转到模块的缓存子页面，如已在该模块内则不跳转 */
const goToModule = (moduleKey, defaultPath) => {
    // 如果已经在该模块内，不重复跳转
    if (isModuleActive(moduleKey)) return

    const lastVisited = cacheStore.getLastVisited(moduleKey, defaultPath)
    router.push(`/front/${moduleKey}/${lastVisited}`)
}


// 监听路由变化，添加到缓存
watch(() => route.path, () => {

    const { name, meta, path, fullPath, query } = route

    if (name && !meta.hidden && name !== 'login' && name !== 'register') {
        tagsViewStore.addView({ name, path, fullPath, meta, query })
    }

    // 我的学习聚合页缓存
    if (path.startsWith('/front/myQuestion') && !tagsViewStore.cachedViews.includes('FrontMyQuestion')) {
        tagsViewStore.addView({
            name: 'FrontMyQuestion',
            path: '/front/myQuestion',
            fullPath: '/front/myQuestion',
            meta: { title: '我的学习' }
        })
    }

    // 英语学习聚合页缓存
    if (path.startsWith('/front/english') && !tagsViewStore.cachedViews.includes('FrontEnglish')) {
        tagsViewStore.addView({
            name: 'FrontEnglish',
            path: '/front/english',
            fullPath: '/front/english',
            meta: { title: '英语学习' }
        })
    }

    // ✅ 知识库聚合页缓存
    if (path.startsWith('/front/knowledge') && !tagsViewStore.cachedViews.includes('FrontKnowledge')) {
        tagsViewStore.addView({
            name: 'FrontKnowledge',  // ← 这里必须和 index.vue 的 name 一致！
            path: '/front/knowledge',
            fullPath: '/front/knowledge',
            meta: { title: '知识库' }
        })
    }

    // ✅ 学习分享聚合页缓存
    if (path.startsWith('/front/notes') && !tagsViewStore.cachedViews.includes('FrontNotes')) {
        tagsViewStore.addView({
            name: 'FrontNotes',
            path: '/front/notes',
            fullPath: '/front/notes',
            meta: { title: '学习分享' }
        })
    }

    // ✅ 笔记编辑器缓存
    if (path.startsWith('/front/notes/editor') && !tagsViewStore.cachedViews.includes('FrontNotesEditor')) {
        tagsViewStore.addView({
            name: 'FrontNotesEditor',
            path: path,
            fullPath: path,
            meta: { title: '笔记编辑' }
        })
    }

    // ✅ 消息中心缓存
    if (path.startsWith('/front/messages') && !tagsViewStore.cachedViews.includes('FrontMessages')) {
        tagsViewStore.addView({
            name: 'FrontMessages',
            path: '/front/messages',
            fullPath: '/front/messages',
            meta: { title: '消息中心' }
        })
    }

    // ✅ 题库练习聚合页缓存
    if (path.startsWith('/front/questionPractice') && !tagsViewStore.cachedViews.includes('FrontQuestionPractice')) {
        tagsViewStore.addView({
            name: 'FrontQuestionPractice',
            path: '/front/questionPractice',
            fullPath: '/front/questionPractice',
            meta: { title: '题库练习' }
        })
    }

    // ✅ 工具首页缓存
    if (path.startsWith('/front/tools') && !tagsViewStore.cachedViews.includes('FrontTools')) {
        tagsViewStore.addView({
            name: 'FrontTools',
            path: '/front/tools',
            fullPath: '/front/tools',
            meta: { title: '实用工具箱' }
        })
    }


}, { immediate: true })


watch(cachedViews, (val) => {
    // console.log('当前缓存的页面:', val)
}, { immediate: true, deep: true })

const isLogin = computed(() => !!userStore.token)
const isAdmin = computed(() => checkRole(['admin']))
const isMessagesPage = computed(() => route.path.startsWith('/front/messages'))
const isNotesEditorPage = computed(() => route.path === '/front/notes/editor')
const hideFooter = computed(() => isMessagesPage.value || isNotesEditorPage.value)

function goAdmin() {
    router.push('/index/home')
}

function logout() {
    ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await userStore.logOut()
        router.push('/front/index')
    }).catch(() => { })
}
</script>

<style scoped lang="scss">
// 设计系统变量
:root {
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-900: #111827;
}

.front-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;

    .front-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid #e5e7eb;
        padding: 0 32px;
        height: 68px;
        display: flex;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 100;

        .header-container {
            max-width: 1280px;
            width: 100%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .logo {
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 10px;
                transition: all 0.2s ease-in-out;

                &:hover {
                    background: #f5f7fa;
                }

                h1 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                    color: #1f2937;
                    letter-spacing: -0.5px;
                }
            }

            .nav-menu {
                display: flex;
                gap: 8px;

                a {
                    color: #6b7280;
                    text-decoration: none;
                    font-size: 15px;
                    font-weight: 500;
                    padding: 8px 16px;
                    border-radius: 8px;
                    transition: all 0.2s ease-in-out;
                    position: relative;
                    cursor: pointer;

                    &:hover {
                        color: #374151;
                        background: #f5f7fa;
                    }

                    &.router-link-active {
                        color: #1f2937;
                        background: #f3f4f6;
                        font-weight: 600;
                    }
                }
            }

            .user-area {
                display: flex;
                align-items: center;
                gap: 12px;

                .bell-badge {
                    :deep(.el-badge__content) {
                        font-size: 11px;
                        height: 16px;
                        line-height: 16px;
                        padding: 0 4px;
                        border: none;
                    }

                    .bell-btn {
                        width: 34px;
                        height: 34px;
                        font-size: 18px;
                        color: #6b7280;
                        background: transparent;
                        border: none;
                        transition: all 0.2s ease-in-out;

                        &:hover {
                            color: #374151;
                            background: #f5f7fa;
                        }
                    }
                }

                .user-name {
                    cursor: pointer;
                    color: #6b7280;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    transition: all 0.2s ease-in-out;

                    &:hover {
                        background: #f5f7fa;
                        color: #374151;
                    }
                }
            }
        }
    }

    .front-main {
        flex: 1;
        width: 100%;
        margin: 12px 0;
        padding: 0 16px;
    }

    .front-footer {
        background: white;
        padding: 16px;
        text-align: center;
        color: #6b7280;
        margin-top: auto;
        border-top: 1px solid #e5e7eb;
        font-size: 13px;

        .hide-footer & {
            display: none;
        }
    }
}

.front-layout.hide-footer {
    .front-footer {
        display: none;
    }
}

.front-layout.notes-editor-mode {
    .front-main {
        margin: 0;
        padding: 0;
        max-width: 100%;
        height: calc(100vh - 68px);
        overflow: hidden;
    }
}

@media (max-width: 1200px) {
    .front-layout {
        .front-header {
            padding: 0 24px;

            .header-container {
                .nav-menu {
                    gap: 6px;

                    a {
                        padding: 6px 12px;
                        font-size: 14px;
                    }
                }

                .logo h1 {
                    font-size: 20px;
                }
            }
        }

        .front-main {
            padding: 0 24px;
        }
    }
}

@media (max-width: 1024px) {
    .front-layout {
        .front-header {
            padding: 0 16px;
            height: 60px;

            .header-container {
                .nav-menu {
                    gap: 4px;

                    a {
                        padding: 6px 10px;
                        font-size: 14px;
                    }
                }

                .logo h1 {
                    font-size: 18px;
                }
            }
        }

        .front-main {
            padding: 0 16px;
            margin: 12px auto;
        }

        .front-footer {
            padding: 24px 16px;
        }
    }
}

@media (max-width: 768px) {
    .front-layout {
        .front-header {
            padding: 0 12px;
            height: 56px;

            .header-container {
                .nav-menu {
                    gap: 2px;

                    a {
                        padding: 6px 8px;
                        font-size: 13px;
                    }
                }

                .logo {
                    padding: 6px 8px;

                    h1 {
                        font-size: 16px;
                    }
                }
            }
        }

        .front-main {
            padding: 0 12px;
            margin: 16px auto;
        }

        .front-footer {
            padding: 20px 12px;
            font-size: 12px;
        }
    }
}

.el-dropdown-menu .el-icon {
    margin-right: 8px;
}
</style>

<style lang="scss">
// 用户区域按钮样式 - 非scoped
.front-layout .user-area .el-button {
    border-radius: 8px;
    font-weight: 500;
    padding: 6px 14px;
    transition: all 0.2s ease-in-out;
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #374151;

    &:hover {
        border-color: #d1d5db;
        color: #111827;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    &:active {
        box-shadow: none;
    }
}

// 主要按钮（注册按钮）
.front-layout .user-area .el-button--primary {
    background: #fff;
    border-color: #d1d5db;
    color: #111827;

    &:hover {
        background: #fff;
        border-color: #9ca3af;
        color: #111827;
    }
}

// 下拉菜单项样式
.el-dropdown-menu__item {
    border-radius: 6px;
    margin: 2px 6px;
    padding: 8px 12px;
    transition: all 0.2s ease-in-out;

    &:hover {
        background: #f3f4f6;
        color: #111827;
    }
}

// 全局 Tag 标签样式
.el-tag--info {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
}

.el-tag--warning {
    background: #fefce8;
    border-color: #e5e0c0;
    color: #947a4a;
}

.el-tag--danger {
    background: #fef2f2;
    border-color: #e5d0d0;
    color: #b45353;
}

.el-tag--success {
    background: #f0f9eb;
    border-color: #e1f3d8;
    color: #67c23a;
}

// 全局分页样式
.el-pagination {
    .el-pager li {
        border-radius: 6px;
        transition: all 0.2s ease-in-out;

        &:hover {
            background: #f3f4f6;
            color: #374151;
        }

        &.is-active {
            background: #f3f4f6;
            color: #111827;
        }
    }
}

// 全局空状态样式
.el-empty__description {
    color: #9ca3af;
}

// 全局下拉菜单样式
.el-dropdown-menu {
    border-radius: 8px;
}

.el-select-dropdown__item {
    border-radius: 8px;
    transition: all 0.2s ease-in-out;

    &:hover {
        background: #f3f4f6;
    }
}

// 全局输入框样式
.el-input__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb;
    transition: all 0.2s ease-in-out;

    &:hover {
        box-shadow: 0 0 0 1px #d1d5db;
    }

    &.is-focus {
        box-shadow: 0 0 0 1px #b3b3b3;
    }
}

.el-textarea__inner {
    border-radius: 8px;
    border-color: #e5e7eb;
    transition: all 0.2s ease-in-out;

    &:hover {
        border-color: #d1d5db;
    }

    &:focus {
        border-color: #b3b3b3;
    }
}

// 全局对话框样式
.el-dialog {
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
    }
}
</style>