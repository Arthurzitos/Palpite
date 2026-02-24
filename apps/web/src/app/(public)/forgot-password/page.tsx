'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement password reset API call
      console.log('Reset password for:', data.email);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch {
      setError('Erro ao enviar instruções. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="h-3 w-3 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-bold">
              pal<span className="text-primary">pite</span>
            </span>
          </Link>
        </div>

        {/* Back to login */}
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        {success ? (
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="mb-2 text-2xl font-bold">Verifique seu e-mail</h1>
            <p className="text-muted-foreground">
              Enviamos as instruções para redefinir sua senha. Verifique sua caixa de
              entrada e siga os passos indicados.
            </p>
            <Button asChild className="mt-6 w-full h-12">
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold">Esqueceu a senha?</h1>
            <p className="mb-6 text-muted-foreground">
              Informe seu e-mail e enviaremos instruções para redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-12 pl-10 bg-secondary border-0"
                    {...register('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-base font-semibold hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
