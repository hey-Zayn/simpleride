'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import {
  ArrowUpRight,
  CarFront,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  Wifi,
} from 'lucide-react';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/useAuthStore';

interface ErrorResponse {
  message?: string;
}

const roleOptions = [
  {
    value: 'RIDER' as const,
    title: 'Passenger',
    description: 'Book and track rides',
    Icon: UserRound,
  },
  {
    value: 'DRIVER' as const,
    title: 'Driver partner',
    description: 'Manage your dispatches',
    Icon: CarFront,
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useAuthStore((state) => state.loginUser);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginInput['role']>('RIDER');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'RIDER', email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);
    try {
      const user = await loginUser(data);
      const requestedPath = searchParams.get('from');
      const defaultPath = user.role === 'DRIVER' ? '/driver' : '/rider';
      const target = requestedPath ?? defaultPath;
      window.location.href = target;
    } catch (error) {
      const apiError = error as AxiosError<ErrorResponse>;
      setErrorMessage(apiError.response?.data?.message ?? 'We could not sign you in. Check your details and try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f1] p-3 text-[#141414] sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[10px] border border-[#DEDFDE] bg-[#FCFFFF] shadow-[0_8px_24px_rgba(20,20,20,0.06)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#141414] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,121,32,0.16),transparent_35%),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,32px_32px,32px_32px]" />
          <div className="relative flex items-center gap-3 font-display text-sm font-semibold tracking-[-0.01em]">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#F47920] text-[#141414]">
              <CarFront className="size-5" aria-hidden="true" />
            </span>
            RideFlow
          </div>

          <div className="relative my-auto max-w-md">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D5D8C5]"><span className="size-1.5 rounded-full bg-[#F47920]" />Dispatch network</div>
            <h1 className="font-display text-4xl leading-[1.06] tracking-[-0.045em]">Mobility, under control.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/66">A secure operational workspace for booking rides, managing dispatches, and tracking every movement in real time.</p>
          </div>

          <div className="relative grid grid-cols-3 gap-3 border-t border-white/12 pt-6 text-xs text-white/60">
            {['Verified drivers', 'Live dispatch', 'Secure access'].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[#F47920]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-[#141414] transition-colors hover:text-[#F47920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F47920] lg:hidden">
              <span className="grid size-8 place-items-center rounded-[8px] bg-[#141414] text-white"><CarFront className="size-4" aria-hidden="true" /></span>
              RideFlow
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">Welcome back</p>
              <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.045em] text-[#141414]">Sign in to RideFlow</h2>
              <p className="mt-3 text-sm leading-6 text-[#141414]/62">Choose your workspace and continue where you left off.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <fieldset>
                <legend className="mb-2.5 font-display text-xs font-semibold tracking-[0.01em] text-[#141414]/76">I&apos;m signing in as</legend>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map(({ value, title, description, Icon }) => {
                    const isSelected = selectedRole === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setSelectedRole(value); setValue('role', value, { shouldValidate: true }); }}
                        aria-pressed={isSelected}
                        className={`rounded-[10px] border p-3 text-left transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920] active:scale-[0.99] ${isSelected ? 'border-[#F47920] bg-[#F47920]/10' : 'border-[#DEDFDE] bg-white hover:border-[#F47920]/55 hover:bg-[#FCFFFF]'}`}
                      >
                        <Icon className={`mb-4 size-4 ${isSelected ? 'text-[#F47920]' : 'text-[#141414]/56'}`} aria-hidden="true" />
                        <span className="block font-display text-sm font-semibold text-[#141414]">{title}</span>
                        <span className="mt-1 block text-xs leading-4 text-[#141414]/56">{description}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.role.message}</p>}
              </fieldset>

              {errorMessage && (
                <div role="alert" className="flex gap-3 rounded-[10px] border border-[#E3413F]/25 bg-[#E3413F]/10 p-3 text-sm text-[#9E2422]">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-[0.01em] text-[#141414]/76">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#141414]/42" aria-hidden="true" />
                  <input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} className="h-12 w-full rounded-[6px] border border-[#DEDFDE] bg-[#FCFFFF] py-3 pl-10 pr-4 text-sm text-[#141414] placeholder:text-[#141414]/36 transition-colors focus:border-[#F47920] focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 disabled:cursor-not-allowed disabled:opacity-55" />
                </div>
                {errors.email && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-xs font-semibold tracking-[0.01em] text-[#141414]/76">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#141414] underline decoration-[#141414]/30 underline-offset-4 transition-colors hover:text-[#F47920] hover:decoration-[#F47920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F47920]">Forgot password?</Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#141414]/42" aria-hidden="true" />
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" {...register('password')} className="h-12 w-full rounded-[6px] border border-[#DEDFDE] bg-[#FCFFFF] py-3 pl-10 pr-12 text-sm text-[#141414] placeholder:text-[#141414]/36 transition-colors focus:border-[#F47920] focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 disabled:cursor-not-allowed disabled:opacity-55" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[6px] text-[#141414]/55 transition-colors hover:bg-[#F47920]/10 hover:text-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920]">
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-[#F47920] px-4 text-sm font-semibold text-[#141414] transition-[background-color,transform] duration-150 ease-out hover:bg-[#e56c18] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#F47920] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55">
                {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <>Continue to workspace <ArrowUpRight className="size-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#141414]/62">New to RideFlow? <Link href="/register" className="font-semibold text-[#141414] underline decoration-[#141414]/30 underline-offset-4 transition-colors hover:text-[#F47920] hover:decoration-[#F47920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F47920]">Create an account</Link></p>
            <div className="mt-8 flex items-center justify-center gap-4 border-t border-[#DEDFDE] pt-5 text-xs text-[#141414]/48"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-[#1F9D55]" aria-hidden="true" /> Encrypted access</span><span className="flex items-center gap-1.5"><Wifi className="size-3.5 text-[#1F9D55]" aria-hidden="true" /> Network online</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#FCFFFF]"><LoaderCircle className="size-6 animate-spin text-[#F47920]" aria-label="Loading sign in" /></main>}><LoginForm /></Suspense>;
}
