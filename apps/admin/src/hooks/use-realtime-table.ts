import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableOptions<T extends { id: string }> {
  /** Supabase table name to subscribe to */
  table: string;
  /** Unique channel name — must be unique per page if subscribing multiple tables */
  channelName: string;
  /** Events to listen for. Defaults to all ('*') */
  events?: TableEvent;
  /** Called with the full payload for custom handling */
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (oldRow: Partial<T>) => void;
  /** Called for any event (fallback / re-fetch trigger) */
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

/**
 * useRealtimeTable
 *
 * Subscribes to Supabase postgres_changes for a given table and calls the
 * appropriate handler for INSERT / UPDATE / DELETE events. Handlers receive
 * the row directly from the realtime payload so callers can apply optimistic
 * state patches without an extra network round-trip.
 *
 * Usage:
 *   useRealtimeTable({
 *     table: 'orders',
 *     channelName: 'orders-rt',
 *     onInsert: (row) => setOrders(prev => [row, ...prev]),
 *     onUpdate: (row) => setOrders(prev => prev.map(o => o.id === row.id ? row : o)),
 *     onDelete: (row) => setOrders(prev => prev.filter(o => o.id !== row.id)),
 *   });
 */
export function useRealtimeTable<T extends { id: string }>({
  table,
  channelName,
  events = '*',
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeTableOptions<T>) {
  // Keep handler refs stable so the effect doesn't re-subscribe when parent re-renders
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: events, schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onChangeRef.current?.(payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            onInsertRef.current?.(payload.new as T);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            onUpdateRef.current?.(payload.new as T);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            onDeleteRef.current?.(payload.old as Partial<T>);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe if the table/channel identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, channelName, events]);
}
