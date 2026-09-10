import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import type { TextInputProps } from './TextInput';
import { TextInput } from './TextInput';

export const PasswordInput: React.FC<TextInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <TextInput
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm focus:outline-none"
      >
        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
      </button>
    </div>
  );
};
