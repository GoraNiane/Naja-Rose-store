import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { queryClient } from './lib/queryClient';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentRedirectPage } from './pages/PaymentRedirectPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { ProductFormPage } from './pages/admin/ProductFormPage';
import { StockPage } from './pages/admin/StockPage';
import { OrdersPage as AdminOrdersPage } from './pages/admin/OrdersPage';
import { SalesPage as AdminSalesPage } from './pages/admin/SalesPage';
import { CustomersPage as AdminCustomersPage } from './pages/admin/CustomersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SplashScreen } from './components/common/SplashScreen';

export function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SplashScreen
          duration={5000}
          onFinish={() => setIsSplashDone(true)}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isSplashDone ? 1 : 0.85,
            y: isSplashDone ? 0 : 6,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          <Routes>
            {/* Public Storefront Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="search" element={<ShopPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="product/:slug" element={<ProductDetailPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="checkout/payment-redirect" element={<PaymentRedirectPage />} />
              <Route path="checkout/success" element={<OrderSuccessPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders" element={<OrderDetailPage />} />
              <Route path="login" element={<Navigate to="/admin/login" replace />} />
              <Route path="admin/login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Back-office Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="sales" element={<AdminSalesPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/edit/:id" element={<ProductFormPage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="users" element={<AdminCustomersPage />} />
              <Route path="settings" element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Routes>
        </motion.div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
