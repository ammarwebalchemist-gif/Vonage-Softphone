import { Phone } from 'lucide-react';

export function Header() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Phone className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        <h1 className="font-bold text-2xl text-slate-800">Sales Dialer</h1>
      </div>
      <p className="text-sm text-slate-500 font-light">Manual Outbound Calling</p>
    </div>
  );
}
