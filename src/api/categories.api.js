import api from '../utils/axios'

export const getCategories  = ()     => api.get('/api/categories')
export const createCategory = (data) => api.post('/api/categories', data)
