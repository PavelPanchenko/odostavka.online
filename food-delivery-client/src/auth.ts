import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { API_BASE_URL, endpoints } from "./lib/endpoints"
// util: извлечь exp из JWT без внешних зависимостей
function getJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    // Google OAuth Provider
    Google({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    
    // Credentials Provider для email/password
    Credentials({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email и пароль обязательны');
        }

        try {
          // Вызываем ваш бэкенд для авторизации (JSON: email/password)
          const response = await fetch(`${API_BASE_URL}${endpoints.auth.login}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            let message = 'Неверный email или пароль';
            try {
              const error = await response.json();
              message = error?.detail || message;
            } catch {
              // ignore parse error
            }
            throw new Error(message);
          }

          const authData = await response.json();
          console.log('✅ Авторизация через Credentials успешна');

          // Возвращаем данные пользователя + токены
          return {
            id: authData.user.id.toString(),
            email: authData.user.email,
            name: authData.user.name,
            username: authData.user.username,
            backend_access_token: authData.access_token,
            backend_refresh_token: authData.refresh_token,
          };
        } catch (error) {
          console.error('❌ Ошибка авторизации через Credentials:', error);
          throw error;
        }
      }
    }),
    // Provider для принятия токенов бэкенда без пароля (после верификации email, refresh и т.п.)
    Credentials({
      id: 'backendTokens',
      name: 'Backend Tokens',
      credentials: {
        id: { label: 'id', type: 'text' },
        email: { label: 'email', type: 'text' },
        name: { label: 'name', type: 'text' },
        username: { label: 'username', type: 'text' },
        access_token: { label: 'access_token', type: 'text' },
        refresh_token: { label: 'refresh_token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.access_token || !credentials?.refresh_token) {
          throw new Error('Tokens are required');
        }
        // Можно дополнительно верифицировать токен через /auth/me
        return {
          id: String(credentials.id || ''),
          email: String(credentials.email || ''),
          name: String(credentials.name || ''),
          username: String(credentials.username || ''),
          backend_access_token: String(credentials.access_token),
          backend_refresh_token: String(credentials.refresh_token),
        } as any;
      }
    }),
  ],
  callbacks: {
    async jwt(params: any) {
      const { token, account, profile, user } = params || {} as any;
      // При первом входе через Google
      if (account?.provider === "google" && profile) {
        console.log('🔐 JWT Callback: Первый вход через Google');
        
        // Сохраняем данные от Google в token
        token.google_id = profile.sub
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture
        
        // Вызываем ваш бэкенд для получения ваших токенов
        try {
          console.log('📤 Отправляем данные на бэкенд:', {
            google_id: profile.sub,
            email: profile.email,
            name: profile.name,
            picture: profile.picture
          });

          const response = await fetch(`${API_BASE_URL}${endpoints.auth.googleRegister}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_id: profile.sub,
              email: profile.email,
              name: profile.name,
              picture: profile.picture
            })
          });

          if (response.ok) {
            const authData = await response.json();
            console.log('✅ Токены получены от бэкенда');
            
            // Сохраняем токены от вашего бэкенда в JWT token
            token.backend_access_token = authData.access_token;
            token.backend_refresh_token = authData.refresh_token;
            token.backend_user = authData.user;
            token.backend_access_token_expires_at = getJwtExp(authData.access_token);
          } else {
            console.error('❌ Ошибка от бэкенда:', response.status);
          }
        } catch (error) {
          console.error('❌ Ошибка при вызове бэкенда:', error);
        }
      }
      
      // При первом входе через Credentials
      if ((account?.provider === "credentials" || account?.provider === 'backendTokens') && user) {
        console.log('🔐 JWT Callback: Первый вход через Credentials');
        
        // Сохраняем данные пользователя и токены
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.backend_access_token = user.backend_access_token;
        token.backend_refresh_token = user.backend_refresh_token;
        token.backend_access_token_expires_at = getJwtExp(user.backend_access_token);
      }
      
      return token
    },
    async session(params: any) {
      const { session, token } = params || {} as any;
      // Передаем данные в сессию
      if (token) {
        session.user.id = token.id as string || token.google_id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.username = token.username as string;
        
        // Передаем токены от вашего бэкенда
        session.backend_access_token = token.backend_access_token as string;
        session.backend_refresh_token = token.backend_refresh_token as string;
        session.backend_user = token.backend_user;
        session.backend_access_token_expires_at = token.backend_access_token_expires_at;
      }
      
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
