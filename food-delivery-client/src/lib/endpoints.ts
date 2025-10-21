// Централизованные эндпоинты API клиента

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_PREFIX = '/api/v1';

export const endpoints = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    verifyEmail: `${API_PREFIX}/auth/email/verify`,
    resendVerification: `${API_PREFIX}/auth/email/resend`,
    passwordForgot: `${API_PREFIX}/auth/password/forgot`,
    passwordResend: `${API_PREFIX}/auth/password/resend`,
    passwordReset: `${API_PREFIX}/auth/password/reset`,
    google: `${API_PREFIX}/auth/google`,
    googleRegister: `${API_PREFIX}/auth/google/register`,
    me: `${API_PREFIX}/auth/me`,
    refresh: `${API_PREFIX}/auth/refresh`,
  },
  restaurants: {
    root: `${API_PREFIX}/restaurants`,
    byId: (id: number | string) => `${API_PREFIX}/restaurants/${id}`,
    menu: (restaurantId: number | string) => `${API_PREFIX}/restaurants/${restaurantId}/menu`,
  },
  orders: {
    root: `${API_PREFIX}/orders`,
    byId: (id: number | string) => `${API_PREFIX}/orders/${id}`,
  },
  products: {
    categories: `${API_PREFIX}/products/categories`,
    root: `${API_PREFIX}/products/`,
    byId: (id: number | string) => `${API_PREFIX}/products/${id}`,
    cart: `${API_PREFIX}/cart/`,
    cartItem: (itemId: number | string) => `${API_PREFIX}/cart/${itemId}`,
  },
  favorites: {
    root: `${API_PREFIX}/favorites/`,
    remove: (productId: number | string) => `${API_PREFIX}/favorites/${productId}`,
    check: (productId: number | string) => `${API_PREFIX}/favorites/check/${productId}`,
  },
  payments: {
    create: `${API_PREFIX}/payments/create`,
    byId: (paymentId: number | string) => `${API_PREFIX}/payments/${paymentId}`,
    order: (orderId: number | string) => `${API_PREFIX}/payments/order/${orderId}`,
  },
  delivery: {
    settings: `${API_PREFIX}/delivery/settings`,
    calculate: `${API_PREFIX}/delivery/calculate`,
    available: `${API_PREFIX}/delivery/available`,
    zones: `${API_PREFIX}/delivery/zones`,
    workingHours: `${API_PREFIX}/delivery/working-hours`,
  },
  support: {
    settings: `${API_PREFIX}/support/settings`,
  },
} as const;


