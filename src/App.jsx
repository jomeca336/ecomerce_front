import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './router/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardHome from './pages/dashboard/DashboardHome'
import ProductListPage from './pages/products/ProductListPage'
import CategoryListPage from './pages/categories/CategoryListPage'
import CustomerListPage from './pages/customers/CustomerListPage'
import CustomerDetailPage from './pages/customers/CustomerDetailPage'
import OrderListPage from './pages/orders/OrderListPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="customers" element={<CustomerListPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
