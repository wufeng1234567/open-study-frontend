import request from '@/utils/request'

export function listComments(noteId, pageNum, pageSize) {
  return request({
    url: '/notes/comment/list',
    method: 'get',
    params: { noteId, pageNum, pageSize }
  })
}

export function listReplies(commentId, pageNum, pageSize) {
  return request({
    url: '/notes/comment/replies',
    method: 'get',
    params: { parentId: commentId, pageNum, pageSize }
  })
}

export function getCommentThread(commentId) {
  return request({
    url: `/notes/comment/thread/${commentId}`,
    method: 'get'
  })
}

export function createComment(data) {
  return request({
    url: '/notes/comment/create',
    method: 'post',
    data: {
      noteId: data.noteId,
      parentId: data.parentId,
      replyToUserId: data.replyToUserId,
      replyToUserName: data.replyToUserName,
      content: data.content
    }
  })
}

export function deleteComment(id) {
  return request({
    url: `/notes/comment/delete/${id}`,
    method: 'delete'
  })
}
