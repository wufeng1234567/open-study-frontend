import request from '@/utils/request'

// 查询笔记关联的图片资源列表
export function listNoteImage(query) {
  return request({
    url: '/noteImage/noteImage/list',
    method: 'get',
    params: query
  })
}

// 查询笔记关联的图片资源详细
export function getNoteImage(id) {
  return request({
    url: '/noteImage/noteImage/' + id,
    method: 'get'
  })
}

// 新增笔记关联的图片资源
export function addNoteImage(data) {
  return request({
    url: '/noteImage/noteImage',
    method: 'post',
    data: data
  })
}

// 修改笔记关联的图片资源
export function updateNoteImage(data) {
  return request({
    url: '/noteImage/noteImage',
    method: 'put',
    data: data
  })
}

// 删除笔记关联的图片资源
export function delNoteImage(id) {
  return request({
    url: '/noteImage/noteImage/' + id,
    method: 'delete'
  })
}
