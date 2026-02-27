'use client';

import { Sidebar, Header, TickerBar, BetSlip } from '@/components/layout';
import { useBetSlip } from '@/hooks/use-bet-slip';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, removeItem, placeBet, isPlacingBet, error, clearError } = useBetSlip();

  const handleConfirmBet = async (amount: number) => {
    const success = await placeBet(amount);
    if (success) {
      // Optionally show success notification
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />

      <div
        className="min-h-screen"
        style={{
          marginLeft: 'var(--sidebar-width)',
          marginRight: 'var(--betslip-width)',
          width: 'calc(100% - var(--sidebar-width) - var(--betslip-width))',
        }}
      >
        <TickerBar />
        <Header />
        <main className="p-6 max-w-full">
          {children}
        </main>
      </div>

      <BetSlip
        items={items}
        onRemoveItem={removeItem}
        onConfirm={handleConfirmBet}
        isPlacingBet={isPlacingBet}
        error={error}
        onClearError={clearError}
      />
    </div>
  );
}
