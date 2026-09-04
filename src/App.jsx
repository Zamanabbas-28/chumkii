import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import ThankYouPage from './pages/ThankYouPage'
import AdminLoginPage from './admin/pages/AdminLoginPage'
import AdminLayout from './admin/components/AdminLayout'
import AdminProtectedRoute from './admin/components/AdminProtectedRoute'
import AdminDashboardPage from './admin/pages/AdminDashboardPage'
import AdminOrdersPage from './admin/pages/AdminOrdersPage'
import AdminOrderDetailPage from './admin/pages/AdminOrderDetailPage'
import AdminPaymentsPage from './admin/pages/AdminPaymentsPage'
import AdminProductsPage from './admin/pages/AdminProductsPage'
import AdminSettingsPage from './admin/pages/AdminSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <AdminAuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment/:orderNumber" element={<PaymentPage />} />
              <Route path="/thank-you" element={<ThankYouPage />} />

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </AdminAuthProvider>
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
