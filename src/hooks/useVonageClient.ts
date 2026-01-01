import { useState, useEffect, useCallback, useRef } from 'react';
import { VonageClient } from '@vonage/client-sdk';
import type { VonageConnectionState } from '../types/vonage';

interface UseVonageClientReturn {
  client: VonageClient | null;
  connectionState: VonageConnectionState;
  connectionError: string | null;
  sessionId: string | null;
  reconnect: () => Promise<void>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

export function useVonageClient(): UseVonageClientReturn {
  const [client, setClient] = useState<VonageClient | null>(null);
  const [connectionState, setConnectionState] = useState<VonageConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isInitializing = useRef(false);
  const retryCount = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  const fetchJWT = useCallback(async (): Promise<string> => {
    const jwtEndpoint = `${SUPABASE_URL}/functions/v1/vonage-jwt`;

    const response = await fetch(jwtEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        userId: `user-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `JWT fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error('No token received from JWT endpoint');
    }

    return data.token;
  }, []);

  const getErrorMessage = useCallback((error: unknown): string => {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      if (errorCode === 'session:error:timeout') {
        return 'Connection timed out. WebSocket connection to Vonage servers may be blocked. Please try deploying this app to a production environment.';
      }
    }
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return 'Connection timed out. WebSocket connection to Vonage servers may be blocked in this environment.';
      }
      return error.message;
    }
    return 'Failed to connect to Vonage';
  }, []);

  const initializeClient = useCallback(async (isRetry = false) => {
    if (isInitializing.current && !isRetry) return;
    isInitializing.current = true;

    setConnectionState('connecting');
    if (!isRetry) {
      setConnectionError(null);
      retryCount.current = 0;
    }

    try {
      const attempt = retryCount.current + 1;
      console.log(`Initializing Vonage Client SDK... (attempt ${attempt}/${MAX_RETRIES + 1})`);

      const vonageClient = new VonageClient();

      console.log('Vonage Client SDK initialized, fetching JWT...');
      const jwt = await fetchJWT();

      console.log('JWT received, creating session...');
      const session = await vonageClient.createSession(jwt);

      console.log('Session created successfully:', session);

      setClient(vonageClient);
      setSessionId(session);
      setConnectionState('connected');
      retryCount.current = 0;

      vonageClient.on('sessionError', (error: unknown) => {
        console.error('Vonage session error:', error);
        setConnectionState('error');
        setConnectionError('Session error. Please reconnect.');
      });

      isInitializing.current = false;

    } catch (error) {
      console.error('Vonage initialization error:', error);

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        console.log(`Will retry in ${RETRY_DELAY}ms... (${retryCount.current}/${MAX_RETRIES})`);
        setConnectionError(`Connecting... (retry ${retryCount.current}/${MAX_RETRIES})`);

        retryTimeoutRef.current = window.setTimeout(() => {
          initializeClient(true);
        }, RETRY_DELAY);
        return;
      }

      setConnectionState('error');
      setConnectionError(getErrorMessage(error));
      setClient(null);
      setSessionId(null);
      retryCount.current = 0;
      isInitializing.current = false;
    }
  }, [fetchJWT, getErrorMessage]);

  const reconnect = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCount.current = 0;
    isInitializing.current = false;
    setClient(null);
    setSessionId(null);
    await initializeClient();
  }, [initializeClient]);

  useEffect(() => {
    initializeClient();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [initializeClient]);

  return {
    client,
    connectionState,
    connectionError,
    sessionId,
    reconnect,
  };
}
