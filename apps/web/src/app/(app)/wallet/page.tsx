'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Zap,
  Bitcoin,
  TrendingUp,
  ShoppingCart,
  Trophy,
  Info,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/use-wallet';
import { Transaction, DepositFiatResult } from '@/lib/api';

type ViewMode = 'main' | 'deposit-select' | 'deposit-pix' | 'deposit-crypto' | 'withdraw';
type CryptoType = 'USDT' | 'BTC' | 'ETH' | 'SOL';

const quickAmountsPix = [50, 100, 200, 500];
const quickAmountsCrypto = [50, 100, 250, 500];

const cryptoNetworks: Record<CryptoType, { network: string; label: string }[]> = {
  USDT: [
    { network: 'TRC20', label: 'Tron (TRC20)' },
    { network: 'ERC20', label: 'Ethereum (ERC20)' },
    { network: 'SOL', label: 'Solana' },
  ],
  BTC: [{ network: 'BTC', label: 'Bitcoin' }],
  ETH: [{ network: 'ERC20', label: 'Ethereum' }],
  SOL: [{ network: 'SOL', label: 'Solana' }],
};

function getTransactionIcon(type: string) {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="h-5 w-5" />;
    case 'withdrawal':
      return <ArrowUpRight className="h-5 w-5" />;
    case 'bet':
      return <ShoppingCart className="h-5 w-5" />;
    case 'payout':
    case 'refund':
      return <Trophy className="h-5 w-5" />;
    default:
      return <ArrowDownLeft className="h-5 w-5" />;
  }
}

function getTransactionIconBg(type: string) {
  switch (type) {
    case 'deposit':
    case 'payout':
    case 'refund':
      return 'bg-primary/20 text-primary';
    case 'withdrawal':
      return 'bg-destructive/20 text-destructive';
    case 'bet':
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NowPaymentsWidget({
  config,
  onClose,
}: {
  config: DepositFiatResult['widgetConfig'];
  onClose: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!config) return;

    // Load NOWPayments widget script
    const script = document.createElement('script');
    script.src = 'https://nowpayments.io/sdk/nowpayments.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [config]);

  useEffect(() => {
    if (!isLoaded || !config) return;

    // Initialize widget when script is loaded
    const initWidget = () => {
      // @ts-expect-error NOWPayments is loaded from external script
      if (window.NOWPaymentsButton) {
        // @ts-expect-error NOWPayments is loaded from external script
        window.NOWPaymentsButton.init({
          api_key: config.api_key,
          invoice_id: config.invoice_id,
          order_id: config.order_id,
          price_amount: config.price_amount,
          price_currency: config.price_currency,
          pay_currency: config.pay_currency,
          container_id: 'nowpayments-widget',
          onSuccess: () => {
            onClose();
            window.location.href = '/wallet?deposit=success';
          },
          onError: () => {
            console.error('NOWPayments error');
          },
        });
      }
    };

    const timer = setTimeout(initWidget, 500);
    return () => clearTimeout(timer);
  }, [isLoaded, config, onClose]);

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg rounded-2xl bg-card p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-4 text-lg font-semibold">Pagamento via PIX</h3>
        <div
          id="nowpayments-widget"
          className="min-h-[400px] flex items-center justify-center"
        >
          {!isLoaded && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando widget de pagamento...</p>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-center text-muted-foreground">
          Pagamento processado por NOWPayments. Sem KYC até €700.
        </p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const {
    balance,
    transactions,
    isLoading,
    isDepositing,
    isWithdrawing,
    error,
    fetchBalance,
    fetchTransactions,
    depositCrypto,
    depositFiat,
    withdraw,
    clearError,
  } = useWallet();

  const [showBalance, setShowBalance] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [cryptoType, setCryptoType] = useState<CryptoType>('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPixWidget, setShowPixWidget] = useState(false);
  const [pixWidgetConfig, setPixWidgetConfig] = useState<DepositFiatResult['widgetConfig']>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  useEffect(() => {
    // Check for success/error query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('deposit') === 'success') {
      setSuccessMessage('Depósito processado com sucesso!');
      fetchBalance();
      fetchTransactions();
      // Clean URL
      window.history.replaceState({}, '', '/wallet');
    }
  }, [fetchBalance, fetchTransactions]);

  const handleDepositCrypto = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 5) {
      return;
    }

    try {
      const result = await depositCrypto(amountNum);
      // Redirect to ccpayment checkout
      window.location.href = result.checkoutUrl;
    } catch {
      // Error is handled in the store
    }
  }, [amount, depositCrypto]);

  const handleDepositPix = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 5 || amountNum > 3500) {
      return;
    }

    try {
      const result = await depositFiat(amountNum);
      if (result.widgetConfig) {
        setPixWidgetConfig(result.widgetConfig);
        setShowPixWidget(true);
      } else {
        // Fallback to invoice URL if widget config not available
        window.location.href = result.invoiceUrl;
      }
    } catch {
      // Error is handled in the store
    }
  }, [amount, depositFiat]);

  const handleWithdraw = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10 || !withdrawAddress) {
      return;
    }

    try {
      await withdraw(amountNum, withdrawAddress, selectedNetwork);
      setSuccessMessage('Saque solicitado com sucesso! Processando...');
      setViewMode('main');
      setAmount('');
      setWithdrawAddress('');
    } catch {
      // Error is handled in the store
    }
  }, [amount, withdrawAddress, selectedNetwork, withdraw]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userBalance = balance?.balance ?? 0;
  const totalDeposited = balance?.totalDeposited ?? 0;
  const totalWithdrawn = balance?.totalWithdrawn ?? 0;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-4 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Balance Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Saldo total</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-4xl font-bold">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : showBalance ? (
                `$ ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              ) : (
                '$ ••••••'
              )}
            </p>
          </div>
          {totalDeposited > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-sm font-medium text-primary">
                +${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Balance Split */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Total depositado</p>
            <p className="mt-1 text-xl font-semibold">
              {showBalance
                ? `$ ${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '$ ••••'}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Total sacado</p>
            <p className="mt-1 text-xl font-semibold text-orange-400">
              {showBalance
                ? `$ ${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : '$ ••••'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button
            className="h-12 bg-primary text-base font-semibold hover:bg-primary/90"
            onClick={() => setViewMode(viewMode === 'main' ? 'deposit-select' : 'main')}
          >
            <ArrowDownLeft className="mr-2 h-5 w-5" />
            Depositar
          </Button>
          <Button
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => setViewMode(viewMode === 'main' ? 'withdraw' : 'main')}
          >
            <ArrowUpRight className="mr-2 h-5 w-5" />
            Sacar
          </Button>
        </div>
      </div>

      {/* Deposit Method Selection */}
      {viewMode === 'deposit-select' && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Escolha o método de depósito</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setViewMode('deposit-pix');
                setAmount('');
              }}
              className="flex flex-col items-center rounded-xl border border-border bg-secondary p-6 transition-all hover:border-primary/50 hover:bg-secondary/80"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <span className="font-semibold">PIX</span>
              <span className="mt-1 text-xs text-muted-foreground">Instantâneo • Sem taxas</span>
            </button>
            <button
              onClick={() => {
                setViewMode('deposit-crypto');
                setAmount('');
              }}
              className="flex flex-col items-center rounded-xl border border-border bg-secondary p-6 transition-all hover:border-primary/50 hover:bg-secondary/80"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                <Bitcoin className="h-6 w-6 text-orange-500" />
              </div>
              <span className="font-semibold">Crypto</span>
              <span className="mt-1 text-xs text-muted-foreground">USDT • BTC • ETH • SOL</span>
            </button>
          </div>
        </div>
      )}

      {/* PIX Deposit */}
      {viewMode === 'deposit-pix' && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <button
            onClick={() => setViewMode('deposit-select')}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Depósito via PIX</h3>
          </div>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="5"
                max="3500"
                className="h-12 pl-8 text-xl font-semibold bg-secondary border-0"
              />
            </div>

            <div className="flex gap-2">
              {quickAmountsPix.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                Depósitos PIX são processados instantaneamente. Mín: $5, Máx: $3.500.
              </span>
            </div>

            <Button
              className="w-full h-12 bg-primary text-base font-semibold hover:bg-primary/90"
              onClick={handleDepositPix}
              disabled={isDepositing || !amount || parseFloat(amount) < 5 || parseFloat(amount) > 3500}
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Crypto Deposit */}
      {viewMode === 'deposit-crypto' && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <button
            onClick={() => setViewMode('deposit-select')}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Depósito via Crypto</h3>
          </div>

          <div className="mt-6 space-y-4">
            {/* Crypto Type Selection */}
            <div className="grid grid-cols-4 gap-2">
              {(['USDT', 'BTC', 'ETH', 'SOL'] as CryptoType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setCryptoType(type);
                    setSelectedNetwork(cryptoNetworks[type][0].network);
                  }}
                  className={cn(
                    'flex flex-col items-center rounded-lg p-3 transition-all border',
                    cryptoType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-muted-foreground border-transparent hover:bg-muted'
                  )}
                >
                  <span className="text-lg font-semibold">
                    {type === 'USDT' && '$'}
                    {type === 'BTC' && '₿'}
                    {type === 'ETH' && 'Ξ'}
                    {type === 'SOL' && '◎'}
                  </span>
                  <span className="mt-1 text-xs">{type}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="5"
                className="h-12 pl-8 text-xl font-semibold bg-secondary border-0"
              />
            </div>

            <div className="flex gap-2">
              {quickAmountsCrypto.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setAmount(quickAmount.toString())}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
              <Info className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-500">
                Depósitos em {cryptoType} são processados via NOWPayments. Mínimo: $5.
              </span>
            </div>

            <Button
              className="w-full h-12 bg-primary text-base font-semibold hover:bg-primary/90"
              onClick={handleDepositCrypto}
              disabled={isDepositing || !amount || parseFloat(amount) < 5}
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando link...
                </>
              ) : (
                <>
                  Continuar
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {viewMode === 'withdraw' && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <button
            onClick={() => setViewMode('main')}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Saque via Crypto</h3>
          </div>

          <div className="mt-6 space-y-4">
            {/* Crypto Type Selection */}
            <div>
              <label className="text-sm text-muted-foreground">Moeda</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(['USDT', 'BTC', 'ETH', 'SOL'] as CryptoType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCryptoType(type);
                      setSelectedNetwork(cryptoNetworks[type][0].network);
                    }}
                    className={cn(
                      'flex flex-col items-center rounded-lg p-3 transition-all border',
                      cryptoType === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-transparent hover:bg-muted'
                    )}
                  >
                    <span className="text-sm font-semibold">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Network Selection */}
            <div>
              <label className="text-sm text-muted-foreground">Rede</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {cryptoNetworks[cryptoType].map((net) => (
                  <button
                    key={net.network}
                    onClick={() => setSelectedNetwork(net.network)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm transition-all border',
                      selectedNetwork === net.network
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-muted-foreground border-transparent hover:bg-muted'
                    )}
                  >
                    {net.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm text-muted-foreground">Valor</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="10"
                  max={userBalance}
                  className="h-12 pl-8 text-xl font-semibold bg-secondary border-0"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Disponível: ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm text-muted-foreground">Endereço da Wallet</label>
              <div className="relative mt-2">
                <Input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={`Endereço ${cryptoType} (${selectedNetwork})`}
                  className="h-12 pr-10 bg-secondary border-0"
                />
                {withdrawAddress && (
                  <button
                    onClick={() => copyToClipboard(withdrawAddress)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                Verifique o endereço e a rede antes de sacar. Saques são irreversíveis.
              </span>
            </div>

            <Button
              className="w-full h-12 bg-destructive text-base font-semibold hover:bg-destructive/90"
              onClick={handleWithdraw}
              disabled={
                isWithdrawing ||
                !amount ||
                parseFloat(amount) < 10 ||
                parseFloat(amount) > userBalance ||
                !withdrawAddress
              }
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                `Sacar $${amount || '0'}`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Histórico</h3>
          <button className="text-sm font-medium text-primary hover:underline">
            Ver tudo
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma transação ainda
            </div>
          ) : (
            transactions.map((tx: Transaction) => (
              <div
                key={tx._id}
                className="flex items-center justify-between rounded-lg bg-secondary p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      getTransactionIconBg(tx.type)
                    )}
                  >
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {tx.type === 'deposit' && 'Depósito'}
                      {tx.type === 'withdrawal' && 'Saque'}
                      {tx.type === 'bet' && 'Aposta'}
                      {tx.type === 'payout' && 'Ganho'}
                      {tx.type === 'refund' && 'Reembolso'}
                      {tx.type === 'fee' && 'Taxa'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'refund'
                        ? 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    {tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'refund' ? '+' : '-'}
                    $ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      tx.status === 'completed' && 'text-primary',
                      tx.status === 'pending' && 'text-yellow-500',
                      tx.status === 'failed' && 'text-destructive'
                    )}
                  >
                    {tx.status === 'completed' && 'Concluído'}
                    {tx.status === 'pending' && 'Pendente'}
                    {tx.status === 'failed' && 'Falhou'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* NOWPayments Widget Modal */}
      {showPixWidget && pixWidgetConfig && (
        <NowPaymentsWidget
          config={pixWidgetConfig}
          onClose={() => {
            setShowPixWidget(false);
            setPixWidgetConfig(undefined);
            setViewMode('main');
          }}
        />
      )}
    </div>
  );
}
