import { Header } from './components/Header';
import { PhoneInput } from './components/PhoneInput';
import { CallButton } from './components/CallButton';
import { StatusBadge } from './components/StatusBadge';
import { ConnectionStatus } from './components/ConnectionStatus';
import { CallQualityIndicator } from './components/CallQualityIndicator';
import { ToastContainer, useToast } from './components/Toast';
import { useCallManager } from './hooks/useCallManager';
import { useVonageClient } from './hooks/useVonageClient';

function App() {
  const { toasts, dismissToast, showError, showSuccess } = useToast();

  const {
    client: vonageClient,
    connectionState,
    connectionError,
    reconnect,
  } = useVonageClient();

  const isVonageConnected = connectionState === 'connected';

  const {
    callState,
    phoneNumber,
    formattedDuration,
    error,
    isRecording,
    callQuality,
    setPhoneNumber,
    handleStartCall,
    handleEndCall,
    isCallActive,
  } = useCallManager({
    vonageClient,
    isVonageConnected,
    onError: showError,
    onSuccess: showSuccess,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ConnectionStatus
        connectionState={connectionState}
        errorMessage={connectionError}
        onReconnect={reconnect}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg shadow-slate-200/50 p-8 relative">
          {callState === 'connected' && callQuality && (
            <div className="absolute top-4 right-4">
              <CallQualityIndicator quality={callQuality} />
            </div>
          )}

          <Header />

          <PhoneInput
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={isCallActive}
            error={error}
          />

          <CallButton
            callState={callState}
            phoneNumber={phoneNumber}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            isVonageConnected={isVonageConnected}
          />

          <StatusBadge
            callState={callState}
            duration={formattedDuration}
            isRecording={isRecording}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
