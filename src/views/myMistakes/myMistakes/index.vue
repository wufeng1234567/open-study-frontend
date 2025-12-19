<!-- src/views/MyMistakes/MyMistakes/index.vue -->
<template>
  <div class="app-container">
    <MyQuestion
      ref="myQuestionRef"
      question-type="wrong"
      :header-title="headerTitle"
      :show-star-filter="true"
      :show-favorite-status-filter="false"
      :show-star="true"
      :show-favorite-status="false"
      :show-collect-actions="true"
      :show-study-stats="true"
      :empty-action-text="'暂无错题，去练习'"
      :api-config="apiConfig"
      :question-banks="questionBanks"
      :user-store="userStore"
      @empty-action="goToQuestionBank"
    />
  </div>
</template>

<script setup name="MyMistakes">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { getCurrentInstance } from 'vue'

// 组件导入
import MyQuestion from '@/components/MyQuestion/MyQuestion.vue'

// API导入
import { 
  listQuestionError,
  updateQuestionError,
  delQuestionError,
  checkUserErrorExists,
  recordOrUpdateError
} from '@/api/questionError/questionError'
import { getQuestionMain } from '@/api/questionMain/questionMain'
import { listQuestionBankAll } from '@/api/questionBank/questionBank'
import { useQuestionPractice } from '@/composables/useQuestionPractice'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()

const myQuestionRef = ref(null)
const questionBanks = ref([])

// ✅ 关键：使用与原始代码完全相同的转换函数
const { transformQuestionForDisplay } = useQuestionPractice({}, { proxy }, { isFavoriteMode: false })

const headerTitle = computed(() => '我的错题')

// ✅ 优化获取用户ID的函数
const getCurrentUserId = () => {
  // 尝试多种可能的字段
  const userId = userStore.id || userStore.userId || userStore.user_id
  
  if (!userId) {
    console.error('无法获取用户ID，store内容:', userStore)
    return null
  }
  
  return userId
}

// ✅ 创建与原始代码一致的转换函数
const customTransformQuestion = (questionData) => {
  try {
    // ✅ 使用与原始代码完全相同的转换函数
    const transformed = transformQuestionForDisplay(questionData)
    
    // ✅ 调试输出，确保数据格式正确
    console.log('=== 错题转换题目详情调试 ===')
    console.log('原始数据:', questionData)
    console.log('转换后数据:', transformed)
    console.log('转换后type:', transformed.type)
    console.log('转换后options:', transformed.options)
    console.log('转换后options类型:', typeof transformed.options)
    console.log('转换后options是数组:', Array.isArray(transformed.options))
    
    // ✅ 确保转换后的数据包含所有必要字段
    return {
      ...transformed,
      // 确保这些关键字段存在
      id: questionData.id || questionData.questionId,
      // 保留原始题型（数字）
      questionType: questionData.questionType,
      // 确保选项是数组格式
      options: transformed.options || [],
      // 确保有文本内容
      text: transformed.text || questionData.questionText || '',
      // 确保有解析
      analysis: transformed.analysis || questionData.analysis || '',
      // 确保有正确答案
      correctAnswer: transformed.correctAnswer || questionData.answer || '',
      // 确保显示解析
      showAnalysis: true,
      // 保留难度信息
      difficulty: transformed.difficulty || questionData.difficulty || 2,
      // 添加错题特有字段
      errorCount: questionData.errorCount || 1,
      lastErrorTime: questionData.lastErrorTime,
      isMastered: questionData.isMastered || 0
    }
  } catch (error) {
    console.error('转换错题失败:', error)
    console.error('转换失败的数据:', questionData)
    
    // 转换失败时返回基本结构
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
      errorCount: questionData.errorCount || 1,
      lastErrorTime: questionData.lastErrorTime,
      isMastered: questionData.isMastered || 0
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

// ✅ 错题API配置
const apiConfig = {
  // 列表API
  listApi: async (params) => {
    try {
      const userId = getCurrentUserId()
      
      if (!userId) {
        return Promise.reject(new Error('用户未登录'))
      }
      
      const response = await listQuestionError({
        ...params,
        userId,
        status: 1, // 只查询活跃状态的错题
        isMastered: 0 // 只查询未掌握的错题
      })

      if (response.code !== 200) {
        return Promise.reject(new Error(response.msg || '获取错题失败'))
      }

      const errors = response.rows || []

      // 并发获取题目详情和题库信息
      const enrichedPromises = errors.map(async (error) => {
        try {
          // 获取题目详情
          const qRes = await getQuestionMain(error.questionId)
          if (qRes.code === 200) {
            const questionData = qRes.data
            
            // ✅ 关键：确保questionDetail包含所有原始数据
            error.questionDetail = {
              ...questionData,
              // 确保有转换后的数据（与原始代码保持一致）
              transformed: customTransformQuestion(questionData),
              // 确保有原始题型
              questionType: questionData.questionType,
              // 确保有原始选项
              options: questionData.options,
              // 确保有原始答案
              answer: questionData.answer,
              // 确保有原始解析
              analysis: questionData.analysis || '',
              // 确保有难度
              difficulty: questionData.difficulty || 2
            }
            
            // ✅ 调试：检查数据格式
            console.log(`错题 ${error.questionId}:`, {
              原始题型: questionData.questionType,
              转换后题型: error.questionDetail.transformed?.type,
              原始选项: questionData.options,
              转换后选项: error.questionDetail.transformed?.options,
              选项是数组: Array.isArray(error.questionDetail.transformed?.options)
            })
          } else {
            error.questionDetail = { 
              questionText: '[题目加载失败]',
              questionType: 0,
              transformed: customTransformQuestion({})
            }
          }

          // 获取题库信息
          if (error.bankId) {
            const bankRes = await listQuestionBankAll({ id: error.bankId })
            if (bankRes.code === 200 && bankRes.data && bankRes.data.length > 0) {
              error.bankDetail = bankRes.data[0]
            }
          }
        } catch (error) {
          console.error(`加载错题 ${error.questionId} 详情失败:`, error)
          error.questionDetail = { 
            questionText: '[网络错误]',
            questionType: 0,
            transformed: customTransformQuestion({})
          }
        }
        
        return error
      })

      const enrichedErrors = await Promise.all(enrichedPromises)
      
      return {
        code: 200,
        rows: enrichedErrors,
        total: response.total || enrichedErrors.length
      }
    } catch (error) {
      console.error('获取错题列表失败:', error)
      throw error
    }
  },
  
  // 删除API - 移除错题
  deleteApi: async (errorId, options = {}) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return delQuestionError(errorId)
  },
  
  // 更新API - 更新错题状态（如标记为已掌握）
  updateApi: async (data) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return updateQuestionError({
      ...data,
      userId: userId
    })
  },
  
  // 详情API - ✅ 关键：确保与原始代码的数据格式一致
  detailApi: async (questionId) => {
    try {
      const response = await getQuestionMain(questionId)
      if (response.code === 200) {
        const questionData = response.data
        
        // ✅ 使用与原始代码相同的转换函数
        const transformed = transformQuestionForDisplay(questionData)
        
        // ✅ 调试输出，确保数据格式正确
        console.log('=== 错题详情API转换调试 ===')
        console.log('原始数据:', questionData)
        console.log('转换后数据:', transformed)
        console.log('转换后类型:', transformed.type)
        console.log('转换后选项:', transformed.options)
        console.log('选项是数组:', Array.isArray(transformed.options))
        
        return {
          ...response,
          data: {
            // 保留原始数据
            ...questionData,
            // 添加转换后的数据（与原始代码保持一致）
            transformed: {
              ...transformed,
              // 确保有ID
              id: questionId,
              // 确保有题型（数字）
              questionType: questionData.questionType,
              // 确保显示解析
              showAnalysis: true,
              // 确保有难度
              difficulty: questionData.difficulty || 2,
              // 确保有解析内容
              analysis: questionData.analysis || ''
            }
          }
        }
      }
      return response
    } catch (error) {
      console.error('获取错题详情失败:', error)
      throw error
    }
  },
  
  // ✅ 关键：提供转换函数给MyQuestion组件使用
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