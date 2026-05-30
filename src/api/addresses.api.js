import api from '../utils/axios'

export const getAddresses  = (customerId)         => api.get(`/api/customers/${customerId}/addresses`)
export const createAddress = (customerId, data)    => api.post(`/api/customers/${customerId}/addresses`, data)
