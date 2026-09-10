import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCreditCard, FiSmartphone, FiAlertCircle, FiSave } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { InstructorPayoutInfo, PayoutMethodType } from '../../types/payoutTypes';

interface PayoutInformationSectionProps {
  instructorId?: string;
  onShowToast: (message: string, type?: 'info' | 'success') => void;
}

export const PayoutInformationSection: React.FC<PayoutInformationSectionProps> = ({
  onShowToast,
}) => {
  const { rawProfile, updateProfile } = useAuth();
  const [, setIsSaving] = useState(false);

  const initialPayoutInfo: InstructorPayoutInfo = rawProfile?.payoutInfo || {
    selectedMethod: 'Bank Account',
    bankDetails: {
      accountHolderName: rawProfile?.fullName || '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'Savings',
    },
    upiDetails: {
      upiId: '',
      upiAccountName: rawProfile?.fullName || '',
    },
  };

  const [payoutInfo, setPayoutInfo] = useState<InstructorPayoutInfo>(initialPayoutInfo);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (rawProfile?.payoutInfo) {
      setPayoutInfo(rawProfile.payoutInfo);
    }
  }, [rawProfile]);

  const handleMethodChange = async (method: PayoutMethodType) => {
    setErrors({});
    const updated = { ...payoutInfo, selectedMethod: method };
    setPayoutInfo(updated);
    try {
      await updateProfile({ payoutInfo: updated });
      onShowToast(`Default payout method set to ${method}.`);
    } catch {
      onShowToast(`Default payout method changed.`);
    }
  };

  const validateBankDetails = () => {
    const errs: { [key: string]: string } = {};
    if (!payoutInfo.bankDetails.accountHolderName.trim()) {
      errs.accountHolderName = 'Account Holder Name is required';
    }
    if (!payoutInfo.bankDetails.bankName.trim()) {
      errs.bankName = 'Bank Name is required';
    }
    if (!payoutInfo.bankDetails.accountNumber.trim()) {
      errs.accountNumber = 'Account Number is required';
    } else if (!/^\d{9,18}$/.test(payoutInfo.bankDetails.accountNumber.trim())) {
      errs.accountNumber = 'Enter a valid 9 to 18 digit account number';
    }
    if (!payoutInfo.bankDetails.ifscCode.trim()) {
      errs.ifscCode = 'IFSC Code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(payoutInfo.bankDetails.ifscCode.trim())) {
      errs.ifscCode = 'Enter a valid 11-character IFSC Code (e.g. HDFC0000240)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateUPIDetails = () => {
    const errs: { [key: string]: string } = {};
    const upiId = payoutInfo.upiDetails.upiId.trim();
    if (!upiId) {
      errs.upiId = 'UPI ID is required';
    } else if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      errs.upiId = 'Enter a valid UPI ID (e.g., rahul@okaxis, teacher@ybl)';
    }
    if (!payoutInfo.upiDetails.upiAccountName.trim()) {
      errs.upiAccountName = 'UPI Account Name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateBankDetails()) {
      setIsSaving(true);
      try {
        const updated = {
          ...payoutInfo,
          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
        await updateProfile({ payoutInfo: updated });
        onShowToast('Bank Account details saved to database successfully!');
      } catch (err: any) {
        onShowToast(err.message || 'Failed to update bank details', 'info');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveUPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUPIDetails()) {
      setIsSaving(true);
      try {
        const updated = {
          ...payoutInfo,
          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
        await updateProfile({ payoutInfo: updated });
        onShowToast('UPI Payout details saved to database successfully!');
      } catch (err: any) {
        onShowToast(err.message || 'Failed to update UPI details', 'info');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-emerald-600" />
            Payout Information
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure how you wish to receive your earnings from EduSphere course sales.
          </p>
        </div>

        {payoutInfo?.lastUpdated && (
          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-fit">
            Last Updated: {payoutInfo.lastUpdated}
          </span>
        )}
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Preferred Payment Method *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleMethodChange('Bank Account')}
            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
              payoutInfo.selectedMethod === 'Bank Account'
                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              payoutInfo.selectedMethod === 'Bank Account' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <FiCreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>Bank Account</span>
                {payoutInfo.selectedMethod === 'Bank Account' && (
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded font-extrabold">Default</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                NEFT / RTGS / IMPS Direct Bank Transfer
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleMethodChange('UPI ID')}
            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
              payoutInfo.selectedMethod === 'UPI ID'
                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              payoutInfo.selectedMethod === 'UPI ID' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <FiSmartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>UPI ID</span>
                {payoutInfo.selectedMethod === 'UPI ID' && (
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded font-extrabold">Default</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Instant UPI Transfer (Google Pay, PhonePe, BHIM)
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* BANK ACCOUNT FORM */}
      {payoutInfo.selectedMethod === 'Bank Account' && (
        <form onSubmit={handleSaveBank} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={payoutInfo.bankDetails.accountHolderName}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    bankDetails: { ...payoutInfo.bankDetails, accountHolderName: e.target.value },
                  })
                }
                placeholder="Name as per Bank Account"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border ${
                  errors.accountHolderName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.accountHolderName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.accountHolderName}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={payoutInfo.bankDetails.bankName}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    bankDetails: { ...payoutInfo.bankDetails, bankName: e.target.value },
                  })
                }
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border ${
                  errors.bankName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.bankName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.bankName}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                value={payoutInfo.bankDetails.accountNumber}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    bankDetails: { ...payoutInfo.bankDetails, accountNumber: e.target.value },
                  })
                }
                placeholder="Enter 9-18 digit Bank Account Number"
                className={`w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border ${
                  errors.accountNumber ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.accountNumber && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.accountNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                value={payoutInfo.bankDetails.ifscCode}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    bankDetails: { ...payoutInfo.bankDetails, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                placeholder="e.g. HDFC0000240"
                className={`w-full px-3 py-2 font-mono uppercase bg-slate-50 dark:bg-slate-800 border ${
                  errors.ifscCode ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.ifscCode && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.ifscCode}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Type *
              </label>
              <select
                value={payoutInfo.bankDetails.accountType}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    bankDetails: {
                      ...payoutInfo.bankDetails,
                      accountType: e.target.value as 'Savings' | 'Current',
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Savings">Savings Account</option>
                <option value="Current">Current Account</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 text-xs"
            >
              <FiSave className="w-4 h-4" /> Save Bank Details
            </Button>
          </div>
        </form>
      )}

      {/* UPI FORM */}
      {payoutInfo.selectedMethod === 'UPI ID' && (
        <form onSubmit={handleSaveUPI} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                UPI ID *
              </label>
              <input
                type="text"
                value={payoutInfo.upiDetails.upiId}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    upiDetails: { ...payoutInfo.upiDetails, upiId: e.target.value },
                  })
                }
                placeholder="e.g. rahul@okaxis, teacher@ybl, instructor@ibl"
                className={`w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border ${
                  errors.upiId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.upiId ? (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.upiId}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Examples: <span className="font-mono text-purple-600 dark:text-purple-400">rahul@okaxis</span>, <span className="font-mono text-purple-600 dark:text-purple-400">teacher@ybl</span>, <span className="font-mono text-purple-600 dark:text-purple-400">instructor@ibl</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                UPI Account Name *
              </label>
              <input
                type="text"
                value={payoutInfo.upiDetails.upiAccountName}
                onChange={(e) =>
                  setPayoutInfo({
                    ...payoutInfo,
                    upiDetails: { ...payoutInfo.upiDetails, upiAccountName: e.target.value },
                  })
                }
                placeholder="Full name registered on UPI app"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border ${
                  errors.upiAccountName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.upiAccountName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" /> {errors.upiAccountName}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 text-xs"
            >
              <FiSave className="w-4 h-4" /> Save UPI Details
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};
