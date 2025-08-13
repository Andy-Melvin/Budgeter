import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { simpleOfflineSync } from '@/lib/offline-sync-simple';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, failed: 0, synced: 0 });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateSyncStatus = async () => {
      const status = await simpleOfflineSync.getSyncStatus();
      setSyncStatus(status);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update sync status periodically
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && syncStatus.pending === 0 && syncStatus.failed === 0) {
    return null; // Don't show indicator when everything is synced and online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={isOnline ? "secondary" : "destructive"}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Online</span>
            {syncStatus.pending > 0 && (
              <span className="text-xs bg-yellow-500 text-white px-1 rounded">
                {syncStatus.pending} pending
              </span>
            )}
            {syncStatus.failed > 0 && (
              <span className="text-xs bg-red-500 text-white px-1 rounded">
                {syncStatus.failed} failed
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
            {syncStatus.pending > 0 && (
              <span className="text-xs bg-blue-500 text-white px-1 rounded">
                {syncStatus.pending} saved
              </span>
            )}
          </>
        )}
      </Badge>
    </div>
  );
} 