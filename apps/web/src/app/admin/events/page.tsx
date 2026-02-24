'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Lock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { Event } from '@/lib/api';

type FilterStatus = 'all' | 'open' | 'locked' | 'resolved' | 'cancelled';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'locked', label: 'Bloqueados' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'cancelled', label: 'Cancelados' },
];

function EventStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    open: { label: 'Aberto', className: 'bg-green-500/10 text-green-500' },
    locked: { label: 'Bloqueado', className: 'bg-yellow-500/10 text-yellow-500' },
    resolved: { label: 'Resolvido', className: 'bg-blue-500/10 text-blue-500' },
    cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

function EventActionsMenu({
  event,
  onLock,
  onResolve,
  onCancel,
  isSubmitting,
}: {
  event: Event;
  onLock: () => void;
  onResolve: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 hover:bg-muted"
        disabled={isSubmitting}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
            <Link
              href={`/markets/${event._id}`}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Eye className="h-4 w-4" />
              Ver evento
            </Link>
            <Link
              href={`/admin/events/${event._id}`}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            {event.status === 'open' && (
              <>
                <button
                  onClick={() => {
                    onLock();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Lock className="h-4 w-4" />
                  Bloquear
                </button>
                <button
                  onClick={() => {
                    onCancel();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
              </>
            )}
            {(event.status === 'open' || event.status === 'locked') && (
              <button
                onClick={() => {
                  onResolve();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-primary/10"
              >
                <CheckCircle className="h-4 w-4" />
                Resolver
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ResolveEventModal({
  event,
  onClose,
  onResolve,
  isSubmitting,
}: {
  event: Event;
  onClose: () => void;
  onResolve: (outcomeId: string, source?: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [source, setSource] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resolver Evento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{event.title}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Selecione o vencedor</label>
            <div className="mt-2 space-y-2">
              {event.outcomes.map((outcome) => (
                <button
                  key={outcome._id}
                  onClick={() => setSelectedOutcome(outcome._id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-4 transition-colors',
                    selectedOutcome === outcome._id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <span className="font-medium">{outcome.label}</span>
                  <span className="text-sm text-muted-foreground">
                    ${outcome.totalPool.toLocaleString('en-US')} • {outcome.odds.toFixed(2)}x
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Fonte da resolução (opcional)</label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Link ou descrição da fonte"
              className="mt-2"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">
              Esta ação é irreversível. Os payouts serão calculados automaticamente.
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={() => onResolve(selectedOutcome, source)}
              disabled={!selectedOutcome || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolvendo...
                </>
              ) : (
                'Resolver Evento'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelEventModal({
  event,
  onClose,
  onCancel,
  isSubmitting,
}: {
  event: Event;
  onClose: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cancelar Evento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{event.title}</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="text-sm text-destructive">
              <p className="font-medium">Atenção!</p>
              <p>Todas as apostas serão reembolsadas integralmente. Esta ação é irreversível.</p>
            </div>
          </div>

          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Pool total a ser reembolsado:</p>
            <p className="mt-1 text-2xl font-bold">${event.totalPool.toLocaleString('en-US')}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const {
    events,
    totalEvents,
    isLoading,
    isSubmitting,
    error,
    fetchEvents,
    lockEvent,
    resolveEvent,
    cancelEvent,
    clearError,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [resolveModal, setResolveModal] = useState<Event | null>(null);
  const [cancelModal, setCancelModal] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search || undefined,
    });
  }, [fetchEvents, statusFilter, search]);

  const handleLock = async (eventId: string) => {
    try {
      await lockEvent(eventId);
    } catch {
      // Error handled by store
    }
  };

  const handleResolve = async (outcomeId: string, source?: string) => {
    if (!resolveModal) return;
    try {
      await resolveEvent(resolveModal._id, { outcomeId, resolutionSource: source });
      setResolveModal(null);
    } catch {
      // Error handled by store
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    try {
      await cancelEvent(cancelModal._id);
      setCancelModal(null);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="mt-1 text-muted-foreground">
            {totalEvents} eventos no total
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Evento
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-2xl border border-border bg-card">
        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Nenhum evento encontrado</p>
            <Link href="/admin/events/new">
              <Button className="mt-4">Criar primeiro evento</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div
                key={event._id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/events/${event._id}`}
                        className="font-medium hover:text-primary"
                      >
                        {event.title}
                      </Link>
                      <EventStatusBadge status={event.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.outcomes.length} outcomes • ${event.totalPool.toLocaleString('en-US')} pool •{' '}
                      {event.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Fecha em</p>
                    <p className="font-medium">
                      {new Date(event.closesAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <EventActionsMenu
                    event={event}
                    onLock={() => handleLock(event._id)}
                    onResolve={() => setResolveModal(event)}
                    onCancel={() => setCancelModal(event)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {resolveModal && (
        <ResolveEventModal
          event={resolveModal}
          onClose={() => setResolveModal(null)}
          onResolve={handleResolve}
          isSubmitting={isSubmitting}
        />
      )}

      {cancelModal && (
        <CancelEventModal
          event={cancelModal}
          onClose={() => setCancelModal(null)}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
