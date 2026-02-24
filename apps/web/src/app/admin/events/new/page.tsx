'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';

const categories = [
  { value: 'sports', label: 'Esportes', emoji: '⚽' },
  { value: 'crypto', label: 'Crypto', emoji: '₿' },
  { value: 'politics', label: 'Política', emoji: '🏛️' },
  { value: 'entertainment', label: 'Entretenimento', emoji: '🎬' },
  { value: 'other', label: 'Outros', emoji: '📊' },
];

const outcomeColors = [
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

interface OutcomeInput {
  id: string;
  label: string;
  color: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent, isSubmitting, error, clearError } = useAdmin();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [imageUrl, setImageUrl] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [outcomes, setOutcomes] = useState<OutcomeInput[]>([
    { id: '1', label: 'Sim', color: outcomeColors[0] },
    { id: '2', label: 'Não', color: outcomeColors[1] },
  ]);

  const addOutcome = () => {
    const newId = Date.now().toString();
    const colorIndex = outcomes.length % outcomeColors.length;
    setOutcomes([...outcomes, { id: newId, label: '', color: outcomeColors[colorIndex] }]);
  };

  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((o) => o.id !== id));
  };

  const updateOutcome = (id: string, field: 'label' | 'color', value: string) => {
    setOutcomes(outcomes.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!title || !description || !closesAt || outcomes.some((o) => !o.label)) {
      return;
    }

    try {
      await createEvent({
        title,
        description,
        category,
        imageUrl: imageUrl || undefined,
        closesAt,
        startsAt: startsAt || undefined,
        outcomes: outcomes.map((o) => ({ label: o.label, color: o.color })),
      });
      router.push('/admin/events');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para eventos
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Criar Evento</h1>
        <p className="mt-1 text-muted-foreground">
          Preencha os campos abaixo para criar um novo evento
        </p>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Informações Básicas</h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bitcoin passa $100K em 2024?"
                className="mt-2"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva as regras e critérios de resolução do evento..."
                className="mt-2 min-h-[100px] w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
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
              <label className="text-sm font-medium">
                <ImageIcon className="mr-2 inline h-4 w-4" />
                URL da Imagem (opcional)
              </label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Datas</h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                <Calendar className="mr-2 inline h-4 w-4" />
                Data de Início (opcional)
              </label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Quando o evento real começa
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">
                <Calendar className="mr-2 inline h-4 w-4" />
                Encerramento das Apostas
              </label>
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-2"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Após esta data, não é mais possível apostar
              </p>
            </div>
          </div>
        </div>

        {/* Outcomes */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Outcomes</h2>
            <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {outcomes.map((outcome, index) => (
              <div
                key={outcome.id}
                className="flex items-center gap-4 rounded-lg bg-secondary p-4"
              >
                {/* Color Picker */}
                <div className="flex gap-1">
                  {outcomeColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateOutcome(outcome.id, 'color', color)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-transform',
                        outcome.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-secondary'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Label Input */}
                <Input
                  value={outcome.label}
                  onChange={(e) => updateOutcome(outcome.id, 'label', e.target.value)}
                  placeholder={`Outcome ${index + 1}`}
                  className="flex-1"
                  required
                />

                {/* Remove Button */}
                {outcomes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOutcome(outcome.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Mínimo de 2 outcomes. As odds serão calculadas automaticamente com base no volume de apostas.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Link href="/admin/events" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !title || !description || !closesAt || outcomes.some((o) => !o.label)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Evento'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
