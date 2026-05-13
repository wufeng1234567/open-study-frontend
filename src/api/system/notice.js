import request from '@/utils/request'

// 查询公告列表
export function listNotice(query) {
  return request({
    url: '/system/notice/list',
    method: 'get',
    params: query
  })
}

// 查询公告详细
export function getNotice(noticeId) {
  return request({
    url: '/system/notice/' + noticeId,
    method: 'get'
  })
}

// 新增公告
export function addNotice(data) {
  return request({
    url: '/system/notice',
    method: 'post',
    data: data
  })
}

// 修改公告
export function updateNotice(data) {
  return request({
    url: '/system/notice',
    method: 'put',
    data: data
  })
}

// 删除公告
export function delNotice(noticeId) {
  return request({
    url: '/system/notice/' + noticeId,
    method: 'delete'
  })
}

// 获取顶部公告列表（带已读标记和未读总数，最多5条）
export function listTopNotice() {
  return request({ url: '/system/notice/listTop', method: 'get' })
}

// 获取全部公告列表（带已读标记，无 LIMIT，用于消息中心）
export function listAllNotice() {
  return request({ url: '/system/notice/listAll', method: 'get' })
}

// 标记单条已读
export function markRead(noticeId) {
  return request({ url: '/system/notice/markRead', method: 'post', params: { noticeId } })
}

// 全部标记已读
export function markReadAll(ids) {
  return request({ url: '/system/notice/markReadAll', method: 'post', params: { ids } })
}

// 获取未读总数
export function unreadCount() {
  return request({ url: '/system/notice/unreadCount', method: 'get' })
}

// 前台删除单条通知
export function deleteFrontNotice(noticeId) {
  return request({ url: '/system/notice/front/' + noticeId, method: 'delete' })
}

// 前台批量删除通知
export function deleteFrontNoticeBatch(noticeIds) {
  return request({ url: '/system/notice/front/batch/' + noticeIds.join(','), method: 'delete' })
}