// 通用选项解析函数，安全处理各种格式
export function parseOptions(rawOptions, type = 'single') {
  // 判断题固定选项
  if (type === 'truefalse') {
    return ['正确', '错误']
  }

  // 如果是 null / undefined / 空字符串
  if (!rawOptions) {
    return []
  }

  // 如果已经是数组，直接返回
  if (Array.isArray(rawOptions)) {
    return rawOptions.filter(opt => opt !== null && opt !== undefined).map(String)
  }

  // 如果是字符串
  if (typeof rawOptions === 'string') {
    let str = rawOptions.trim()
    if (!str) return []

    // 尝试 JSON 解析
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) {
        return parsed.filter(opt => opt !== null && opt !== undefined).map(String)
      }
    } catch (e) {
      // JSON 失败，按换行符分割
    }

    // 按换行、逗号、分号等常见分隔符分割
    return str
      .split(/[\n,;，；]+/)
      .map(s => s.trim())
      .filter(s => s !== '')
  }

  // 其他类型（如数字、对象）一律转为空数组
  console.warn('无法解析的 options 格式:', rawOptions)
  return []
}

// 格式化答案显示
export function formatAnswer(answer, type) {
  if (answer === undefined || answer === null) return ''
  
  if (type === 'multiple') {
    if (Array.isArray(answer)) {
      return answer.map(a => {
        if (typeof a === 'number') {
          return String.fromCharCode(65 + a)
        }
        return a
      }).join(', ')
    }
    return String(answer)
  } else if (type === 'single') {
    if (typeof answer === 'number') {
      return String.fromCharCode(65 + answer)
    }
    return String(answer)
  } else if (type === 'truefalse') {
    return answer === 0 ? '正确' : '错误'
  }
  
  return String(answer)
}

// 格式化主干内容
export function formatMainContent(content) {
  if (!content) return ''
  return content.replace(/___(\d+)___/g, '<strong style="color: #409eff; text-decoration: underline;">[$1]</strong>')
}

/**
 * 将数字题型转换为文本
 * @param {number|string} type - 题型（1-7或'single'等）
 * @returns {string} 题型文本
 */
export const getQuestionTypeText = (type) => {
  if (type == null) return '未知题型'
  
  // 如果type是字符串（如'single', 'multiple'），先转换为数字
  let typeNum = type
  if (typeof type === 'string') {
    const typeMap = {
      'single': 1,
      'multiple': 2,
      'judge': 3,
      'fill': 4,
      'essay': 5,
      'reading': 6,
      'cloze': 7
    }
    typeNum = typeMap[type] || 0
  }
  
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题',
    6: '阅读理解',
    7: '完形填空'
  }
  return typeMap[typeNum] || '未知题型'
}

/**
 * 获取题型CSS类
 * @param {number|string} type - 题型
 * @returns {string} CSS类名
 */
export const getQuestionTypeClass = (type) => {
  let typeNum = type
  if (typeof type === 'string') {
    const typeMap = {
      'single': 1,
      'multiple': 2,
      'judge': 3,
      'fill': 4,
      'essay': 5,
      'reading': 6,
      'cloze': 7
    }
    typeNum = typeMap[type] || 0
  }
  
  const classMap = {
    1: 'type-single',
    2: 'type-multiple',
    3: 'type-truefalse',
    4: 'type-fillblank',
    5: 'type-essay',
    6: 'type-reading',
    7: 'type-cloze'
  }
  return classMap[typeNum] || ''
}

/**
 * 格式化正确答案（特别是多选题）
 * @param {string|array} answer - 原始答案
 * @param {number} questionType - 题型
 * @returns {string|array} 格式化后的答案
 */
export const formatCorrectAnswer = (answer, questionType) => {
  if (!answer) return questionType === 2 ? [] : ''
  
  // 如果是多选题（类型2）
  if (questionType === 2) {
    try {
      if (typeof answer === 'string') {
        // 尝试解析JSON
        const parsed = JSON.parse(answer)
        if (Array.isArray(parsed)) {
          return parsed
        }
        // 如果是逗号分隔的字符串
        return answer.split(',').map(item => item.trim()).filter(Boolean)
      } else if (Array.isArray(answer)) {
        return answer
      }
    } catch (e) {
      // 如果不是JSON，可能是逗号分隔
      if (typeof answer === 'string') {
        return answer.split(',').map(item => item.trim()).filter(Boolean)
      }
    }
  }
  
  return answer
}