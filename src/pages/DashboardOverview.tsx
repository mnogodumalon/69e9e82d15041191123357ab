import { useDashboardData } from '@/hooks/useDashboardData';
import type { FionaExportZuKml } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FionaExportZuKmlDialog } from '@/components/dialogs/FionaExportZuKmlDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle,
  IconTool,
  IconRefresh,
  IconCheck,
  IconPlus,
  IconPencil,
  IconTrash,
  IconFileZip,
  IconMapPin,
  IconLayersLinked,
  IconDownload,
  IconSearch,
  IconX,
  IconDatabase,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';

const APPGROUP_ID = '69e9e82d15041191123357ab';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    fionaExportZuKml,
    loading,
    error,
    fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FionaExportZuKml | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FionaExportZuKml | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return fionaExportZuKml;
    const s = search.toLowerCase();
    return fionaExportZuKml.filter(r =>
      (r.fields.kml_name ?? '').toLowerCase().includes(s) ||
      (r.fields.beschreibung ?? '').toLowerCase().includes(s) ||
      (r.fields.ebenen ?? '').toLowerCase().includes(s) ||
      (r.fields.koordinatensystem?.label ?? '').toLowerCase().includes(s)
    );
  }, [fionaExportZuKml, search]);

  const withAttributeCount = useMemo(() =>
    fionaExportZuKml.filter(r => r.fields.attribute_exportieren === true).length,
    [fionaExportZuKml]
  );

  const koordinatensystemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of fionaExportZuKml) {
      const key = r.fields.koordinatensystem?.label ?? 'Unbekannt';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [fionaExportZuKml]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreate = async (fields: FionaExportZuKml['fields']) => {
    await LivingAppsService.createFionaExportZuKmlEntry(fields as any);
    fetchAll();
  };

  const handleEdit = async (fields: FionaExportZuKml['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateFionaExportZuKmlEntry(editRecord.record_id, fields as any);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteFionaExportZuKmlEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const topKoordSystem = koordinatensystemCounts[0]?.[0] ?? '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Konvertierungs-Aufträge</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fiona ZIP-Dateien zu KML konvertieren</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-2 shrink-0" />
          Neuer Auftrag
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Aufträge gesamt"
          value={String(fionaExportZuKml.length)}
          description="Konvertierungen"
          icon={<IconDatabase size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Attributen"
          value={String(withAttributeCount)}
          description="Attribute exportiert"
          icon={<IconLayersLinked size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Koordinatensystem"
          value={topKoordSystem !== '—' ? topKoordSystem.split(' ')[0] : '—'}
          description="Häufigstes System"
          icon={<IconMapPin size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Dateien"
          value={String(fionaExportZuKml.filter(r => !!r.fields.zip_datei).length)}
          description="ZIP hochgeladen"
          icon={<IconFileZip size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Search + Table */}
      <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center gap-3 flex-wrap border-b border-border">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
            <Input
              placeholder="Suchen nach Name, Ebenen, Koordinatensystem..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="gap-1 text-muted-foreground">
              <IconX size={14} className="shrink-0" />
              Zurücksetzen
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto shrink-0">
            {filtered.length} von {fionaExportZuKml.length} Einträgen
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <IconFileZip size={48} className="text-muted-foreground" stroke={1.5} />
            <div className="text-center">
              <p className="font-semibold text-foreground">Keine Aufträge gefunden</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {search ? 'Keine Ergebnisse für deine Suche.' : 'Erstelle deinen ersten KML-Konvertierungsauftrag.'}
              </p>
            </div>
            {!search && (
              <Button size="sm" onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
                <IconPlus size={14} className="mr-1 shrink-0" />
                Neuer Auftrag
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(record => (
              <JobCard
                key={record.record_id}
                record={record}
                onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
                onDelete={() => setDeleteTarget(record)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Koordinatensystem-Übersicht */}
      {koordinatensystemCounts.length > 0 && (
        <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
          <div className="px-6 pt-6 pb-2 border-b border-border">
            <h2 className="font-semibold text-foreground">Koordinatensysteme</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Verteilung aller Aufträge</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {koordinatensystemCounts.map(([label, count]) => {
              const pct = fionaExportZuKml.length > 0 ? Math.round((count / fionaExportZuKml.length) * 100) : 0;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium truncate min-w-0">{label}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <FionaExportZuKmlDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['FionaExportZuKml']}
        enablePhotoLocation={AI_PHOTO_LOCATION['FionaExportZuKml']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Auftrag löschen"
        description={`Soll der Auftrag "${deleteTarget?.fields.kml_name ?? 'Unbenannt'}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function JobCard({
  record,
  onEdit,
  onDelete,
}: {
  record: FionaExportZuKml;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const f = record.fields;
  const geometryTypes = Array.isArray(f.geometrietyp)
    ? f.geometrietyp.map(g => g.label ?? g).join(', ')
    : null;

  return (
    <div className="px-6 py-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <IconFileZip size={18} className="text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {f.kml_name ?? <span className="text-muted-foreground italic">Ohne Name</span>}
              </h3>
              {f.beschreibung && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{f.beschreibung}</p>
              )}
            </div>
            {/* Actions — always visible */}
            <div className="flex items-center gap-1 shrink-0">
              {f.zip_datei && (
                <a
                  href={f.zip_datei}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  title="ZIP herunterladen"
                  onClick={e => e.stopPropagation()}
                >
                  <IconDownload size={16} className="shrink-0" />
                </a>
              )}
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Bearbeiten"
              >
                <IconPencil size={16} className="shrink-0" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                title="Löschen"
              >
                <IconTrash size={16} className="shrink-0" />
              </button>
            </div>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 items-center">
            {f.koordinatensystem && (
              <Badge variant="secondary" className="text-xs gap-1">
                <IconMapPin size={11} className="shrink-0" />
                {f.koordinatensystem.label}
              </Badge>
            )}
            {f.koordinatensystem?.key === 'sonstiges' && f.koordinatensystem_sonstiges && (
              <Badge variant="outline" className="text-xs">
                {f.koordinatensystem_sonstiges}
              </Badge>
            )}
            {geometryTypes && (
              <Badge variant="outline" className="text-xs gap-1">
                <IconLayersLinked size={11} className="shrink-0" />
                {geometryTypes}
              </Badge>
            )}
            {f.ebenen && (
              <span className="text-xs text-muted-foreground">
                Ebenen: <span className="text-foreground font-medium">{f.ebenen}</span>
              </span>
            )}
            {f.attribute_exportieren && (
              <Badge className="text-xs bg-green-500/10 text-green-700 border-0 gap-1">
                <IconCheck size={11} className="shrink-0" />
                Attribute
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>Erstellt: {formatDate(record.createdat)}</span>
            {record.updatedat && <span>Aktualisiert: {formatDate(record.updatedat)}</span>}
            {f.anmerkungen && (
              <span className="italic truncate max-w-xs">{f.anmerkungen}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
