'use client';

import { useEffect, useState, useRef } from 'react';
import type { SSEEvent, SSEPlayer } from '@/lib/sse/sseManager';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

type CampaignInfo = { id: string; title: string; theme: string; difficulty: string } | null;

interface UseRoomPlayersResult {
  players: SSEPlayer[];
  roomStatus: string;
  status: ConnectionStatus;
  error: string | null;
  selectedCampaign: CampaignInfo;
}

export function useRoomPlayers(roomCode: string, initialCampaign?: CampaignInfo): UseRoomPlayersResult {
  const [players, setPlayers] = useState<SSEPlayer[]>([]);
  const [roomStatus, setRoomStatus] = useState<string>('WAITING');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignInfo>(initialCampaign ?? null);
  const retryCount = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      esRef.current?.close();
      setStatus(retryCount.current > 0 ? 'reconnecting' : 'connecting');

      const es = new EventSource(`/api/rooms/${roomCode}/events`);
      esRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        setError(null);
        retryCount.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);

          if (data.type === 'room_closed') {
            window.location.href = '/lobby?error=' + encodeURIComponent('Le salon a été fermé');
            return;
          }

          if (data.type === 'campaign_selected') {
            setSelectedCampaign(data.campaign ?? null);
            return;
          }

          setPlayers(data.players);
          setRoomStatus(data.status ?? 'WAITING');
        } catch {
          console.error('[SSE] Erreur parsing:', event.data);
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        retryCount.current += 1;

        if (retryCount.current > 5) {
          setStatus('error');
          setError('Connexion perdue. Rechargez la page.');
          return;
        }

        setStatus('reconnecting');
        setTimeout(connect, Math.min(1000 * 2 ** retryCount.current, 30_000));
      };
    }

    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [roomCode]);

  return { players, roomStatus, status, error, selectedCampaign };
}
