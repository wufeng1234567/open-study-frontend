<template>
    <div class="admin-dashboard">
        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stat-cards">
            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon primary">
                        <el-icon>
                            <User />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.userCount }}</div>
                        <div class="stat-label">用户总数</div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon success">
                        <el-icon>
                            <Collection />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.questionBankCount }}</div>
                        <div class="stat-label">题库总数</div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon warning">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.questionCount }}</div>
                        <div class="stat-label">题目总数</div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon info">
                        <el-icon>
                            <Notebook />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.noteCount }}</div>
                        <div class="stat-label">笔记总数</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- ECharts 图表区域 -->
        <el-row :gutter="20" class="chart-row">
            <el-col :xs="24" :lg="12">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>题库分类统计</span>
                    </template>
                    <div ref="categoryChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="12">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>最近活动</span>
                    </template>
                    <div class="recent-activity">
                        <div v-for="(item, index) in recentActivities" :key="index" class="activity-item">
                            <div class="activity-icon" :class="item.type">
                                <el-icon>
                                    <component :is="item.icon" />
                                </el-icon>
                            </div>
                            <div class="activity-content">
                                <div class="activity-text">{{ item.text }}</div>
                                <div class="activity-time">{{ item.time }}</div>
                            </div>
                        </div>
                        <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" :image-size="80" />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
            <el-col :xs="24" :lg="16">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>用户增长趋势</span>
                    </template>
                    <div ref="userGrowthChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="8">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>系统信息</span>
                    </template>
                    <div class="system-info">
                        <div class="info-item">
                            <span class="info-label">系统名称</span>
                            <span class="info-value">OpenStudy 学习平台</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">后端框架</span>
                            <span class="info-value">Spring Boot 3.5</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">前端框架</span>
                            <span class="info-value">Vue3 + Element Plus</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">数据库</span>
                            <span class="info-value">MySQL</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">当前时间</span>
                            <span class="info-value">{{ currentTime }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="AdminDashboard">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { User, Collection, EditPen, Notebook, Document, UserFilled, ChatDotRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardStats } from '@/api/dashboard'

// 统计数据
const stats = ref({
    userCount: 0,
    questionBankCount: 0,
    questionCount: 0,
    noteCount: 0
})

// 最近活动
const recentActivities = ref([])

// 当前时间
const currentTime = ref('')
let timeTimer = null

// 图表引用
const categoryChartRef = ref(null)
const userGrowthChartRef = ref(null)
let categoryChart = null
let userGrowthChart = null

// 获取统计数据
async function fetchStats() {
    try {
        const res = await getDashboardStats()
        if (res.code === 200 && res.data) {
            stats.value = {
                userCount: res.data.userCount || 0,
                questionBankCount: res.data.questionBankCount || 0,
                questionCount: res.data.questionCount || 0,
                noteCount: res.data.noteCount || 0
            }
            // 更新图表数据
            if (res.data.categoryStats) {
                initCategoryChart(res.data.categoryStats)
            }
            if (res.data.userGrowth) {
                initUserGrowthChart(res.data.userGrowth)
            }
        }
    } catch (e) {
        console.warn('Dashboard API 未实现，使用默认数据')
        // API 未实现时使用默认数据
        stats.value = {
            userCount: 0,
            questionBankCount: 0,
            questionCount: 0,
            noteCount: 0
        }
        initCategoryChart([{ value: 0, name: '暂无数据' }])
        initUserGrowthChart({
            dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            counts: [0, 0, 0, 0, 0, 0, 0]
        })
    }
}

// 更新当前时间
function updateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 初始化分类统计图
function initCategoryChart(data) {
    if (!categoryChartRef.value) return

    if (categoryChart) {
        categoryChart.dispose()
    }

    categoryChart = echarts.init(categoryChartRef.value)
    const option = {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold' }
            },
            data: data || [
                { value: 0, name: '暂无数据' }
            ]
        }]
    }
    categoryChart.setOption(option)
}

// 初始化用户增长趋势图
function initUserGrowthChart(data) {
    if (!userGrowthChartRef.value) return

    if (userGrowthChart) {
        userGrowthChart.dispose()
    }

    userGrowthChart = echarts.init(userGrowthChartRef.value)
    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: data?.dates || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            axisLine: { lineStyle: { color: '#ccc' } }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#ccc' } }
        },
        series: [{
            name: '新增用户',
            type: 'line',
            smooth: true,
            data: data?.counts || [0, 0, 0, 0, 0, 0, 0],
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(107, 114, 128, 0.3)' },
                    { offset: 1, color: 'rgba(107, 114, 128, 0.05)' }
                ])
            },
            lineStyle: { color: '#6b7280', width: 3 },
            itemStyle: { color: '#6b7280' }
        }]
    }
    userGrowthChart.setOption(option)
}

// 窗口大小变化时重绘图表
function handleResize() {
    categoryChart?.resize()
    userGrowthChart?.resize()
}

onMounted(async () => {
    await nextTick()
    updateTime()
    timeTimer = setInterval(updateTime, 1000)
    window.addEventListener('resize', handleResize)
    // 延迟初始化图表，确保 DOM 已渲染
    setTimeout(() => {
        fetchStats()
    }, 100)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (timeTimer) {
        clearInterval(timeTimer)
    }
    categoryChart?.dispose()
    userGrowthChart?.dispose()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
    padding: 20px;

    .stat-cards {
        margin-bottom: 10px;

        :deep(.el-col) {
            margin-bottom: 5px;
        }

        .stat-card {
            :deep(.el-card__body) {
                display: flex;
                align-items: center;
                padding: 20px;
            }

            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 16px;

                .el-icon {
                    font-size: 28px;
                    color: white;
                }

                &.primary {
                    background: linear-gradient(135deg, #6b7280, #9ca3af);
                }

                &.success {
                    background: linear-gradient(135deg, #059669, #34d399);
                }

                &.warning {
                    background: linear-gradient(135deg, #d97706, #fbbf24);
                }

                &.info {
                    background: linear-gradient(135deg, #3b82f6, #60a5fa);
                }
            }

            .stat-content {
                flex: 1;

                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1f2937;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 14px;
                    color: #6b7280;
                    margin: 4px 0;
                }
            }
        }
    }

    .chart-row {
        margin-bottom: 10px;

        :deep(.el-col) {
            margin-bottom: 5px;
        }

        .chart-card {
            .chart-container {
                height: 300px;
                width: 100%;
            }

            .recent-activity {
                max-height: 300px;
                overflow-y: auto;

                .activity-item {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px 0;
                    border-bottom: 1px solid #f3f4f6;

                    &:last-child {
                        border-bottom: none;
                    }

                    .activity-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        flex-shrink: 0;

                        .el-icon {
                            font-size: 18px;
                            color: white;
                        }

                        &.user {
                            background: #6b7280;
                        }

                        &.question {
                            background: #059669;
                        }

                        &.note {
                            background: #3b82f6;
                        }

                        &.message {
                            background: #d97706;
                        }
                    }

                    .activity-content {
                        flex: 1;

                        .activity-text {
                            font-size: 14px;
                            color: #374151;
                            line-height: 1.5;
                        }

                        .activity-time {
                            font-size: 12px;
                            color: #9ca3af;
                            margin-top: 4px;
                        }
                    }
                }
            }

            .system-info {
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #f3f4f6;

                    &:last-child {
                        border-bottom: none;
                    }

                    .info-label {
                        font-size: 14px;
                        color: #6b7280;
                    }

                    .info-value {
                        font-size: 14px;
                        color: #1f2937;
                        font-weight: 500;
                    }
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .admin-dashboard {
        padding: 12px;
    }
}
</style>
