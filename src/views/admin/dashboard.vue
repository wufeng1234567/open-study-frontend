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
                        <div class="stat-trend up">
                            <el-icon>
                                <Top />
                            </el-icon>
                            <span>较昨日 +12%</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon success">
                        <el-icon>
                            <Reading />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.courseCount }}</div>
                        <div class="stat-label">课程总数</div>
                        <div class="stat-trend up">
                            <el-icon>
                                <Top />
                            </el-icon>
                            <span>本周新增 +8</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon warning">
                        <el-icon>
                            <View />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.todayVisit }}</div>
                        <div class="stat-label">今日访问</div>
                        <div class="stat-trend down">
                            <el-icon>
                                <Bottom />
                            </el-icon>
                            <span>较昨日 -3%</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon danger">
                        <el-icon>
                            <ChatDotRound />
                        </el-icon>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.messageCount }}</div>
                        <div class="stat-label">未读消息</div>
                        <div class="stat-trend normal">
                            <span>共 {{ stats.totalMessage }} 条</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- ECharts 图表区域 -->
        <el-row :gutter="20" class="chart-row">
            <el-col :xs="24" :lg="12">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>近一周访问趋势</span>
                    </template>
                    <div ref="visitChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="12">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>课程分类统计</span>
                    </template>
                    <div ref="categoryChartRef" class="chart-container"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
            <el-col :xs="24" :lg="16">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>学习时长排行</span>
                    </template>
                    <div ref="rankChartRef" class="chart-container"></div>
                </el-card>
            </el-col>

            <el-col :xs="24" :lg="8">
                <el-card shadow="hover" class="chart-card">
                    <template #header>
                        <span>热门课程 Top5</span>
                    </template>
                    <div class="hot-course-list">
                        <div v-for="(course, index) in hotCourses" :key="index" class="course-item">
                            <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
                            <span class="name">{{ course.name }}</span>
                            <span class="count">{{ course.count }}人</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup name="AdminDashboard">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
// import { useRouter } from 'vue-router'
import { Switch, User, Reading, View, ChatDotRound, Top, Bottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// const router = useRouter()

// 统计数据
const stats = ref({
    userCount: 1234,
    courseCount: 56,
    todayVisit: 2345,
    messageCount: 18,
    totalMessage: 128
})

// 热门课程
const hotCourses = ref([
    { name: 'Vue3 从入门到精通', count: 1234 },
    { name: 'Spring Boot 实战', count: 987 },
    { name: '数据结构与算法', count: 856 },
    { name: 'Python 数据分析', count: 745 },
    { name: 'MySQL 数据库设计', count: 632 }
])

// 图表引用
const visitChartRef = ref(null)
const categoryChartRef = ref(null)
const rankChartRef = ref(null)
let visitChart = null
let categoryChart = null
let rankChart = null



// 初始化访问趋势图
function initVisitChart() {
    if (!visitChartRef.value) return

    visitChart = echarts.init(visitChartRef.value)
    const option = {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            axisLine: { lineStyle: { color: '#ccc' } }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#ccc' } }
        },
        series: [{
            name: '访问量',
            type: 'line',
            smooth: true,
            data: [820, 932, 901, 934, 1290, 1330, 1320],
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(103, 126, 234, 0.3)' },
                    { offset: 1, color: 'rgba(103, 126, 234, 0.05)' }
                ])
            },
            lineStyle: { color: '#667eea', width: 3 },
            itemStyle: { color: '#667eea' }
        }]
    }
    visitChart.setOption(option)
}

// 初始化分类统计图
function initCategoryChart() {
    if (!categoryChartRef.value) return

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
            data: [
                { value: 18, name: '前端开发' },
                { value: 12, name: '后端开发' },
                { value: 8, name: '数据库' },
                { value: 10, name: '算法' },
                { value: 8, name: '人工智能' }
            ]
        }]
    }
    categoryChart.setOption(option)
}

// 初始化排行图
function initRankChart() {
    if (!rankChartRef.value) return

    rankChart = echarts.init(rankChartRef.value)
    const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '10%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
            type: 'category',
            data: ['张三', '李四', '王五', '赵六', '钱七']
        },
        series: [{
            name: '学习时长(小时)',
            type: 'bar',
            data: [42, 38, 35, 30, 28],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#667eea' },
                    { offset: 1, color: '#764ba2' }
                ])
            }
        }]
    }
    rankChart.setOption(option)
}

// 窗口大小变化时重绘图表
function handleResize() {
    visitChart?.resize()
    categoryChart?.resize()
    rankChart?.resize()
}

onMounted(async () => {
    await nextTick()
    initVisitChart()
    initCategoryChart()
    initRankChart()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    visitChart?.dispose()
    categoryChart?.dispose()
    rankChart?.dispose()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
    padding: 20px;

    .switch-bar {
        text-align: right;
        margin-bottom: 20px;
    }

    .stat-cards {
        margin-bottom: 20px;

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
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }

                &.success {
                    background: linear-gradient(135deg, #67c23a, #85ce61);
                }

                &.warning {
                    background: linear-gradient(135deg, #e6a23c, #ebb563);
                }

                &.danger {
                    background: linear-gradient(135deg, #f56c6c, #f78989);
                }
            }

            .stat-content {
                flex: 1;

                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #303133;
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 14px;
                    color: #909399;
                    margin: 4px 0;
                }

                .stat-trend {
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;

                    &.up {
                        color: #67c23a;
                    }

                    &.down {
                        color: #f56c6c;
                    }

                    &.normal {
                        color: #909399;
                    }
                }
            }
        }
    }

    .chart-row {
        margin-bottom: 20px;

        .chart-card {
            .chart-container {
                height: 300px;
                width: 100%;
            }

            .hot-course-list {
                .course-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;

                    &:last-child {
                        border-bottom: none;
                    }

                    .rank {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: #f5f7fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 12px;
                        color: #909399;

                        &.top {
                            background: linear-gradient(135deg, #ffd700, #ffed4e);
                            color: #333;
                        }
                    }

                    .name {
                        flex: 1;
                        color: #303133;
                    }

                    .count {
                        color: #909399;
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