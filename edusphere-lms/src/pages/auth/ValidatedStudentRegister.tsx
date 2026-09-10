import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiAlertTriangle } from 'react-icons/fi';
import { TextInput } from '../../components/forms/TextInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';

const studentRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number (min 10 digits)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms & Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type StudentRegisterFormValues = z.infer<typeof studentRegisterSchema>;

export const ValidatedStudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent, signInWithGoogle } = useAuth();
  const { settings } = usePlatformSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRegistrationOpen = settings?.enableStudentRegistration !== false;

  const handleGoogleSignUp = async () => {
    if (!isRegistrationOpen) {
      setErrorMessage('Student registration is currently closed by platform administrators.');
      return;
    }
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Google sign up. Please try again.');
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StudentRegisterFormValues>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAgreed: true,
    },
  });

  const watchPassword = watch('password', '');

  // Password strength indicator logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: StudentRegisterFormValues) => {
    if (!isRegistrationOpen) {
      setErrorMessage('Student registration is currently closed by platform administrators.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerStudent({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        termsAgreed: data.termsAgreed,
      });
      setIsLoading(false);
      navigate('/auth/student-login', {
        state: { message: 'Registration successful! Please login with your credentials.' },
      });
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Create Student Account</h2>
        <p className="text-xs text-slate-500">Sign up to access courses and interactive learning</p>
      </div>

      {!isRegistrationOpen && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <FiAlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Student Registration Currently Closed</span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-relaxed block">
              New student sign-ups are temporarily paused by platform administrators. Existing students can sign in normally.
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 rounded-xl">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        disabled={!isRegistrationOpen}
        onClick={handleGoogleSignUp}
        className={`w-full flex items-center justify-center gap-3 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors ${
          !isRegistrationOpen ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <FcGoogle className="w-4 h-4" /> Sign Up with Google
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Full Name"
          placeholder="Alex Johnson"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextInput
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        {/* Password Strength Indicator */}
        {watchPassword && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
              <span>Password Strength:</span>
              <span className="capitalize">{strength.label}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              {...register('termsAgreed')}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            I agree to the <Link to="/terms" className="text-brand-600 hover:underline">Terms</Link> & <Link to="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          </label>
          {errors.termsAgreed && <p className="text-xs text-rose-500">{errors.termsAgreed.message}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5"
          isLoading={isLoading}
          disabled={!isRegistrationOpen}
        >
          {isRegistrationOpen ? 'Create Account' : 'Registration Closed'}
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-500">
          Already have an account?{' '}
          <Link to="/auth/student-login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
        <Link to="/auth/role-selection" className="text-slate-400 hover:text-slate-600 block">
          ← Back to Role Selection
        </Link>
      </div>
    </Card>
  );
};
