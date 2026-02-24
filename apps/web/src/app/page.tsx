import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Bitcoin,
  Trophy,
  Landmark,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Sem KYC',
    description:
      'Cadastro instantâneo. Deposite crypto e comece a apostar em minutos.',
  },
  {
    icon: TrendingUp,
    title: 'Odds Dinâmicas',
    description: 'Modelo pari-mutuel. Odds mudam conforme o volume de apostas.',
  },
  {
    icon: Bitcoin,
    title: '900+ Cryptos',
    description: 'Deposite com qualquer crypto. PIX e cartão também disponíveis.',
  },
];

const categories = [
  { icon: Landmark, label: 'Política', color: 'bg-purple-500/20 text-purple-400' },
  { icon: Bitcoin, label: 'Crypto', color: 'bg-orange-500/20 text-orange-400' },
  { icon: Trophy, label: 'Esportes', color: 'bg-green-500/20 text-green-400' },
  { icon: Globe, label: 'Mundo', color: 'bg-cyan-500/20 text-cyan-400' },
];

const stats = [
  { value: '456', label: 'Mercados Ativos' },
  { value: 'R$ 8.2M', label: 'Volume 24h' },
  { value: '1.2K', label: 'Traders Online' },
  { value: '3%', label: 'Taxa Única' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-bold">palpite</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center gap-1">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
            Preveja o futuro.
          </h1>
          <h2 className="mb-6 text-5xl font-bold tracking-tight text-primary md:text-6xl">
            Lucre com isso.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Mercados de previsão em tempo real. Aposte em política, esportes, crypto e
            mais. Modelo pari-mutuel com odds dinâmicas.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/markets"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
            >
              Explorar Mercados
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-8 py-4 text-lg font-semibold transition-colors hover:bg-muted"
            >
              Criar Conta Grátis
            </Link>
          </div>

          {/* Categories */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <span
                key={cat.label}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${cat.color}`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Por que escolher o Palpite?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Como funciona</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Escolha um mercado',
                  description:
                    'Navegue por centenas de eventos em política, crypto, esportes e mais.',
                },
                {
                  step: '2',
                  title: 'Faça sua previsão',
                  description:
                    'Compre ações de SIM ou NÃO baseado no que você acredita que vai acontecer.',
                },
                {
                  step: '3',
                  title: 'Lucre se acertar',
                  description:
                    'Se sua previsão estiver correta, você recebe R$1 por ação. Taxa de apenas 3%.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8 text-center md:p-12">
          <h2 className="mb-4 text-3xl font-bold">Comece a prever agora</h2>
          <p className="mb-8 text-muted-foreground">
            Crie sua conta em segundos. Sem verificação de identidade necessária.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" />
                Sem KYC
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" />
                Depósito em 5 min
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-primary" />
                Taxa de apenas 3%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="font-bold">palpite</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 Palpite. Mercado de previsões descentralizado.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
