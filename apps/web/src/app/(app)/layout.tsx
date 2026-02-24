'use client';

import { useState } from 'react';
import { Sidebar, Header, TickerBar, BetSlip } from '@/components/layout';

interface BetSlipItem {
  id: string;
  eventTitle: string;
  outcome: 'yes' | 'no';
  odds: number;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [betSlipItems, setBetSlipItems] = useState<BetSlipItem[]>([]);

  const handleRemoveItem = (id: string) => {
    setBetSlipItems((items) => items.filter((item) => item.id !== id));
  };

  const handleConfirmBet = (amount: number) => {
    console.log('Confirming bet:', { items: betSlipItems, amount });
    // TODO: Implement bet confirmation logic
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
        items={betSlipItems}
        onRemoveItem={handleRemoveItem}
        onConfirm={handleConfirmBet}
      />
    </div>
  );
}
