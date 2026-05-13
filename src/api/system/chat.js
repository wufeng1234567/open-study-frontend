import request from '@/utils/request'

export function getConversations() {
  return request({
    url: '/system/chat/conversations',
    method: 'get'
  })
}

export function getChatHistory(otherUserId, page = 1, size = 20) {
  return request({
    url: '/system/chat/history/' + otherUserId,
    method: 'get',
    params: { page, size }
  })
}

export function sendMessage(data) {
  return request({
    url: '/system/chat/send',
    method: 'post',
    data
  })
}

export function markRead(senderId) {
  return request({
    url: '/system/chat/markRead/' + senderId,
    method: 'post'
  })
}

export function deleteMessage(messageId) {
  return request({
    url: '/system/chat/message/' + messageId,
    method: 'delete'
  })
}

export function deleteConversation(otherUserId) {
  return request({
    url: '/system/chat/conversation/' + otherUserId,
    method: 'delete'
  })
}

export function clearChatHistory(otherUserId) {
  return request({
    url: '/system/chat/history/clear/' + otherUserId,
    method: 'post'
  })
}

export function getUnreadCount() {
  return request({
    url: '/system/chat/unreadCount',
    method: 'get'
  })
}

export function syncChatToDatabase() {
  return request({
    url: '/system/chat/sync',
    method: 'post'
  })
}

export function searchUsers(keyword = '') {
  return request({
    url: '/system/chat/users',
    method: 'get',
    params: { keyword }
  })
}
