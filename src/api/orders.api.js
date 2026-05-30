import api from '../utils/axios'

export const getOrders   = (page = 0, size = 10) => api.get(`/api/Order?page=${page}&size=${size}`)
export const getOrderById = (id)                  => api.get(`/api/Order/${id}`)
export const createOrder  = (data)                => api.post('/api/Order', data)
export const payOrder     = (id)                  => api.get(`/api/Order/${id}/pay`)
export const shipOrder    = (id)                  => api.get(`/api/Order/${id}/ship`)
export const deliverOrder = (id)                  => api.get(`/api/Order/${id}/deliver`)
export const cancelOrder  = (id)                  => api.get(`/api/Order/${id}/cancel`)
