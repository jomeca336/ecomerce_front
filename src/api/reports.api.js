import api from '../utils/axios'

export const getBestSellingProducts = () => api.get('/api/report/best-selling-products')
export const getMonthlyIncome       = () => api.get('/api/report/monthly-income')
export const getTopCustomers        = () => api.get('/api/report/top-customers')
export const getLowStockProducts    = () => api.get('/api/report/low-stock-products')
