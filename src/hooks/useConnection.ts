import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { getter, poster, putter, deleter } from '@/lib/api';
import { toast } from 'sonner';

export type ConnectionStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'connected'
  | 'declined'
  | 'loading';

interface ConnectionState {
  status: ConnectionStatus;
  connectionId: string | null;
}

interface UseConnectionReturn extends ConnectionState {
  isLoading: boolean;
  isMutating: boolean;
  sendRequest: () => Promise<void>;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * useConnection — Universal hook for managing connection state between
 * the logged-in user and a target user.
 *
 * @param targetUserId - The MongoDB ObjectId string of the target user
 * @returns Connection state + action functions
 *
 * Usage:
 *   const { status, sendRequest, accept, decline, remove } = useConnection(userId);
 */
export function useConnection(targetUserId: string | null | undefined): UseConnectionReturn {
  const [isMutating, setIsMutating] = useState(false);

  const key = targetUserId ? `/api/network/status?targetUserId=${targetUserId}` : null;
  const { data, isLoading, mutate } = useSWR<ConnectionState>(key, getter, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const status: ConnectionStatus = isLoading ? 'loading' : (data?.status ?? 'none');
  const connectionId = data?.connectionId ?? null;

  // ─── Send Request ────────────────────────────────────────────────────────────
  const sendRequest = useCallback(async () => {
    if (!targetUserId || isMutating) return;
    setIsMutating(true);

    // Optimistic update
    await mutate({ status: 'pending_sent', connectionId: null }, false);

    try {
      const result = await poster('/api/network/connect', { targetUserId });
      await mutate({ status: 'pending_sent', connectionId: result.connection._id }, false);
      toast.success('Connection request sent!');
    } catch {
      await mutate(); // Revert
    } finally {
      setIsMutating(false);
    }
  }, [targetUserId, isMutating, mutate]);

  // ─── Accept Request ──────────────────────────────────────────────────────────
  const accept = useCallback(async () => {
    if (!connectionId || isMutating) return;
    setIsMutating(true);

    await mutate({ status: 'connected', connectionId }, false);

    try {
      await putter('/api/network/connect', { connectionId, action: 'accept' });
      toast.success('Connection accepted!');
    } catch {
      await mutate();
    } finally {
      setIsMutating(false);
    }
  }, [connectionId, isMutating, mutate]);

  // ─── Decline Request ─────────────────────────────────────────────────────────
  const decline = useCallback(async () => {
    if (!connectionId || isMutating) return;
    setIsMutating(true);

    await mutate({ status: 'none', connectionId: null }, false);

    try {
      await putter('/api/network/connect', { connectionId, action: 'decline' });
      toast.info('Request declined.');
    } catch {
      await mutate();
    } finally {
      setIsMutating(false);
    }
  }, [connectionId, isMutating, mutate]);

  // ─── Remove / Withdraw ───────────────────────────────────────────────────────
  const remove = useCallback(async () => {
    if (!targetUserId || isMutating) return;
    setIsMutating(true);

    await mutate({ status: 'none', connectionId: null }, false);

    try {
      await deleter('/api/network/connect', { targetUserId });
      toast.info('Connection removed.');
    } catch {
      await mutate();
    } finally {
      setIsMutating(false);
    }
  }, [targetUserId, isMutating, mutate]);

  return { status, connectionId, isLoading, isMutating, sendRequest, accept, decline, remove };
}
