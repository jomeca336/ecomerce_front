import api from '../utils/axios'

export const getCustomers    = ()           => api.get('/api/customers')
export const getCustomerById = (id)         => api.get(`/api/customers/${id}`)
export const createCustomer  = (data)       => api.post('/api/customers', data)
export const updateCustomer  = (id, data)   => api.put(`/api/customers/${id}`, data)
export const deleteCustomer      = (id)     => api.delete(`/api/customers/${id}`)
export const getDeletedCustomers = ()       => api.get('/api/customers/deleted')
export const restoreCustomer     = (id)     => api.put(`/api/customers/${id}/restore`)
export const getCustomerOrders   = (id)     => api.get(`/api/customers/${id}/orders`)
