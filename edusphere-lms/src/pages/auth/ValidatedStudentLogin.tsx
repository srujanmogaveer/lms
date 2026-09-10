import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FiCheckCircle } from 'react-icons/fi';
import { TextInput } from '../../components/forms/TextInput';
import { PasswordInput } from '../../components/forms/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

const studentLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type StudentLoginFormValues = z.infer<typeof studentLoginSchema>;

export const ValidatedStudentLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    (location.state as { errorMessage?: string })?.errorMessage || null
  );
  const [successMessage] = useState<string | null>(
    (location.state as { message?: string })?.message || null
  );

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Google sign in. Please try again.');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginFormValues>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: StudentLoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({
        email: data.email,
        password: data.password,
        role: 'student',
      });
      setIsLoading(false);
      navigate('/student');
    } catch (err: any) {
      // Show proper error — do not fall back to mock/unauthenticated access
      if (err.message && err.message.includes('Invalid email or password')) {
        setErrorMessage('Invalid email or password. Please verify your credentials or use Google sign-in.');
      } else {
        setErrorMessage(err.message || 'Sign-in failed. Please check your credentials and try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Student Sign In</h2>
        <p className="text-xs text-slate-500">Validated UI Form via React Hook Form & Zod</p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 rounded-xl">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <FcGoogle className="w-4 h-4" /> Continue with Google
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Student Email Address"
          type="email"
          placeholder="alex.johnson@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Remember Me
          </label>
          <Link to="/auth/forgot-password" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
          Sign In to Portal
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs">
        <p className="text-slate-500">
          Don't have a student account?{' '}
          <Link to="/auth/student-register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Create Account
          </Link>
        </p>
        <Link to="/auth/role-selection" className="text-slate-400 hover:text-slate-600 block">
          ← Back to Role Selection
        </Link>
      </div>
    </Card>
  );
};
