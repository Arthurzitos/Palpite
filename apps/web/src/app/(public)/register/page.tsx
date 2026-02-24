'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setFormError(null);
    clearError();

    try {
      await registerUser(data.email, data.password, data.name);
      router.push('/markets');
    } catch {
      setFormError(error || 'Erro ao criar conta');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-primary/20 via-background to-background p-12 lg:flex">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 flex gap-1">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <h2 className="mb-2 text-5xl font-bold">Junte-se aos</h2>
          <h3 className="mb-6 text-5xl font-bold text-primary">1.200+ traders</h3>
          <p className="text-lg text-muted-foreground">
            Crie sua conta gratuitamente e comece a
            <br />
            apostar em minutos.
          </p>

          {/* Benefits */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Sem taxas de depósito via PIX</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Mercados ao vivo 24/7</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Saques instantâneos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full flex-col justify-center bg-card px-4 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mb-2 text-3xl font-bold">Criar conta</h1>
          <p className="mb-8 text-muted-foreground">
            Preencha os dados abaixo para começar.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {(formError || error) && (
              <Alert variant="destructive">
                <AlertDescription>{formError || error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="h-12 pl-10 bg-secondary border-0"
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Mínimo de 2 caracteres',
                    },
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 pl-10 pr-10 bg-secondary border-0"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Mínimo de 6 caracteres',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  className="h-12 pl-10 pr-10 bg-secondary border-0"
                  {...register('confirmPassword', {
                    required: 'Confirme sua senha',
                    validate: (value) =>
                      value === password || 'As senhas não conferem',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-base font-semibold hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ao criar sua conta, você concorda com os{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
