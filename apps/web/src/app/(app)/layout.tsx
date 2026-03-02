'use client';

import { Sidebar, Header, BetSlip, TickerBar } from '@/components/layout';
import { useBetSlip } from '@/hooks/use-bet-slip';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, removeItem, placeBet, isPlacingBet, error, clearError, isExpanded, toggleExpanded } = useBetSlip();

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
        className="min-h-screen transition-all duration-300"
        style={{
          marginLeft: 'var(--sidebar-width)',
          marginRight: isExpanded ? 'var(--betslip-width)' : '0px',
          width: isExpanded
            ? 'calc(100% - var(--sidebar-width) - var(--betslip-width))'
            : 'calc(100% - var(--sidebar-width))',
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
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
      />
    </div>
  );
}
