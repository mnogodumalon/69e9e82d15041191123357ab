import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FionaExportZuKml } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [fionaExportZuKml, setFionaExportZuKml] = useState<FionaExportZuKml[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [fionaExportZuKmlData] = await Promise.all([
        LivingAppsService.getFionaExportZuKml(),
      ]);
      setFionaExportZuKml(fionaExportZuKmlData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [fionaExportZuKmlData] = await Promise.all([
          LivingAppsService.getFionaExportZuKml(),
        ]);
        setFionaExportZuKml(fionaExportZuKmlData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { fionaExportZuKml, setFionaExportZuKml, loading, error, fetchAll };
}