import request from '@/utils/request'

// 查询轮播图管理列表
export function listCarousel(query) {
  return request({
    url: '/carousel/carousel/list',
    method: 'get',
    params: query
  })
}
// 查询轮播图列表不分页
export function listCarouselAll(query) {
  return request({
    url: '/carousel/carousel/all',
    method: 'get',
    params: query
  })
}


// 查询轮播图管理详细
export function getCarousel(id) {
  return request({
    url: '/carousel/carousel/' + id,
    method: 'get'
  })
}

// 新增轮播图管理
export function addCarousel(data) {
  return request({
    url: '/carousel/carousel',
    method: 'post',
    data: data
  })
}

// 修改轮播图管理
export function updateCarousel(data) {
  return request({
    url: '/carousel/carousel',
    method: 'put',
    data: data
  })
}

// 删除轮播图管理
export function delCarousel(id) {
  return request({
    url: '/carousel/carousel/' + id,
    method: 'delete'
  })
}
