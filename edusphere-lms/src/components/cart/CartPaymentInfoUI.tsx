import React from 'react';
import { FiShield, FiLock, FiCreditCard, FiSmartphone, FiGlobe, FiCheck } from 'react-icons/fi';
import { Card } from '../ui/Card';

export const CartPaymentInfoUI: React.FC = () => {
  const paymentMethods = [
    { name: 'Razorpay Gateway', badge: 'Official Gateway', icon: FiShield },
    { name: 'UPI Express', badge: 'rahul@upi, example@okaxis', icon: FiSmartphone },
    { name: 'Debit Cards', badge: 'RuPay, Visa, Mastercard', icon: FiCreditCard },
    { name: 'Credit Cards', badge: 'Visa, Mastercard, Amex', icon: FiCreditCard },
    { name: 'Net Banking', badge: 'HDFC, SBI, ICICI, Axis', icon: FiGlobe },
  ];

  return (
    <Card className="p-5 space-y-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
          <FiLock className="w-4 h-4 text-emerald-500" />
          Accepted Payment Methods & Security Assurance
        </h3>
        <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
          256-Bit SSL Encrypted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {paymentMethods.map((pm) => {
          const Icon = pm.icon;
          return (
            <div
              key={pm.name}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-center space-y-1"
            >
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{pm.name}</span>
              <span className="text-[10px] text-slate-400 truncate w-full">{pm.badge}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>No hidden charges or recurring monthly subscriptions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>GST Tax invoice available after checkout completion</span>
        </div>
      </div>
    </Card>
  );
};
