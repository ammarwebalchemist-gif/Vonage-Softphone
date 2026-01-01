export type VonageCallStatus =
  | 'started'
  | 'ringing'
  | 'answered'
  | 'completed'
  | 'busy'
  | 'cancelled'
  | 'failed'
  | 'rejected'
  | 'timeout'
  | 'unanswered';

export type VonageConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface VonageCallEvent {
  callId: string;
  status: VonageCallStatus;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

export interface VonageRecordingEvent {
  callId: string;
  recordingId: string;
  recordingUrl?: string;
}
