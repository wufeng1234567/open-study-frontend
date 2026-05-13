<template>
    <div class="front-home">


        <!-- 轮播图区域 -->
        <div class="carousel-wrapper" v-loading="loading">
            <el-carousel v-if="carouselList.length > 0" :interval="5000" arrow="always" height="420px"
                indicator-position="outside">
                <el-carousel-item v-for="item in carouselList" :key="item.id">
                    <div class="carousel-item-content" @click="goTarget(item.targetUrl)">
                        <img :src="item.imageUrl" :alt="item.title" class="carousel-img" />
                        <div class="carousel-overlay">
                            <h3 class="carousel-title">{{ item.title }}</h3>
                        </div>
                    </div>
                </el-carousel-item>
            </el-carousel>
            <div v-else class="empty-carousel">暂无轮播图</div>
        </div>

        <!-- 活动介绍 -->
        <div class="activity-intro">
            <h2>📚 openstudy正式上线！</h2>
            <p>我们很高兴地宣布，全新「openstudy」已全面启用！本系统致力于为在校学生打造一个高效、专注、个性化的自主学习环境。</p>
            <ul>
                <li>✅ 智能制定个性化学习计划</li>
                <li>✅ 实时在线答疑与辅导支持</li>
                <li>✅ 海量优质学习资源库（视频/题库/笔记）</li>
                <li>✅ 学习进度自动追踪与周报反馈</li>
                <li>✅ 自习室预约、专注计时、成就激励</li>
            </ul>
            <p style="margin-top: 16px; text-align: center; color: #409eff;">
                🎉 快来体验吧，开启你的高效学习之旅！
            </p>
        </div>
    </div>
</template>

<script setup name="FrontIndex">
import { ref, onMounted, computed } from 'vue'
// import { useRouter } from 'vue-router'
import { Switch } from '@element-plus/icons-vue'
import { listCarouselAll } from '@/api/carousel/carousel'
import useUserStore from '@/store/modules/user'

// const router = useRouter()
const userStore = useUserStore()

const carouselList = ref([])
const loading = ref(true)

const isAdmin = computed(() => {
    return userStore.roles?.some(role => ['admin', 'common'].includes(role))
})

function fetchCarouselList() {
    loading.value = true
    listCarouselAll()
        .then(response => {
            const data = response.data || []
            carouselList.value = data.map(item => ({
                ...item,
                imageUrl: (import.meta.env.VITE_APP_BASE_API || '') + (item.imageUrl || '')
            }))
        })
        .finally(() => {
            loading.value = false
        })
}



function goTarget(url) {
    if (url && url.trim()) {
        window.open(url, '_blank', 'noopener,noreferrer')
    }
}

onMounted(() => {
    fetchCarouselList()
})
</script>

<style scoped lang="scss">
// 设计系统变量
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

.front-home {
    .switch-bar {
        text-align: right;
        margin-bottom: 20px;
    }

    .carousel-wrapper {
        margin-bottom: 40px;
        border-radius: 16px;
        overflow: hidden;
        background: white;
        border: 1px solid var(--gray-200);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        :deep(.el-carousel__container) {
            border-radius: 16px;
        }

        :deep(.el-carousel__indicators) {
            bottom: 16px;

            .el-carousel__indicator {
                padding: 0 4px;

                .el-carousel__button {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    transition: all 0.3s ease;
                }

                &.is-active .el-carousel__button {
                    width: 24px;
                    border-radius: 4px;
                    background: white;
                }
            }
        }

        :deep(.el-carousel__arrow) {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--gray-200);
            color: var(--gray-600);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: all 0.2s ease;

            &:hover {
                background: white;
                color: var(--primary-600);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        }

        .empty-carousel {
            height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--gray-400);
            background: var(--gray-50);
            font-size: 16px;
        }

        .carousel-item-content {
            position: relative;
            width: 100%;
            height: 100%;
            cursor: pointer;

            .carousel-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }

            &:hover .carousel-img {
                transform: scale(1.02);
            }

            .carousel-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.2), transparent);
                padding: 48px 32px 32px;
                color: white;

                .carousel-title {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                    letter-spacing: -0.5px;
                }
            }
        }
    }

    .activity-intro {
        background: white;
        border-radius: 16px;
        padding: 48px;
        border: 1px solid var(--gray-200);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        line-height: 1.8;

        h2 {
            text-align: center;
            color: var(--gray-900);
            margin-bottom: 32px;
            font-size: 32px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }

        p {
            color: var(--gray-600);
            margin-bottom: 24px;
            font-size: 16px;
            line-height: 1.8;
        }

        ul {
            padding-left: 0;
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin: 32px 0;

            li {
                color: var(--gray-700);
                font-size: 15px;
                padding: 16px 20px;
                background: var(--gray-50);
                border-radius: 16px;
                border: 1px solid var(--gray-200);
                transition: all 0.2s ease;

                &:hover {
                    background: var(--primary-50);
                    border-color: var(--primary-100);
                    transform: translateY(-2px);
                }
            }
        }

        p:last-child {
            text-align: center;
            color: var(--primary-600);
            font-weight: 500;
            margin-top: 32px;
            padding: 16px 24px;
            background: var(--primary-50);
            border-radius: 16px;
            display: inline-block;
            width: 100%;
        }
    }
}

@media (max-width: 768px) {
    .front-home {
        .carousel-wrapper {
            margin-bottom: 24px;
            border-radius: 16px;

            .carousel-item-content .carousel-overlay {
                padding: 32px 20px 24px;

                .carousel-title {
                    font-size: 20px;
                }
            }

            .empty-carousel {
                height: 280px;
            }
        }

        .activity-intro {
            padding: 28px 20px;

            h2 {
                font-size: 24px;
                margin-bottom: 24px;
            }

            ul {
                grid-template-columns: 1fr;
                gap: 12px;

                li {
                    padding: 14px 16px;
                    font-size: 14px;
                    border-radius: 16px;
                }
            }
        }
    }
}
</style>