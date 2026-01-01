import { Circle } from 'lucide-react';
import type { CallState } from '../hooks/useCallManager';
import { RecordingIndicator } from './RecordingIndicator';

interface StatusBadgeProps {
  callState: CallState;
  duration?: string;
  isRecording?: boolean;
}

const statusConfig: Record<CallState, { label: string; bgColor: string; textColor: string; dotColor: string; pulse?: boolean }> = {
  idle: {
    label: 'Ready',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    dotColor: 'text-slate-400',
  },
  dialing: {
    label: 'Dialing...',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    dotColor: 'text-amber-500',
    pulse: true,
  },
  ringing: {
    label: 'Ringing...',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    dotColor: 'text-blue-500',
    pulse: true,
  },
  connected: {
    label: 'Connected',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    dotColor: 'text-emerald-500',
    pulse: true,
  },
  ended: {
    label: 'Ended',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'text-red-500',
  },
};

export function StatusBadge({ callState, duration, isRecording }: StatusBadgeProps) {
  const config = statusConfig[callState];

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
        <Circle
          className={`w-2.5 h-2.5 fill-current ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`}
        />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {callState === 'connected' && duration && (
        <div className="text-2xl font-mono font-semibold text-slate-700 tabular-nums">
          {duration}
        </div>
      )}

      {callState === 'connected' && isRecording && (
        <RecordingIndicator isRecording={isRecording} showDisclaimer={true} />
      )}
    </div>
  );
}
