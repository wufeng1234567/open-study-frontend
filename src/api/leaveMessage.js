import request from '@/utils/request'

export const getLeaveMessageList = () => {
    return request({
        url: '/leaveMessage/list',
        method: 'get'
    })
}

export const addLeaveMessage = (data) => {
    return request({
        url: '/leaveMessage/add',
        method: 'post',
        data: data
    })
}

export const listMessage = (userName, content) => {
    return request({
        url: '/leaveMessage/admin/list',
        method: 'get',
        params: { userName, content }
    })
}

export const delMessage = (id) => {
    return request({
        url: `/leaveMessage/${id}`,
        method: 'delete'
    })
}

export const updateMessage = (data) => {
    return request({
        url: '/leaveMessage',
        method: 'put',
        data: data
    })
}

export const addMessage = (data) => {
    return request({
        url: '/leaveMessage/admin/add',
        method: 'post',
        data: data
    })
}
