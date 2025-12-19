// src/api/questionMarked/questionMarked.js
import request from '@/utils/request'

// 查询用户斩题（重点攻克题目）列表
export function listQuestionMarked(query) {
  return request({
    url: '/questionMarked/questionMarked/list',
    method: 'get',
    params: query
  })
}
// 查询用户斩题（重点攻克题目）列表 不分页
export function listQuestionMarkedAll(query) {
  return request({
    url: '/questionMarked/questionMarked/all',
    method: 'get',
    params: query
  })
}

// 查询用户斩题（重点攻克题目）详细
export function getQuestionMarked(markedId) {
  return request({
    url: '/questionMarked/questionMarked/' + markedId,
    method: 'get'
  })
}

// 新增用户斩题（重点攻克题目）
export function addQuestionMarked(data) {
  return request({
    url: '/questionMarked/questionMarked',
    method: 'post',
    data: data
  })
}

// 修改用户斩题（重点攻克题目）
export function updateQuestionMarked(data) {
  return request({
    url: '/questionMarked/questionMarked',
    method: 'put',
    data: data
  })
}

// 删除用户斩题（重点攻克题目）
export function delQuestionMarked(markedId) {
  return request({
    url: '/questionMarked/questionMarked/' + markedId,
    method: 'delete'
  })
}

// 检查用户是否已斩题
export function checkMarkedExists(params) {
  return request({
    url: '/questionMarked/questionMarked/check',
    method: 'get',
    params: params
  })
}



// 根据用户ID和题目ID删除斩题记录
export function deleteMarkedByUserAndQuestion(userId, questionId) {
  return request({
    url: `/questionMarked/questionMarked/deleteByUserAndQuestion/${userId}/${questionId}`,
    method: 'delete'
  })
}