/**
 * Google OAuth утилиты для браузера
 */
import { useGoogleLogin, useGoogleOneTap } from '@react-oauth/google';

// Google OAuth конфигурация
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

/**
 * Хук для авторизации через Google
 */
export const useGoogleAuth = () => {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google login successful:', tokenResponse);
      return tokenResponse;
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      throw new Error('Ошибка авторизации через Google');
    },
    scope: 'openid email profile',
  });

  return googleLogin;
};

/**
 * Декодирование JWT токена Google
 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Ошибка декодирования JWT:', error);
    throw new Error('Неверный JWT токен');
  }
};

/**
 * Получение информации о пользователе из JWT токена Google
 */
export const getGoogleUserInfo = async (credential: string): Promise<GoogleUserInfo> => {
  try {
    const payload = decodeJWT(credential);
    console.log('JWT payload от Google:', payload);
    
    const userInfo = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified_email: payload.email_verified || false,
    };
    
    console.log('Обработанные данные пользователя:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    throw new Error('Не удалось получить данные пользователя');
  }
};
