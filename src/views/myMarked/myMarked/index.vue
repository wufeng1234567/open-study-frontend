<!-- src/views/MyMarked/MyMarked/index.vue -->
<template>
  <div class="app-container">
    <MyQuestion
      ref="myQuestionRef"
      question-type="marked"
      :header-title="headerTitle"
      :show-star-filter="false"
      :show-favorite-status-filter="false"
      :show-star="false"
      :show-favorite-status="false"
      :show-collect-actions="true"
      :show-study-stats="true"
      :empty-action-text="'暂无斩题，去练习'"
      :api-config="apiConfig"
      :question-banks="questionBanks"
      :user-store="userStore"
      @empty-action="goToQuestionBank"
    />
  </div>
</template>

<script setup name="MyMarked">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { getCurrentInstance } from 'vue'

// 组件导入
import MyQuestion from '@/components/MyQuestion/MyQuestion.vue'

// API导入
import { 
  listQuestionMarked,
  updateQuestionMarked,
  delQuestionMarked
} from '@/api/questionMarked/questionMarked'
import { getQuestionMain } from '@/api/questionMain/questionMain'
import { listQuestionBankAll } from '@/api/questionBank/questionBank'
import { useQuestionPractice } from '@/composables/useQuestionPractice'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()

const myQuestionRef = ref(null)
const questionBanks = ref([])

// 使用转换函数
const { transformQuestionForDisplay } = useQuestionPractice({}, { proxy }, { isFavoriteMode: false })

const headerTitle = computed(() => '我的斩题')

// 获取用户ID
const getCurrentUserId = () => {
  const userId = userStore.id || userStore.userId || userStore.user_id
  
  if (!userId) {
    console.error('无法获取用户ID，store内容:', userStore)
    return null
  }
  
  return userId
}

// 创建斩题转换函数
const customTransformQuestion = (questionData) => {
  try {
    const transformed = transformQuestionForDisplay(questionData)
    
    console.log('=== 斩题转换题目详情调试 ===')
    console.log('原始数据:', questionData)
    console.log('转换后数据:', transformed)
    
    return {
      ...transformed,
      id: questionData.id || questionData.questionId,
      questionType: questionData.questionType,
      options: transformed.options || [],
      text: transformed.text || questionData.questionText || '',
      analysis: transformed.analysis || questionData.analysis || '',
      correctAnswer: transformed.correctAnswer || questionData.answer || '',
      showAnalysis: true,
      difficulty: transformed.difficulty || questionData.difficulty || 2,
      // 斩题特有字段
      markedType: questionData.markedType || 2, // 默认难题
      markedStatus: questionData.markedStatus || 1
    }
  } catch (error) {
    console.error('转换斩题失败:', error)
    console.error('转换失败的数据:', questionData)
    
    return {
      id: questionData.id || questionData.questionId,
      type: getQuestionType(questionData.questionType),
      text: questionData.questionText || '',
      options: parseOptions(questionData.options),
      correctAnswer: questionData.answer || '',
      analysis: questionData.analysis || '',
      difficulty: questionData.difficulty || 2,
      showAnalysis: true,
      questionType: questionData.questionType,
      markedType: questionData.markedType || 2,
      markedStatus: questionData.markedStatus || 1
    }
  }
}

// 解析选项
const parseOptions = (options) => {
  if (!options) return []
  try {
    if (typeof options === 'string') {
      return JSON.parse(options)
    } else if (Array.isArray(options)) {
      return options
    }
  } catch (e) {
    console.error('解析选项失败:', e)
  }
  return []
}

// 获取题型字符串
const getQuestionType = (type) => {
  const typeMap = {
    1: 'single',
    2: 'multiple',
    3: 'judge',
    4: 'fill',
    5: 'essay',
    6: 'reading',
    7: 'cloze'
  }
  return typeMap[type] || 'single'
}

// 获取斩题类型文本
const getMarkedTypeText = (markedType) => {
  const typeMap = {
    1: '错题',
    2: '难题',
    3: '重点',
    4: '易错',
    5: '技巧'
  }
  return typeMap[markedType] || '斩题'
}

// 斩题API配置
const apiConfig = {
  // 列表API
  listApi: async (params) => {
    try {
      const userId = getCurrentUserId()
      
      if (!userId) {
        return Promise.reject(new Error('用户未登录'))
      }
      
      const response = await listQuestionMarked({
        ...params,
        userId,
        markedStatus: 1 // 只查询活跃状态的斩题
      })

      if (response.code !== 200) {
        return Promise.reject(new Error(response.msg || '获取斩题失败'))
      }

      const marks = response.rows || []

      // 并发获取题目详情和题库信息
      const enrichedPromises = marks.map(async (mark) => {
        try {
          // 获取题目详情
          const qRes = await getQuestionMain(mark.questionId)
          if (qRes.code === 200) {
            const questionData = qRes.data
            
            mark.questionDetail = {
              ...questionData,
              transformed: customTransformQuestion(questionData),
              questionType: questionData.questionType,
              options: questionData.options,
              answer: questionData.answer,
              analysis: questionData.analysis || '',
              difficulty: questionData.difficulty || 2
            }
            
            // 添加斩题类型文本
            mark.markedTypeText = getMarkedTypeText(mark.markedType)
            
            console.log(`斩题 ${mark.questionId}:`, {
              原始题型: questionData.questionType,
              转换后题型: mark.questionDetail.transformed?.type,
              斩题类型: mark.markedType,
              斩题类型文本: mark.markedTypeText
            })
          } else {
            mark.questionDetail = { 
              questionText: '[题目加载失败]',
              questionType: 0,
              transformed: customTransformQuestion({})
            }
          }

          // 获取题库信息
          if (mark.bankId) {
            const bankRes = await listQuestionBankAll({ id: mark.bankId })
            if (bankRes.code === 200 && bankRes.data && bankRes.data.length > 0) {
              mark.bankDetail = bankRes.data[0]
            }
          }
        } catch (error) {
          console.error(`加载斩题 ${mark.questionId} 详情失败:`, error)
          mark.questionDetail = { 
            questionText: '[网络错误]',
            questionType: 0,
            transformed: customTransformQuestion({})
          }
        }
        
        return mark
      })

      const enrichedMarks = await Promise.all(enrichedPromises)
      
      return {
        code: 200,
        rows: enrichedMarks,
        total: response.total || enrichedMarks.length
      }
    } catch (error) {
      console.error('获取斩题列表失败:', error)
      throw error
    }
  },
  
  // 删除API - 移除斩题
  deleteApi: async (markedId, options = {}) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return delQuestionMarked(markedId)
  },
  
  // 更新API - 更新斩题状态（如标记为已掌握）
  updateApi: async (data) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return updateQuestionMarked({
      ...data,
      userId: userId
    })
  },
  
  // 详情API
  detailApi: async (questionId) => {
    try {
      const response = await getQuestionMain(questionId)
      if (response.code === 200) {
        const questionData = response.data
        
        const transformed = transformQuestionForDisplay(questionData)
        
        console.log('=== 斩题详情API转换调试 ===')
        console.log('原始数据:', questionData)
        console.log('转换后数据:', transformed)
        
        return {
          ...response,
          data: {
            ...questionData,
            transformed: {
              ...transformed,
              id: questionId,
              questionType: questionData.questionType,
              showAnalysis: true,
              difficulty: questionData.difficulty || 2,
              analysis: questionData.analysis || ''
            }
          }
        }
      }
      return response
    } catch (error) {
      console.error('获取斩题详情失败:', error)
      throw error
    }
  },
  
  // 提供转换函数给MyQuestion组件使用
  transformQuestion: customTransformQuestion
}

// 加载题库列表
const loadQuestionBanks = async () => {
  try {
    const response = await listQuestionBankAll({})
    if (response.code === 200) {
      questionBanks.value = response.data || []
    }
  } catch (error) {
    console.error('加载题库列表失败:', error)
  }
}

const goToQuestionBank = () => {
  router.push('/questionPractice')
}

// 暴露方法
defineExpose({
  refresh: () => {
    if (myQuestionRef.value) {
      myQuestionRef.value.refresh()
    }
  }
})

onMounted(() => {
  loadQuestionBanks()
})
</script>

<style scoped lang="scss">
.app-container {
  height: 100%;
}
</style>