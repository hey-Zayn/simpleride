'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/useAuthStore';
import AuthLayout from '@/components/auth/AuthLayout';
import { Eye, EyeOff, Loader2, User, Car } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Access state & actions from your unified auth store
  const loginUser = useAuthStore((state) => state.loginUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'RIDER' },
  });

  const handleRoleChange = (newRole: 'RIDER' | 'DRIVER') => {
    setRole(newRole);
    setValue('role', newRole, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);
    try {
      // Calls POST http://localhost:8000/auth/api/auth/login via authStore
      const user = await loginUser({
        email: data.email,
        password: data.password,
      });

      // Redirect to target route or role dashboard
      const redirectTo =
        searchParams.get('from') || (user.role === 'DRIVER' ? '/driver' : '/rider');
      router.push(redirectTo);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Invalid credentials. Please check your details.'
      );
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Sign in to access rides or driver management."
    >
      {/* Role Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 font-display bg-white rounded-md mb-6 border-2 border-black/20">
        <button
          type="button"
          onClick={() => handleRoleChange('RIDER')}
          className={`flex items-center justify-center gap-2 py-3 text-xs font-sans font-bold rounded-sm transition-all ${
            role === 'RIDER'
              ? 'bg-[#C1F11D] text-[#141414] shadow-sm border-2 border-[#9DD90D]'
              : 'text-[#141414]/60 hover:text-[#141414]'
          }`}
        >
          <User className="w-5 h-4 text-[#141414]" />
          <span className="text-xs">Passenger</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('DRIVER')}
          className={`flex items-center justify-center gap-2 py-3 text-xs font-sans font-bold rounded-sm transition-all ${
            role === 'DRIVER'
              ? 'bg-[#C1F11D] text-[#141414] shadow-sm border-2 border-[#9DD90D]'
              : 'text-[#141414]/60 hover:text-[#141414]'
          }`}
        >
          <Car className="w-4 h-4 text-[#141414]" />
          Driver Partner
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-sans font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
        {/* Email Input */}
        <div>
          <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
            Email address
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="name@example.com"
            className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3.5 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
          />
          {errors.email && (
            <p className="text-xs font-semibold text-rose-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold font-display text-[#141414]/80">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold font-display text-[#141414]/80 hover:opacity-80"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className="w-full bg-white border-2 font-display border-black/20 rounded-md px-4 py-3.5 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#141414]/50 hover:text-[#141414] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-semibold text-rose-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Action CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-[#141414] font-display hover:bg-[#141414]/90 text-white font-bold rounded-md py-4 text-sm transition-all flex items-center justify-center shadow-md active:scale-[0.99] border-2 border-transparent disabled:opacity-75"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#C1F11D]" />
          ) : (
            `Sign In as ${role === 'DRIVER' ? 'Driver' : 'Passenger'}`
          )}
        </button>
      </form>

      {/* Bottom Link */}
      <div className="text-center mt-6 pt-5 border-t-2 border-[#DCDBC7]">
        <span className="text-xs text-[#141414]/80 font-display font-bold">New here ? </span>
        <Link
          href="/register"
          className="text-xs font-display text-[#141414] font-bold hover:opacity-80 ml-1"
        >
          Register now
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFFEE9]">
          <Loader2 className="w-6 h-6 animate-spin text-[#141414]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}