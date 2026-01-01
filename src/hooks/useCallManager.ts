import { useReducer, useCallback, useRef, useEffect } from 'react';
import { validatePhoneNumber } from '../utils/phoneValidation';
import type { VonageClient } from '@vonage/client-sdk';
import type { VonageCallStatus } from '../types/vonage';
import type { CallQuality } from '../components/CallQualityIndicator';

export type CallState = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';

interface CallManagerState {
  callState: CallState;
  phoneNumber: string;
  callDuration: number;
  error: string | null;
  vonageCall: unknown | null;
  callId: string | null;
  recordingId: string | null;
  isRecording: boolean;
  callQuality: CallQuality;
}

type CallAction =
  | { type: 'SET_PHONE_NUMBER'; payload: string }
  | { type: 'START_DIALING' }
  | { type: 'SET_RINGING' }
  | { type: 'CONNECT_CALL' }
  | { type: 'END_CALL' }
  | { type: 'RESET' }
  | { type: 'INCREMENT_DURATION' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_VONAGE_CALL'; payload: unknown }
  | { type: 'SET_CALL_ID'; payload: string }
  | { type: 'SET_RECORDING_STARTED'; payload: string }
  | { type: 'SET_RECORDING_STOPPED' }
  | { type: 'SET_CALL_QUALITY'; payload: CallQuality }
  | { type: 'CLEAR_VONAGE_CALL' };

const initialState: CallManagerState = {
  callState: 'idle',
  phoneNumber: '',
  callDuration: 0,
  error: null,
  vonageCall: null,
  callId: null,
  recordingId: null,
  isRecording: false,
  callQuality: null,
};

function callReducer(state: CallManagerState, action: CallAction): CallManagerState {
  switch (action.type) {
    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload, error: null };
    case 'START_DIALING':
      return { ...state, callState: 'dialing', callDuration: 0, error: null };
    case 'SET_RINGING':
      return { ...state, callState: 'ringing' };
    case 'CONNECT_CALL':
      return { ...state, callState: 'connected', isRecording: true, callQuality: 'excellent' };
    case 'END_CALL':
      return { ...state, callState: 'ended', isRecording: false, callQuality: null };
    case 'RESET':
      return {
        ...state,
        callState: 'idle',
        callDuration: 0,
        vonageCall: null,
        callId: null,
        recordingId: null,
        isRecording: false,
        callQuality: null,
      };
    case 'INCREMENT_DURATION':
      return { ...state, callDuration: state.callDuration + 1 };
    case 'SET_ERROR':
      return { ...state, error: action.payload, callState: 'idle' };
    case 'SET_VONAGE_CALL':
      return { ...state, vonageCall: action.payload };
    case 'SET_CALL_ID':
      return { ...state, callId: action.payload };
    case 'SET_RECORDING_STARTED':
      return { ...state, isRecording: true, recordingId: action.payload };
    case 'SET_RECORDING_STOPPED':
      return { ...state, isRecording: false };
    case 'SET_CALL_QUALITY':
      return { ...state, callQuality: action.payload };
    case 'CLEAR_VONAGE_CALL':
      return { ...state, vonageCall: null, callId: null };
    default:
      return state;
  }
}

interface UseCallManagerOptions {
  vonageClient: VonageClient | null;
  isVonageConnected: boolean;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function useCallManager({
  vonageClient,
  isVonageConnected,
  onError,
  onSuccess,
}: UseCallManagerOptions) {
  const [state, dispatch] = useReducer(callReducer, initialState);
  const timerRef = useRef<number | null>(null);
  const callRef = useRef<any>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.callState === 'connected') {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'INCREMENT_DURATION' });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [state.callState, clearTimer]);

  const handleVonageCallStatus = useCallback((status: VonageCallStatus) => {
    switch (status) {
      case 'ringing':
        dispatch({ type: 'SET_RINGING' });
        break;
      case 'answered':
        dispatch({ type: 'CONNECT_CALL' });
        onSuccess?.('Call connected');
        break;
      case 'completed':
      case 'busy':
      case 'cancelled':
      case 'failed':
      case 'rejected':
      case 'timeout':
      case 'unanswered':
        dispatch({ type: 'END_CALL' });
        if (status === 'busy') {
          onError?.('Number is busy. Please try again later.');
        } else if (status === 'failed') {
          onError?.('Call failed. Please verify the number and try again.');
        } else if (status === 'rejected') {
          onError?.('Call was rejected.');
        } else if (status === 'unanswered') {
          onError?.('No answer. Please try again later.');
        }
        setTimeout(() => dispatch({ type: 'RESET' }), 3000);
        break;
    }
  }, [onError, onSuccess]);

  const setPhoneNumber = useCallback((number: string) => {
    dispatch({ type: 'SET_PHONE_NUMBER', payload: number });
  }, []);

  const handleStartCall = useCallback(async () => {
    const validation = validatePhoneNumber(state.phoneNumber);

    if (!validation.isValid) {
      dispatch({ type: 'SET_ERROR', payload: validation.errorMessage || 'Invalid phone number' });
      onError?.(validation.errorMessage || 'Invalid phone number');
      return;
    }

    if (!vonageClient || !isVonageConnected) {
      dispatch({ type: 'SET_ERROR', payload: 'Not connected to Vonage. Please wait...' });
      onError?.('Not connected to Vonage. Please wait and try again.');
      return;
    }

    dispatch({ type: 'START_DIALING' });

    try {
      const call = await vonageClient.serverCall({
        to: [{
          type: 'phone',
          number: validation.normalizedNumber,
        }],
        customData: {
          callType: 'outbound',
          timestamp: new Date().toISOString(),
        },
      });

      callRef.current = call;
      dispatch({ type: 'SET_VONAGE_CALL', payload: call });
      dispatch({ type: 'SET_CALL_ID', payload: call.id });

      call.on('call:status:changed', (event: unknown) => {
        const statusEvent = event as { status: VonageCallStatus };
        handleVonageCallStatus(statusEvent.status);
      });

      call.on('call:recording:started', (event: unknown) => {
        const recordingEvent = event as { recordingId: string };
        dispatch({ type: 'SET_RECORDING_STARTED', payload: recordingEvent.recordingId });
      });

      call.on('call:recording:stopped', () => {
        dispatch({ type: 'SET_RECORDING_STOPPED' });
      });

    } catch (error) {
      console.error('Vonage call error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate call';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
    }
  }, [state.phoneNumber, vonageClient, isVonageConnected, handleVonageCallStatus, onError]);

  const handleEndCall = useCallback(async () => {
    try {
      if (callRef.current) {
        await callRef.current.hangup();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }

    dispatch({ type: 'END_CALL' });
    callRef.current = null;

    setTimeout(() => {
      dispatch({ type: 'RESET' });
    }, 3000);
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    callState: state.callState,
    phoneNumber: state.phoneNumber,
    callDuration: state.callDuration,
    formattedDuration: formatDuration(state.callDuration),
    error: state.error,
    vonageCall: state.vonageCall,
    callId: state.callId,
    recordingId: state.recordingId,
    isRecording: state.isRecording,
    callQuality: state.callQuality,
    setPhoneNumber,
    handleStartCall,
    handleEndCall,
    isCallActive: state.callState === 'dialing' || state.callState === 'ringing' || state.callState === 'connected',
    canStartCall: isVonageConnected && state.phoneNumber.trim().length > 0 && state.callState === 'idle',
  };
}
