import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone ||
                     document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed this session, if standalone, or if no prompt available
  const shouldShow = showInstallPrompt &&
                    !isStandalone &&
                    !sessionStorage.getItem('pwa-prompt-dismissed') &&
                    (deferredPrompt || isIOS);

  if (!shouldShow) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7))',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="card max-w-md mx-auto">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📱</div>
            <div className="flex-1">
              <h3 className="m-0 mb-1 text-lg font-semibold">Install Dismissal App</h3>
              <p className="text-sm text-muted m-0 mb-3">
                {isIOS
                  ? 'Add to your home screen for a better experience. Tap the share button and select "Add to Home Screen".'
                  : 'Install this app on your device for quick access and offline functionality.'
                }
              </p>
              <div className="flex gap-2">
                {!isIOS && (
                  <button
                    onClick={handleInstallClick}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Install App
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    color: '#6c757d'
                  }}
                >
                  {isIOS ? 'Dismiss' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;