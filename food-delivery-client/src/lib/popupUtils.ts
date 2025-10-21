/**
 * Утилиты для работы с всплывающими окнами Google OAuth
 */

export const openGoogleAuthPopup = (url: string): Promise<Window | null> => {
  return new Promise((resolve, reject) => {
    // Размеры всплывающего окна для мобильных устройств
    const width = Math.min(400, window.innerWidth - 40);
    const height = Math.min(600, window.innerHeight - 40);
    
    // Центрируем окно
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      url,
      'googleAuth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no`
    );
    
    if (!popup) {
      reject(new Error('Не удалось открыть всплывающее окно. Проверьте настройки блокировщика всплывающих окон.'));
      return;
    }
    
    // Фокусируемся на всплывающем окне
    popup.focus();
    
    // Проверяем, закрылось ли окно
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        resolve(popup);
      }
    }, 1000);
    
    // Таймаут для закрытия окна
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error('Время ожидания истекло'));
      }
    }, 300000); // 5 минут
  });
};

export const getGoogleAuthUrl = (clientId: string, redirectUri: string): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
