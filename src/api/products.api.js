import api from '../utils/axios'

export const getProducts     = ()           => api.get('/api/products')
export const getProductById  = (id)         => api.get(`/api/products/${id}`)
export const createProduct   = (data)       => api.post('/api/products', data)
export const updateProduct   = (id, data)   => api.put(`/api/products/${id}`, data)
export const updateInventory = (id, data)   => api.put(`/api/products/${id}/inventory`, data)
export const deleteProduct      = (id)      => api.delete(`/api/products/${id}`)
export const getDeletedProducts = ()        => api.get('/api/products/deleted')
export const restoreProduct     = (id)      => api.put(`/api/products/${id}/restore`)
