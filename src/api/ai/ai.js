import request from '@/utils/request'
import { getToken } from '@/utils/auth'

// 聊天
export function chat(data) {
    return request({
        url: '/ai/chat',
        method: 'post',
        data: data
    })
}

// 切换模型
export function switchModel(provider) {
    return request({
        url: '/ai/switch-model',
        method: 'get',
        params: { provider: provider }
    })
}

// 获取模型列表
export function getModels() {
    return request({
        url: '/ai/models',
        method: 'get'
    })
}

// 生成题目（非流式，保留备用）
export function generateQuestions(data) {
    return request({
        url: '/ai/generate/questions',
        method: 'post',
        data: data,
        timeout: 120000
    })
}

// 生成阅读理解题（非流式，保留备用）
export function generateReadingComprehension(data) {
    return request({
        url: '/ai/generate/reading',
        method: 'post',
        data: data,
        timeout: 120000
    })
}



// 流式生成普通题目（智能解析版）
export async function generateQuestionsStream(knowledgePoint, questionType, count, provider, onMessage, onComplete, onError) {
    const params = new URLSearchParams({ knowledgePoint, questionType, count, provider })
    const url = `${import.meta.env.VITE_APP_BASE_API}/ai/generate/questions/stream?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let lastParsedJson = null

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)

            if (chunk && chunk !== '[DONE]') {
                fullContent += chunk

                // 实时显示原始内容
                onMessage?.(fullContent)

                // 尝试实时解析 JSON（如果能解析成功就保存）
                try {
                    const parsed = JSON.parse(fullContent)
                    lastParsedJson = parsed
                } catch (e) {
                    // 解析失败是正常的，继续累积
                }
            }
        }

        // 流结束后，优先使用实时解析成功的 JSON
        if (lastParsedJson) {
            console.log('实时解析成功，题目数量:', Array.isArray(lastParsedJson) ? lastParsedJson.length : 1)
            onComplete?.(lastParsedJson)
        } else {
            // 如果实时解析失败，尝试修复后再解析
            const fixed = fixJsonContent(fullContent)
            console.log('修复后的内容:', fixed.substring(0, 500))
            try {
                const parsed = JSON.parse(fixed)
                console.log('修复后解析成功')
                onComplete?.(parsed)
            } catch (e) {
                console.error('最终解析失败，原始内容:', fullContent)
                // 🔥 不要直接调用 onError，而是传递原始内容让前端尝试处理
                onComplete?.(fullContent)
            }
        }
    } catch (error) {
        onError?.(error)
        throw error
    }
}

// 流式生成组合题（智能解析版）
export async function generateReadingComprehensionStream(requirement, questionCount, provider, onMessage, onComplete, onError) {
    const params = new URLSearchParams({ requirement, questionCount, provider })
    const url = `${import.meta.env.VITE_APP_BASE_API}/ai/generate/reading/stream?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let lastParsedJson = null

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)

            if (chunk && chunk !== '[DONE]') {
                fullContent += chunk
                onMessage?.(fullContent)

                try {
                    const parsed = JSON.parse(fullContent)
                    lastParsedJson = parsed
                } catch (e) { }
            }
        }

        if (lastParsedJson) {
            onComplete?.(lastParsedJson)
        } else {
            const fixed = fixJsonContent(fullContent)
            try {
                onComplete?.(JSON.parse(fixed))
            } catch (e) {
                onError?.(new Error('JSON 解析失败'))
            }
        }
    } catch (error) {
        onError?.(error)
        throw error
    }
}

// 修复 JSON 格式
function fixJsonContent(content) {
    if (!content) return ''

    let fixed = content
        .replace(/data:\s*/g, '')
        .replace(/\[DONE\]/g, '')
        .trim()

    // 🔥 关键修复：处理字符串内部未转义的双引号
    // 匹配 "key": "value 中包含 " 未转义引号" 的情况
    fixed = fixed.replace(/"([^"]*?)"([^"]*?)"([^"]*?)"/g, function (match, before, middle, after) {
        // 如果 middle 看起来像是正常的文本（不是 JSON 结构），就转义内部引号
        return '"' + before + '\\"' + middle + '\\"' + after + '"'
    })

    // 更简单的方法：找到所有字符串值，转义内部的双引号
    fixed = fixed.replace(/:\s*"([^"]*)"/g, function (match, value) {
        // 将字符串内部的 " 替换为 \"
        const escaped = value.replace(/(?<!\\)"/g, '\\"')
        return ': "' + escaped + '"'
    })

    // 找到最后一个完整的对象或数组
    const lastCompleteIndex = Math.max(
        fixed.lastIndexOf('}]'),
        fixed.lastIndexOf('"}'),
        fixed.lastIndexOf(']'),
        fixed.lastIndexOf('}')
    )
    if (lastCompleteIndex > 0 && lastCompleteIndex < fixed.length - 1) {
        fixed = fixed.substring(0, lastCompleteIndex + 1)
    }

    // 补全缺失的括号
    const openBrackets = (fixed.match(/\[/g) || []).length
    const closeBrackets = (fixed.match(/\]/g) || []).length
    if (openBrackets > closeBrackets) {
        fixed += ']'.repeat(openBrackets - closeBrackets)
    }

    const openBraces = (fixed.match(/\{/g) || []).length
    const closeBraces = (fixed.match(/\}/g) || []).length
    if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces)
    }

    return fixed
}

// ========== 新增非流式生成接口（一次性返回完整结果） ==========

/**
 * 生成普通题目（非流式，一次性返回）
 */
export function generateQuestionsSync(data) {
    return request({
        url: '/ai/generate/questions/sync',
        method: 'post',
        data: data,
        timeout: 120000  // 2分钟超时
    })
}

// 生成组合题/阅读理解题（非流式，一次性返回）
export function generateReadingComprehensionSync(data) {
    return request({
        url: '/ai/generate/composite/sync',  // 改这个地址
        method: 'post',
        data: data,
        timeout: 120000
    })
}

// ========== 题库上下文相关 ==========

/**
 * 获取题库AI上下文信息（题库名、题目数、历史消息数）
 */
export function getBankContextInfo(bankId) {
    return request({
        url: `/ai/bank/context/${bankId}`,
        method: 'get'
    })
}

/**
 * 清空题库对话上下文
 */
export function clearBankConversation(bankId) {
    return request({
        url: `/ai/conversation/bank/${bankId}`,
        method: 'delete'
    })
}

/**
 * 生成题目（带题库上下文）
 */
export function generateQuestionsWithContext(data) {
    return request({
        url: '/ai/generate/questions/sync',
        method: 'post',
        data: data,
        timeout: 120000
    })
}

/**
 * 助手流式聊天
 * @param {string} message - 消息内容
 * @param {function} onChunk - 收到数据块时的回调
 * @param {function} onComplete - 完成时的回调
 * @param {function} onError - 错误时的回调
 * @param {AbortSignal} signal - 取消信号
 * @param {string} provider - AI提供商
 */
export async function assistantStream(message, onChunk, onComplete, onError, signal, provider, userId) {
    const params = new URLSearchParams({ message })
    if (provider) params.append('provider', provider)
    if (userId != null && userId !== '') params.append('userId', userId)
    const url = `${import.meta.env.VITE_APP_BASE_API}/ai/assistant/stream?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            signal  // ✅ 传入 signal，支持取消
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            let chunk = decoder.decode(value)

            // 清洗数据
            chunk = chunk
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^data:\s*/, ''))
                .join('')

            if (chunk) {
                fullContent += chunk
                onChunk?.(fullContent)
            }
        }
        onComplete?.(fullContent)
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('请求已取消')
            return
        }
        onError?.(error)
    }
}

// 获取对话历史
export function getConversationHistory(sessionId, userId) {
    return request({
        url: `/ai/conversation/${sessionId}`,
        method: 'get',
        params: { userId }
    })
}

// 清空对话
export function clearConversation(sessionId, userId) {
    return request({
        url: `/ai/conversation/${sessionId}`,
        method: 'delete',
        params: { userId }
    })
}


/**
 * 题目智能解析（流式）
 * @param {string} question - 题目内容
 * @param {string} questionType - 题型
 * @param {string} options - 选项（JSON字符串）
 * @param {string} correctAnswer - 正确答案
 * @param {function} onChunk - 收到数据块时的回调
 * @param {function} onComplete - 完成时的回调
 * @param {function} onError - 错误时的回调
 * @param {string} provider - AI提供商
 */
export async function analyzeQuestionStream(question, questionType, options, correctAnswer, onChunk, onComplete, onError, provider, userId) {
    const params = new URLSearchParams({ question })
    if (questionType) params.append('questionType', questionType)
    if (options) params.append('options', options)
    if (correctAnswer) params.append('correctAnswer', correctAnswer)
    if (provider) params.append('provider', provider)
    if (userId != null && userId !== '') params.append('userId', userId)

    const url = `${import.meta.env.VITE_APP_BASE_API}/ai/analyze/question/stream?${params.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            let chunk = decoder.decode(value)

            // 清洗数据：去除 SSE 格式的 "data:" 前缀
            chunk = chunk
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^data:\s*/, ''))
                .join('')

            if (chunk) {
                fullContent += chunk
                onChunk?.(fullContent)
            }
        }
        onComplete?.(fullContent)
    } catch (error) {
        onError?.(error)
    }
}