// Регистрация Service Worker (не регистрируемся на localhost/dev)
const isLocalhost = Boolean(
  typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  )
);

if ('serviceWorker' in navigator && !isLocalhost) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker зарегистрирован:', registration.scope);
        
        // Проверка обновлений каждые 60 секунд
        setInterval(() => {
          registration.update();
        }, 60000);
      })
      .catch((error) => {
        console.error('❌ Ошибка регистрации Service Worker:', error);
      });
  });

  // Обработка обновления Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker обновлен');
  });
}

// Проверка возможности установки PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Предотвращаем автоматический показ браузерного промпта
  e.preventDefault();
  deferredPrompt = e;
  console.log('💾 PWA можно установить');
  
  // Можно показать свою кнопку установки
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ Пользователь установил PWA');
        }
        deferredPrompt = null;
      });
    });
  }
});

// После установки
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA установлено');
  deferredPrompt = null;
});

