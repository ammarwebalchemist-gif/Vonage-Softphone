import { PhoneCall, PhoneOff, Loader2 } from 'lucide-react';
import type { CallState } from '../hooks/useCallManager';

interface CallButtonProps {
  callState: CallState;
  phoneNumber: string;
  onStartCall: () => void;
  onEndCall: () => void;
  isVonageConnected?: boolean;
}

export function CallButton({
  callState,
  phoneNumber,
  onStartCall,
  onEndCall,
  isVonageConnected = true,
}: CallButtonProps) {
  const isIdle = callState === 'idle';
  const isDialing = callState === 'dialing';
  const isRinging = callState === 'ringing';
  const isConnected = callState === 'connected';
  const isEnded = callState === 'ended';
  const isDisabled = (isIdle && !phoneNumber.trim()) || (isIdle && !isVonageConnected);

  const handleClick = () => {
    if (isIdle) {
      onStartCall();
    } else if (isDialing || isRinging || isConnected) {
      onEndCall();
    }
  };

  const getButtonContent = () => {
    if (isDialing) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      );
    }
    if (isRinging) {
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Ringing...</span>
        </>
      );
    }
    if (isConnected) {
      return (
        <>
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </>
      );
    }
    if (isEnded) {
      return <span>Call Ended</span>;
    }
    return (
      <>
        <PhoneCall className="w-5 h-5" />
        <span>Start Call</span>
      </>
    );
  };

  const getButtonStyles = () => {
    if (isEnded) {
      return 'bg-slate-400 cursor-not-allowed';
    }
    if (isConnected) {
      return 'bg-red-600 hover:bg-red-700 active:bg-red-800';
    }
    if (isDialing || isRinging) {
      return 'bg-amber-500 cursor-wait';
    }
    if (isDisabled) {
      return 'bg-slate-300 cursor-not-allowed';
    }
    return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 hover:scale-[1.02]';
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled || isEnded}
      className={`w-full rounded-lg py-4 font-semibold text-white text-lg
        transition-all duration-200 flex items-center justify-center gap-2
        shadow-lg hover:shadow-xl active:scale-[0.98]
        ${getButtonStyles()}
      `}
    >
      {getButtonContent()}
    </button>
  );
}
