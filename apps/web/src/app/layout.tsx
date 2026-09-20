import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../lib/query-provider';
import Link from 'next/link';
import { ShieldCheck, Anchor, Truck, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DemurrageOS — Prevention & Unified Logistics Intelligence',
  description: 'Proactive container demurrage prevention, compliance signals, and unified operational handoffs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <QueryProvider>
          <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <Link href="/" className="font-bold text-lg text-slate-900 tracking-tight hover:text-blue-600 transition">
                    DemurrageOS
                  </Link>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                    Prevention + Unification
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm font-medium text-slate-600">
                <Link href="/" className="hover:text-blue-600 transition flex items-center gap-1.5">
                  <Anchor className="w-4 h-4" /> Containers
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-slate-500 font-mono">CHA Portal: Apex Logistics</span>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
