<template>
    <div class="studio-page">
        <div class="page-header">
            <h1 class="page-title">创建题库</h1>
            <p class="page-subtitle">选择题库类型，开始搭建你的专属题库</p>
        </div>

        <div class="card-grid">
            <CardOption title="公共题库" description="创建公开题库，所有用户可见并可收藏练习" :icon="ShareIcon" icon-bg="#e8f4ff"
                @select="handleSelect('public')" />
            <CardOption title="私人题库" description="创建私有题库，仅自己可见和管理" :icon="LockIcon" icon-bg="#f5f5f5"
                @select="handleSelect('private')" />
        </div>
    </div>
</template>

<script setup name="FrontStudioHome">
import { useRouter } from 'vue-router'
import { Share, Lock } from '@element-plus/icons-vue'
import CardOption from './components/CardOption.vue'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'

const ShareIcon = Share
const LockIcon = Lock

const router = useRouter()
const cacheStore = useFrontPageCacheStore()

const handleSelect = (type) => {
    cacheStore.setLastVisited('studio', 'create')
    router.push({
        path: '/front/studio/create',
        query: { type }
    })
}
</script>

<style scoped lang="scss">
:root {
    --primary-50: #eef2ff;
    --primary-100: #e0e7ff;
    --primary-500: #6366f1;
    --primary-600: #4f46e5;
    --primary-700: #4338ca;
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-400: #9ca3af;
    --gray-500: #6b7280;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-900: #111827;
}

.studio-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px;

    .page-header {
        text-align: center;
        margin-bottom: 56px;

        .page-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 12px 0;
            letter-spacing: -0.5px;
        }

        .page-subtitle {
            font-size: 16px;
            color: var(--gray-500);
            margin: 0;
        }
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
    }
}

@media (max-width: 640px) {
    .studio-page {
        padding: 32px 16px;

        .page-header {
            margin-bottom: 40px;

            .page-title {
                font-size: 28px;
            }

            .page-subtitle {
                font-size: 14px;
            }
        }

        .card-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }
}
</style>