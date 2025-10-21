export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'Неизвестная ошибка. Попробуйте позже.';

  if (typeof error === 'string') {
    switch (error) {
      case 'CredentialsSignin':
        return 'Неверный email или пароль';
      case 'OAuthAccountNotLinked':
        return 'Этот email уже привязан к другому способу входа';
      case 'AccessDenied':
        return 'Доступ запрещен';
      case 'Configuration':
        return 'Ошибка конфигурации авторизации';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
      case 'SessionRequired':
        return 'Ошибка авторизации. Попробуйте снова.';
      default:
        return error;
    }
  }

  if (typeof error === 'object' && error !== null) {
    const anyErr = error as any;
    if (anyErr?.detail === 'EMAIL_NOT_VERIFIED') return 'Email не подтвержден. Мы отправили код на вашу почту.';
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error === 'string') return anyErr.error;
    if (typeof anyErr.detail === 'string') return anyErr.detail;
  }

  return 'Ошибка входа. Проверьте данные и попробуйте снова.';
}


