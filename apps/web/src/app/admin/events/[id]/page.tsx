'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Lock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { Event } from '@/lib/api';

const categories = [
  { value: 'sports', label: 'Esportes', emoji: '⚽' },
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'politics', label: 'Política', emoji: '🏛️' },
  { value: 'entertainment', label: 'Entretenimento', emoji: '🎬' },
  { value: 'other', label: 'Outros', emoji: '📊' },
];

function ResolveModal({
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
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: outcome.color || '#22c55e' }}
                    />
                    <span className="font-medium">{outcome.label}</span>
                  </div>
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

function CancelModal({
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

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="text-sm text-destructive">
              <p className="font-medium">Atenção!</p>
              <p>Todas as apostas serão reembolsadas. Esta ação é irreversível.</p>
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
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const {
    selectedEvent: event,
    isLoading,
    isSubmitting,
    error,
    fetchEventById,
    updateEvent,
    lockEvent,
    resolveEvent,
    cancelEvent,
    clearError,
  } = useAdmin();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchEventById(eventId);
  }, [eventId, fetchEventById]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setCategory(event.category);
      setImageUrl(event.imageUrl || '');
      setClosesAt(event.closesAt ? new Date(event.closesAt).toISOString().slice(0, 16) : '');
    }
  }, [event]);

  const handleSave = async () => {
    try {
      await updateEvent(eventId, {
        title,
        description,
        category,
        imageUrl: imageUrl || undefined,
        closesAt,
      });
    } catch {
      // Error handled by store
    }
  };

  const handleLock = async () => {
    try {
      await lockEvent(eventId);
    } catch {
      // Error handled by store
    }
  };

  const handleResolve = async (outcomeId: string, source?: string) => {
    try {
      await resolveEvent(eventId, { outcomeId, resolutionSource: source });
      setShowResolveModal(false);
    } catch {
      // Error handled by store
    }
  };

  const handleCancel = async () => {
    try {
      await cancelEvent(eventId);
      setShowCancelModal(false);
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && !event) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Evento não encontrado</p>
        <Link href="/admin/events">
          <Button className="mt-4">Voltar para eventos</Button>
        </Link>
      </div>
    );
  }

  const canEdit = event.status === 'open';
  const canResolve = event.status === 'open' || event.status === 'locked';
  const canCancel = event.status === 'open';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para eventos
          </Link>
          <h1 className="mt-4 text-3xl font-bold">{event.title}</h1>
          <div className="mt-2 flex items-center gap-4">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                event.status === 'open' && 'bg-green-500/10 text-green-500',
                event.status === 'locked' && 'bg-yellow-500/10 text-yellow-500',
                event.status === 'resolved' && 'bg-blue-500/10 text-blue-500',
                event.status === 'cancelled' && 'bg-destructive/10 text-destructive'
              )}
            >
              {event.status === 'open' && 'Aberto'}
              {event.status === 'locked' && 'Bloqueado'}
              {event.status === 'resolved' && 'Resolvido'}
              {event.status === 'cancelled' && 'Cancelado'}
            </span>
            <Link
              href={`/markets/${event._id}`}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver no site
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={handleLock} disabled={isSubmitting}>
              <Lock className="mr-2 h-4 w-4" />
              Bloquear
            </Button>
          )}
          {canResolve && (
            <Button onClick={() => setShowResolveModal(true)} disabled={isSubmitting}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Resolver
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setShowCancelModal(true)} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pool Total</p>
              <p className="text-xl font-bold">${event.totalPool.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outcomes</p>
              <p className="text-xl font-bold">{event.outcomes.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha em</p>
              <p className="text-xl font-bold">
                {new Date(event.closesAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Outcomes */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Outcomes</h2>
        <div className="mt-4 space-y-3">
          {event.outcomes.map((outcome) => (
            <div
              key={outcome._id}
              className={cn(
                'flex items-center justify-between rounded-lg bg-secondary p-4',
                event.resolvedOutcomeId === outcome._id && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: outcome.color || '#22c55e' }}
                />
                <span className="font-medium">{outcome.label}</span>
                {event.resolvedOutcomeId === outcome._id && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Vencedor
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">{outcome.odds.toFixed(2)}x</p>
                <p className="text-sm text-muted-foreground">
                  ${outcome.totalPool.toLocaleString('en-US')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form (only if open) */}
      {canEdit && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Editar Evento</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 min-h-[100px] w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Categoria</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      category === cat.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">URL da Imagem</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Encerramento das Apostas</label>
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Resolution Info (if resolved) */}
      {event.status === 'resolved' && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Informações da Resolução</h2>
          <div className="mt-4 space-y-2">
            <p>
              <span className="text-muted-foreground">Resolvido em:</span>{' '}
              {event.resolvedAt ? new Date(event.resolvedAt).toLocaleString('pt-BR') : '-'}
            </p>
            {event.resolutionSource && (
              <p>
                <span className="text-muted-foreground">Fonte:</span> {event.resolutionSource}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showResolveModal && (
        <ResolveModal
          event={event}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolve}
          isSubmitting={isSubmitting}
        />
      )}

      {showCancelModal && (
        <CancelModal
          event={event}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
