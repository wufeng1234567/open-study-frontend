import request from '@/utils/request'

// 查询用户题库收藏列表
export function listFavoriteBank(query) {
  return request({
    url: '/favoriteBank/favoriteBank/list',
    method: 'get',
    params: query
  })
}

// 查询用户题库收藏列表 不分页获取完整题库收藏数据
export function listFavoriteBankAll(query) {
  return request({
    url: '/favoriteBank/favoriteBank/all',
    method: 'get',
    params: query
  })
}
// 查询用户题库收藏详细
export function getFavoriteBank(favoriteId) {
  return request({
    url: '/favoriteBank/favoriteBank/' + favoriteId,
    method: 'get'
  })
}

// 验证题库是否存在
export function checkBankExists(bankId) {
  return request({
    url: '/favoriteBank/favoriteBank/check/' + bankId,
    method: 'get'
  })
}

// 查询所有题库列表（用于下拉选择）
export function listQuestionBankAll() {
  return request({
    url: '/questionBank/questionBank/all',
    method: 'get'
  })
}

// 根据题库ID查询题库详情
export function getBankInfo(bankId) {
  return request({
    url: '/questionBank/questionBank/' + bankId,
    method: 'get'
  })
}

// 新增用户题库收藏
export function addFavoriteBank(data) {
  return request({
    url: '/favoriteBank/favoriteBank',
    method: 'post',
    data: data
  })
}

// 修改用户题库收藏
export function updateFavoriteBank(data) {
  return request({
    url: '/favoriteBank/favoriteBank',
    method: 'put',
    data: data
  })
}

// 删除用户题库收藏
export function delFavoriteBank(favoriteId) {
  return request({
    url: '/favoriteBank/favoriteBank/' + favoriteId,
    method: 'delete'
  })
}

// 导出用户题库收藏
export function exportFavoriteBank(query) {
  return request({
    url: '/favoriteBank/favoriteBank/export',
    method: 'get',
    params: query
  })
}

// 新增：检查用户是否已收藏题库
export function checkBankFavoriteExists(userId, bankId) {
  return request({
    url: `/favoriteBank/favoriteBank/checkFavorite/${userId}/${bankId}`,
    method: 'get'
  })
}

// 新增：根据用户ID和题库ID删除收藏
export function deleteFavoriteBankByUserAndBank(userId, bankId) {
  return request({
    url: `/favoriteBank/favoriteBank/deleteByUserAndBank/${userId}/${bankId}`,
    method: 'delete'
  })
}
