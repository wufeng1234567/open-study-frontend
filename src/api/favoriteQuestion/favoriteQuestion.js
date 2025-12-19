import request from '@/utils/request'

// 查询用户题目收藏（支持复习功能）列表
export function listFavoriteQuestion(query) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion/list',
    method: 'get',
    params: query
  })
}

// 验证题目是否存在
export function checkQuestionExists(questionId) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion/check/' + questionId,
    method: 'get'
  })
}

// 查询用户题目收藏（支持复习功能）详细
export function getFavoriteQuestion(favoriteId) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion/' + favoriteId,
    method: 'get'
  })
}

// 新增用户题目收藏（支持复习功能）
export function addFavoriteQuestion(data) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion',
    method: 'post',
    data: data
  })
}

// 修改用户题目收藏（支持复习功能）
export function updateFavoriteQuestion(data) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion',
    method: 'put',
    data: data
  })
}

// 删除用户题目收藏（支持复习功能）
export function delFavoriteQuestion(favoriteId) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion/' + favoriteId,
    method: 'delete'
  })
}

// 检查用户是否已收藏题目
export function checkQuestionFavoriteExists(userId, questionId) {
  return request({
    url: `/favoriteQuestion/favoriteQuestion/checkFavorite/${userId}/${questionId}`,
    method: 'get'
  })
}

// 根据用户ID和题目ID删除收藏
export function deleteFavoriteQuestionByUserAndQuestion(userId, questionId) {
  return request({
    url: `/favoriteQuestion/favoriteQuestion/deleteByUserAndQuestion/${userId}/${questionId}`,
    method: 'delete'
  })
}

// 查询用户题目收藏列表（不分页）- 对应后端的 /all 接口
export function listFavoriteQuestionAll(query) {
  return request({
    url: '/favoriteQuestion/favoriteQuestion/all',
    method: 'get',
    params: query
  })
}

// 为了兼容之前的调用，添加别名方法
export const listUserQuestionFavorite = listFavoriteQuestionAll