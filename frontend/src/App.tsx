import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { SplashScreen } from './components/common/SplashScreen';
import { Spinner } from './components/ui/Spinner';

// Storefront routes (Lazy loaded on demand)
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const PaymentRedirectPage = lazy(() => import('./pages/PaymentRedirectPage').then((m) => ({ default: m.PaymentRedirectPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin Back-office routes (Lazy loaded on demand - isolated from storefront bundle)
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const StockPage = lazy(() => import('./pages/admin/StockPage').then((m) => ({ default: m.StockPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const AdminSalesPage = lazy(() => import('./pages/admin/SalesPage').then((m) => ({ default: m.SalesPage })));
const AdminCustomersPage = lazy(() => import('./pages/admin/CustomersPage').then((m) => ({ default: m.CustomersPage })));

function RouteLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-16">
      <Spinner size="md" />
    </div>
  );
}

export function App() {
  const [, setIsSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SplashScreen
          duration={1200}
          showOncePerSession={true}
          onFinish={() => setIsSplashDone(true)}
        />
        <div className="min-h-screen">
          <Suspense fallback={<RouteLoader />}>
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
          </Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

