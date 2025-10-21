import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Авторизация - О.Доставка',
  description: 'Вход и регистрация в О.Доставка',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {children}
    </div>
  );
}

