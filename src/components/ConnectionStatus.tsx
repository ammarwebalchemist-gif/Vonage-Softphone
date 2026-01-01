import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { VonageConnectionState } from '../types/vonage';

interface ConnectionStatusProps {
  connectionState: VonageConnectionState;
  errorMessage: string | null;
  onReconnect?: () => void;
}

export function ConnectionStatus({
  connectionState,
  errorMessage,
  onReconnect,
}: ConnectionStatusProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (connectionState === 'connected') {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setIsVisible(true);
  }, [connectionState]);

  const handleReconnect = async () => {
    if (onReconnect && !isReconnecting) {
      setIsReconnecting(true);
      await onReconnect();
      setIsReconnecting(false);
    }
  };

  if (!isVisible && connectionState === 'connected') return null;

  const config = {
    disconnected: {
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-700',
      icon: WifiOff,
      message: 'Disconnected from Vonage',
    },
    connecting: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: Loader2,
      message: 'Connecting to Vonage...',
    },
    connected: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: Wifi,
      message: 'Ready to call',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      message: errorMessage || 'Connection error',
    },
  };

  const currentConfig = config[connectionState];
  const IconComponent = currentConfig.icon;

  return (
    <div
      className={`w-full border-b px-4 py-2 transition-all duration-300
        ${currentConfig.bg}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconComponent
            className={`w-4 h-4 ${currentConfig.text} ${
              connectionState === 'connecting' ? 'animate-spin' : ''
            }`}
          />
          <span className={`text-sm font-medium ${currentConfig.text}`}>
            {currentConfig.message}
          </span>
        </div>

        {connectionState === 'error' && onReconnect && (
          <button
            onClick={handleReconnect}
            disabled={isReconnecting}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded
              transition-colors ${currentConfig.text}
              hover:bg-red-100 disabled:opacity-50
            `}
          >
            <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
            <span>{isReconnecting ? 'Reconnecting...' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
