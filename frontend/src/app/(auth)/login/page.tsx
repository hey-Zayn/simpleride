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
  Eye,
  EyeOff,
  Loader,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AuthCarousel } from '@/components/auth/auth-carousel';

interface ErrorResponse {
  message?: string;
}

const LIME = '#D3FF53';

const roleOptions = [
  { value: 'RIDER' as const, title: 'Passenger', description: 'Book and track rides', Icon: UserRound },
  { value: 'DRIVER' as const, title: 'Driver partner', description: 'Manage your dispatches', Icon: CarFront },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3a7.15 7.15 0 0 1-10.66-3.76H1.4v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.34a7.2 7.2 0 0 1 0-4.62V6.63H1.4a12 12 0 0 0 0 10.8l4-3.09z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.4 6.63l4 3.09A7.15 7.15 0 0 1 12 4.77z" />
    </svg>
  );
}

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
      window.location.href = requestedPath ?? defaultPath;
    } catch (error) {
      const apiError = error as AxiosError<ErrorResponse>;
      setErrorMessage(apiError.response?.data?.message ?? 'We could not sign you in. Check your details and try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f1] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[10px] border border-[#DEDFDE] bg-[#FCFFFF] shadow-[0_8px_24px_rgba(20,20,20,0.06)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Carousel panel — image, text, progress rail only */}
        <section className="max-sm:hidden flex flex-col justify-center border-b border-[#DEDFDE] bg-[#FCFFFF] p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div className="lg:hidden">
            <AuthCarousel compact />
          </div>
          <div className="hidden lg:block">
            <AuthCarousel />
          </div>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">Welcome back</p>
              <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.045em] text-[#141414]">Sign in to RideFlow</h2>
              <p className="mt-3 text-sm leading-6 text-[#141414]/62">Choose your workspace and continue where you left off.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <fieldset>
                <legend className="mb-2.5 font-display text-xs font-semibold tracking-[0.01em] text-[#141414]/76">
                  I&apos;m signing in as
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map(({ value, title, description, Icon }) => {
                    const isSelected = selectedRole === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(value);
                          setValue('role', value, { shouldValidate: true });
                        }}
                        aria-pressed={isSelected}
                        className={cn(
                          'rounded-[10px] border p-3 text-left transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99]',
                          isSelected
                            ? 'border-[#141414] bg-[#141414]'
                            : 'border-[#DEDFDE] bg-white hover:border-[#141414]/30 hover:bg-[#FCFFFF]'
                        )}
                        style={{ outlineColor: LIME }}
                      >
                        <span
                          className="mb-4 flex size-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: isSelected ? LIME : 'transparent' }}
                        >
                          <Icon className="size-4" style={{ color: isSelected ? '#141414' : '#1414148F' }} aria-hidden="true" />
                        </span>
                        <span className={cn('block font-display text-sm font-semibold', isSelected ? 'text-white' : 'text-[#141414]')}>
                          {title}
                        </span>
                        <span className={cn('mt-1 block text-xs leading-4', isSelected ? 'text-white/60' : 'text-[#141414]/56')}>
                          {description}
                        </span>
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
                <Label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-[0.01em] text-[#141414]/76">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#141414]/42" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...register('email')}
                    className="h-12 rounded-[6px] border-[#DEDFDE] bg-[#FCFFFF] pl-10 pr-4 text-sm placeholder:text-[#141414]/36 focus-visible:border-[#141414] focus-visible:ring-2 focus-visible:ring-offset-0"
                    style={{ ['--tw-ring-color' as string]: `${LIME}66` }}
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-xs font-semibold tracking-[0.01em] text-[#141414]/76">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#141414] underline decoration-[#141414]/30 underline-offset-4 transition-colors hover:text-[#141414]/70"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#141414]/42" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password')}
                    className="h-12 rounded-[6px] border-[#DEDFDE] bg-[#FCFFFF] pl-10 pr-12 text-sm placeholder:text-[#141414]/36 focus-visible:border-[#141414] focus-visible:ring-2 focus-visible:ring-offset-0"
                    style={{ ['--tw-ring-color' as string]: `${LIME}66` }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 size-7 -translate-y-1/2 text-[#141414]/55 hover:bg-black/5 hover:text-[#141414]"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </Button>
                </div>
                {errors.password && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-12 w-full rounded-[6px] bg-[#D3FF53] text-sm font-semibold text-[#141414] hover:bg-[#c5f43e] hover:text-black active:scale-[0.99]"
              >
                {isLoading ? (
                  <Loader className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    Continue to workspace
                    <ArrowUpRight className="size-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1 bg-[#DEDFDE]" />
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#141414]/40">Or continue with</span>
              <Separator className="flex-1 bg-[#DEDFDE]" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-[6px] border-[#141414] text-sm font-medium text-white/80 hover:border-[#141414]/30 hover:bg-black/90 hover:text-white/80"
            >
              <GoogleIcon />
              Google
            </Button>

            <p className="mt-8 text-center text-sm text-[#141414]/62">
              New to RideFlow?{' '}
              <Link href="/register" className="font-semibold text-[#141414] underline decoration-[#141414]/30 underline-offset-4 transition-colors hover:text-[#141414]/70">
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#FCFFFF]">
          <Loader className="size-6 animate-spin text-[#141414]" aria-label="Loading sign in" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}