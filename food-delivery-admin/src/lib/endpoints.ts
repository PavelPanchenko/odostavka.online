// Централизованные эндпоинты для админ-панели

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_PREFIX = '/api/v1';

export const endpoints = {
  admin: {
    delivery: {
      settings: `/admin/delivery/settings`,
    },
    support: {
      settings: `/support/settings`,
      byId: (id: number | string) => `/support/settings/${id}`,
    },
  },
  delivery: {
    calculate: `/delivery/calculate`,
    available: `/delivery/available`,
  },
} as const;


