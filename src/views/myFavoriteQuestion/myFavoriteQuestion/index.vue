<!-- src/views/MyFavoriteQuestion/MyFavoriteQuestion/index.vue -->
<template>
  <div class="app-container">
    <MyQuestion
      ref="myQuestionRef"
      question-type="favorite"
      :header-title="headerTitle"
      :show-star-filter="true"
      :show-favorite-status-filter="true"
      :show-star="true"
      :show-favorite-status="true"
      :show-collect-actions="true"
      :show-study-stats="true"
      :empty-action-text="'去发现题目'"
      :api-config="apiConfig"
      :question-banks="questionBanks"
      :user-store="userStore"  
      @empty-action="goToQuestionBank"
    />
  </div>
</template>


<!-- src/views/favorite/MyFavoriteQuestion.vue -->
<script setup name="MyFavoriteQuestion">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { getCurrentInstance } from 'vue'

// 组件导入
import MyQuestion from '@/components/MyQuestion/MyQuestion.vue'

// API导入
import { 
  listFavoriteQuestion, 
  delFavoriteQuestion,
  updateFavoriteQuestion
} from '@/api/favoriteQuestion/favoriteQuestion'
import { getQuestionMain } from '@/api/questionMain/questionMain'
import { listQuestionBankAll } from '@/api/questionBank/questionBank'
import { useQuestionPractice } from '@/composables/useQuestionPractice'

const { proxy } = getCurrentInstance()
const router = useRouter()
const userStore = useUserStore()

const myQuestionRef = ref(null)
const questionBanks = ref([])

// ✅ 关键：使用与原始代码完全相同的转换函数
const { transformQuestionForDisplay } = useQuestionPractice({}, { proxy }, { isFavoriteMode: true })

const headerTitle = computed(() => '我的题目收藏')

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
    console.log('=== 转换题目详情调试 ===')
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
      difficulty: transformed.difficulty || questionData.difficulty || 2
    }
  } catch (error) {
    console.error('转换题目失败:', error)
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
      questionType: questionData.questionType
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

// ✅ 修复API配置，确保数据格式一致
const apiConfig = {
  // 列表API
  listApi: async (params) => {
    try {
      const userId = getCurrentUserId()
      
      if (!userId) {
        return Promise.reject(new Error('用户未登录'))
      }
      
      const response = await listFavoriteQuestion({
        ...params,
        userId,
        favoriteStatus: 1
      })

      if (response.code !== 200) {
        return Promise.reject(new Error(response.msg || '获取收藏失败'))
      }

      const favorites = response.rows || []

      // 并发获取题目详情和题库信息
      const enrichedPromises = favorites.map(async (fav) => {
        try {
          // 获取题目详情
          const qRes = await getQuestionMain(fav.questionId)
          if (qRes.code === 200) {
            const questionData = qRes.data
            
            // ✅ 关键：确保questionDetail包含所有原始数据
            fav.questionDetail = {
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
            console.log(`收藏题目 ${fav.questionId}:`, {
              原始题型: questionData.questionType,
              转换后题型: fav.questionDetail.transformed?.type,
              原始选项: questionData.options,
              转换后选项: fav.questionDetail.transformed?.options,
              选项是数组: Array.isArray(fav.questionDetail.transformed?.options)
            })
          } else {
            fav.questionDetail = { 
              questionText: '[题目加载失败]',
              questionType: 0,
              transformed: customTransformQuestion({})
            }
          }

          // 获取题库信息
          if (fav.bankId) {
            const bankRes = await listQuestionBankAll({ id: fav.bankId })
            if (bankRes.code === 200 && bankRes.data && bankRes.data.length > 0) {
              fav.bankDetail = bankRes.data[0]
            }
          }
        } catch (error) {
          console.error(`加载题目 ${fav.questionId} 详情失败:`, error)
          fav.questionDetail = { 
            questionText: '[网络错误]',
            questionType: 0,
            transformed: customTransformQuestion({})
          }
        }
        
        return fav
      })

      const enrichedFavorites = await Promise.all(enrichedPromises)
      
      return {
        code: 200,
        rows: enrichedFavorites,
        total: response.total || enrichedFavorites.length
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      throw error
    }
  },
  
  // 删除API - ✅ 修复：需要传递userId
  deleteApi: async (favoriteId, options = {}) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return delFavoriteQuestion(favoriteId)
  },
  
  // 更新API - ✅ 修复：需要传递userId
  updateApi: async (data) => {
    const userId = getCurrentUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }
    
    return updateFavoriteQuestion({
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
        console.log('=== 详情API转换调试 ===')
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
      console.error('获取题目详情失败:', error)
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