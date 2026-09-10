import React from 'react';
import {
  FiClock,
  FiShield,
  FiLock,
  FiAward,
  FiCheckCircle,
  FiUserCheck,
} from 'react-icons/fi';
import { Card } from '../ui/Card';
import type { AccountActivityLog } from '../../types';

interface AccountActivityLogsProps {
  logs: AccountActivityLog[];
}

export const AccountActivityLogs: React.FC<AccountActivityLogsProps> = ({ logs }) => {
  const getLogIcon = (type: AccountActivityLog['type']) => {
    switch (type) {
      case 'login':
        return <FiUserCheck className="w-4 h-4 text-emerald-600" />;
      case 'password_change':
        return <FiLock className="w-4 h-4 text-rose-600" />;
      case 'certificate_earned':
        return <FiAward className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'course_completed':
        return <FiCheckCircle className="w-4 h-4 text-brand-600" />;
      default:
        return <FiShield className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <Card className="p-6 space-y-4 border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FiClock className="w-4 h-4 text-brand-600" />
            <span>Recent Account Security Activity History</span>
          </h3>
          <p className="text-xs text-slate-500">
            Audit logs of login sessions, profile updates, and milestone events for security compliance.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                {getLogIcon(log.type)}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {log.action}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  IP: {log.ipAddress} ({log.location})
                </span>
              </div>
            </div>

            <span className="text-slate-400 font-mono text-[11px] self-end sm:self-auto shrink-0">
              {log.timestamp}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
