/**
 * Утилита для обработки ошибок API
 */

export function getErrorMessage(error: any, defaultMessage: string = 'Произошла ошибка'): string {
  // Обрабатываем ошибки от FastAPI/Pydantic
  if (error.response?.data?.detail) {
    // Если detail - это строка
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    // Если detail - это массив ошибок валидации (Pydantic)
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail
        .map((err: any) => {
          const field = err.loc?.slice(1).join('.') || 'unknown';
          return `${field}: ${err.msg}`;
        })
        .join('; ');
    }
  }
  
  // Обрабатываем другие форматы ошибок
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Обрабатываем ошибки сети
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
}

/**
 * Логирует ошибку в консоль с контекстом
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}]`, {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    error
  });
}

