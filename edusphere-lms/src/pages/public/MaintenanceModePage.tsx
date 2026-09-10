import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiTool,
  FiMail,
  FiPhone,
  FiLock,
  FiShield,
  FiArrowRight,
  FiRefreshCw
} from 'react-icons/fi';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import { Button } from '../../components/ui/Button';

export const MaintenanceModePage: React.FC = () => {
  const { settings, refetch } = usePlatformSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-[32px] p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-8"
      >
        {/* Animated Tool Badge */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/20 rounded-3xl animate-pulse blur-md" />
          <div className="relative w-20 h-20 bg-rose-500/10 border-2 border-rose-500/40 rounded-3xl flex items-center justify-center text-rose-400 shadow-inner">
            <FiTool className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black tracking-wider uppercase">
            <FiShield className="w-3.5 h-3.5" /> Scheduled Maintenance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {settings.platformName || 'EduSphere LMS'} is Undergoing Maintenance
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {settings.maintenanceMessage || 'We are currently performing scheduled platform upgrades and optimizations to enhance your learning experience.'}
          </p>
        </div>

        {/* Support Card */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Need Immediate Assistance?
          </span>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-300">
            {settings.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="flex items-center gap-2 hover:text-white transition-colors underline font-medium"
              >
                <FiMail className="w-4 h-4 text-indigo-400" />
                <span>{settings.supportEmail}</span>
              </a>
            )}
            {settings.supportPhone && (
              <a
                href={`tel:${settings.supportPhone}`}
                className="flex items-center gap-2 hover:text-white transition-colors underline font-medium font-mono"
              >
                <FiPhone className="w-4 h-4 text-emerald-400" />
                <span>{settings.supportPhone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full py-3 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-3.5 h-3.5" /> Check Platform Status
          </Button>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Are you a platform administrator?</span>
            <Link
              to="/auth/admin-login"
              className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
            >
              <FiLock className="w-3 h-3" /> Admin Sign In <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
