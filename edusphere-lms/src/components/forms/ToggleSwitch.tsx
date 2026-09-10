import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
};
