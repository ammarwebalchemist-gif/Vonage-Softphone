interface RecordingIndicatorProps {
  isRecording: boolean;
  showDisclaimer?: boolean;
}

export function RecordingIndicator({ isRecording, showDisclaimer = true }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-red-600">Recording</span>
      </div>
      {showDisclaimer && (
        <p className="text-xs text-slate-400">This call is being recorded</p>
      )}
    </div>
  );
}
