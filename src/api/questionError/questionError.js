import request from '@/utils/request'

// 查询用户错题记录（支持复习与掌握跟踪）列表
export function listQuestionError(query) {
  return request({
    url: '/questionError/questionError/list',
    method: 'get',
    params: query
  })
}

// 查询用户错题记录（支持复习与掌握跟踪）列表 不分页
export function listQuestionErrorAll(query) {
  return request({
    url: '/questionError/questionError/all',
    method: 'get',
    params: query
  })
}

// 查询用户错题记录（支持复习与掌握跟踪）详细
export function getQuestionError(errorId) {
  return request({
    url: '/questionError/questionError/' + errorId,
    method: 'get'
  })
}

// 新增用户错题记录（支持复习与掌握跟踪）
export function addQuestionError(data) {
  return request({
    url: '/questionError/questionError',
    method: 'post',
    data: data
  })
}

// 修改用户错题记录（支持复习与掌握跟踪）
export function updateQuestionError(data) {
  return request({
    url: '/questionError/questionError',
    method: 'put',
    data: data
  })
}

// 删除用户错题记录（支持复习与掌握跟踪）
export function delQuestionError(errorId) {
  return request({
    url: '/questionError/questionError/' + errorId,
    method: 'delete'
  })
}

// ✅ 新增：检查当前用户对某题的错题记录是否存在
export function checkUserErrorExists(questionId) {
  return request({
    url: `/questionError/questionError/checkUserErrorExists/${questionId}`,
    method: 'get'
  })
}

// ✅ 新增：记录错题（智能方法）
export function recordOrUpdateError(data) {
  return request({
    url: '/questionError/questionError/recordOrUpdateError',
    method: 'post',
    data: data
  })
}