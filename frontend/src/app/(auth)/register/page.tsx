'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CarFront,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/useAuthStore';

interface ErrorResponse {
  errors?: Array<{ message?: string }>;
  message?: string;
}

const roleOptions = [
  { value: 'RIDER' as const, label: 'Passenger', detail: 'Book and track rides', Icon: UserRound },
  { value: 'DRIVER' as const, label: 'Driver partner', detail: 'Manage dispatches', Icon: CarFront },
];

const stepLabels = ['Profile', 'Security', 'Vehicle'];

function RegisterForm() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.registerUser);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<NonNullable<RegisterInput['vehicleType']>>('BIKE');
  const totalSteps = role === 'DRIVER' ? 3 : 2;

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'RIDER', vehicleType: 'BIKE' },
  });


  const handleRoleChange = (newRole: 'RIDER' | 'DRIVER') => {
    setRole(newRole);
    setValue('role', newRole, { shouldValidate: true });
    if (newRole === 'DRIVER') {
      setSelectedVehicleType('BIKE');
      setValue('vehicleType', 'BIKE', { shouldValidate: true });
    }
    setStep(1);
  };

  const handleNextStep = async () => {
    const fieldsToValidate: Array<keyof RegisterInput> = step === 1
      ? ['fullName', 'email', 'phone']
      : ['password'];

    if (step === 2 && role === 'RIDER') {
      handleSubmit(onSubmit)();
      return;
    }

    if (await trigger(fieldsToValidate)) {
      setStep((currentStep) => Math.min(currentStep + 1, totalSteps));
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setErrorMessage(null);

    const payload = role === 'RIDER'
      ? {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'RIDER' as const,
        }
      : {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'DRIVER' as const,
          vehicleType: data.vehicleType,
          vehicleNumber: data.vehicleNumber,
          licenseNumber: data.licenseNumber,
        };

    try {
      await registerUser(payload);
      router.replace(role === 'DRIVER' ? '/driver' : '/rider');
    } catch (error) {
      const apiError = error as AxiosError<ErrorResponse>;
      const messages = apiError.response?.data?.errors
        ?.map((item) => item.message)
        .filter((message): message is string => Boolean(message));
      setErrorMessage(messages?.join(', ') || apiError.response?.data?.message || 'We could not create your account. Please review your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = 'h-12 w-full rounded-[6px] border border-[#DEDFDE] bg-[#FCFFFF] py-3 pl-10 pr-4 text-sm text-[#141414] placeholder:text-[#141414]/36 transition-colors focus:border-[#F47920] focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 disabled:cursor-not-allowed disabled:opacity-55';

  return (
    <main className="min-h-screen bg-[#f4f5f1] p-3 text-[#141414] sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[10px] border border-[#DEDFDE] bg-[#FCFFFF] shadow-[0_8px_24px_rgba(20,20,20,0.06)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#141414] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(244,121,32,0.16),transparent_35%),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,32px_32px,32px_32px]" />
          <div className="relative flex items-center gap-3 font-display text-sm font-semibold tracking-[-0.01em]">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#F47920] text-[#141414]"><CarFront className="size-5" aria-hidden="true" /></span>
            RideFlow
          </div>
          <div className="relative my-auto max-w-md">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D5D8C5]"><span className="size-1.5 rounded-full bg-[#F47920]" />Account setup</div>
            <h1 className="font-display text-4xl leading-[1.06] tracking-[-0.045em]">Start moving with clarity.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/66">Create one account to book rides or manage your driver dispatches with confidence.</p>
          </div>
          <div className="relative grid grid-cols-3 gap-3 border-t border-white/12 pt-6 text-xs text-white/60">
            {['Quick setup', 'Verified access', 'Live support'].map((item) => <div key={item} className="flex items-start gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-[#F47920]" aria-hidden="true" /><span>{item}</span></div>)}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#141414] transition-colors hover:text-[#F47920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F47920] lg:hidden"><span className="grid size-8 place-items-center rounded-[8px] bg-[#141414] text-white"><CarFront className="size-4" aria-hidden="true" /></span>RideFlow</Link>
            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8A8A]">New account</p>
              <h2 className="font-display text-4xl leading-[1.05] tracking-[-0.045em]">Create your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-[#141414]/62">A few details now, then you&apos;re ready to move.</p>
            </div>

            <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Registration progress">
              {stepLabels.slice(0, totalSteps).map((label, index) => {
                const stepNumber = index + 1;
                const isCurrent = stepNumber === step;
                const isComplete = stepNumber < step;
                return <li key={label} className="min-w-0"><div className={`mb-2 h-1 rounded-full ${isComplete || isCurrent ? 'bg-[#F47920]' : 'bg-[#DEDFDE]'}`} /><span className={`block text-xs font-medium ${isCurrent ? 'text-[#141414]' : 'text-[#141414]/48'}`}>{String(stepNumber).padStart(2, '0')} <span className="hidden sm:inline">{label}</span></span></li>;
              })}
            </ol>

            {step === 1 && <fieldset className="mb-6"><legend className="mb-2.5 text-xs font-semibold text-[#141414]/76">I&apos;m creating an account as</legend><div className="grid grid-cols-2 gap-3">{roleOptions.map(({ value, label, detail, Icon }) => { const isSelected = role === value; return <button key={value} type="button" onClick={() => handleRoleChange(value)} aria-pressed={isSelected} className={`min-h-28 rounded-[10px] border p-3 text-left transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920] active:scale-[0.99] ${isSelected ? 'border-[#F47920] bg-[#F47920]/10' : 'border-[#DEDFDE] bg-white hover:border-[#F47920]/55 hover:bg-[#f8f9f5]'}`}><Icon className={`mb-4 size-4 ${isSelected ? 'text-[#F47920]' : 'text-[#141414]/56'}`} aria-hidden="true" /><span className="block font-display text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-4 text-[#141414]/56">{detail}</span></button>; })}</div></fieldset>}

            {errorMessage && <div role="alert" className="mb-5 flex gap-3 rounded-[10px] border border-[#E3413F]/25 bg-[#E3413F]/10 p-3 text-sm text-[#9E2422]"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>{errorMessage}</p></div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {step === 1 && <div className="space-y-4">
                <FormField label="Full name" id="fullName" icon={<UserRound className="size-4" aria-hidden="true" />} error={errors.fullName?.message}><input id="fullName" autoComplete="name" placeholder="Your full name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} className={inputClassName} /></FormField>
                <FormField label="Email address" id="email" icon={<Mail className="size-4" aria-hidden="true" />} error={errors.email?.message}><input id="email" type="email" autoComplete="email" placeholder={role === 'DRIVER' ? 'driver@company.com' : 'you@company.com'} aria-invalid={Boolean(errors.email)} {...register('email')} className={inputClassName} /></FormField>
                <FormField label="Phone number" id="phone" icon={<Phone className="size-4" aria-hidden="true" />} error={errors.phone?.message}><input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+92 300 0000000" aria-invalid={Boolean(errors.phone)} {...register('phone')} className={inputClassName} /></FormField>
              </div>}

              {step === 2 && <FormField label="Password" id="password" error={errors.password?.message}><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#141414]/42" aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} {...register('password')} className={`${inputClassName} pr-12`} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[6px] text-[#141414]/55 transition-colors hover:bg-[#F47920]/10 hover:text-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920]">{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button></div><p className="mt-2 text-xs text-[#141414]/48">Use at least 8 characters to secure your account.</p></FormField>}

              {step === 3 && role === 'DRIVER' && <div className="space-y-4"><fieldset><legend className="mb-2.5 text-xs font-semibold text-[#141414]/76">Vehicle category</legend><div className="grid grid-cols-3 gap-2">{([{ value: 'BIKE', label: 'Bike', Icon: Bike }, { value: 'MINI', label: 'Mini', Icon: Car }, { value: 'COMFORT', label: 'Comfort', Icon: ShieldCheck }] as const).map(({ value, label, Icon }) => { const isSelected = selectedVehicleType === value; return <button key={value} type="button" onClick={() => { setSelectedVehicleType(value); setValue('vehicleType', value, { shouldValidate: true }); }} aria-pressed={isSelected} className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[6px] border text-xs font-semibold transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920] active:scale-[0.99] ${isSelected ? 'border-[#F47920] bg-[#F47920]/10 text-[#141414]' : 'border-[#DEDFDE] text-[#141414]/60 hover:border-[#F47920]/55 hover:bg-[#f8f9f5]'}`}><Icon className={`size-4 ${isSelected ? 'text-[#F47920]' : ''}`} aria-hidden="true" />{label}</button>; })}</div>{errors.vehicleType && <p className="mt-2 text-xs font-medium text-[#E3413F]">{errors.vehicleType.message}</p>}</fieldset><FormField label="Vehicle number" id="vehicleNumber" icon={<Car className="size-4" aria-hidden="true" />} error={errors.vehicleNumber?.message}><input id="vehicleNumber" autoComplete="off" placeholder="LEB-9447" aria-invalid={Boolean(errors.vehicleNumber)} {...register('vehicleNumber')} className={inputClassName} /></FormField><FormField label="License number" id="licenseNumber" icon={<ShieldCheck className="size-4" aria-hidden="true" />} error={errors.licenseNumber?.message}><input id="licenseNumber" autoComplete="off" placeholder="DL-00000000000" aria-invalid={Boolean(errors.licenseNumber)} {...register('licenseNumber')} className={inputClassName} /></FormField></div>}

              <div className="flex gap-3 pt-2">{step > 1 && <button type="button" onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 1))} disabled={loading} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[6px] border border-[#DEDFDE] bg-white text-sm font-semibold transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[#141414]/35 hover:bg-[#f8f9f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47920] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"><ArrowLeft className="size-4" aria-hidden="true" />Back</button>}{step < totalSteps ? <button type="button" onClick={handleNextStep} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#141414] text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-[#2b2b2b] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#F47920] active:scale-[0.99]">Continue<ArrowRight className="size-4" aria-hidden="true" /></button> : <button type="submit" disabled={loading} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#F47920] text-sm font-semibold text-[#141414] transition-[background-color,transform] duration-150 ease-out hover:bg-[#e56c18] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#F47920] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55">{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <>Create account<ArrowRight className="size-4" aria-hidden="true" /></>}</button>}</div>
            </form>
            <p className="mt-8 border-t border-[#DEDFDE] pt-5 text-center text-sm text-[#141414]/62">Already have an account? <Link href="/login" className="font-semibold text-[#141414] underline decoration-[#141414]/30 underline-offset-4 transition-colors hover:text-[#F47920] hover:decoration-[#F47920] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F47920]">Sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
  id: string;
  label: string;
}

function FormField({ children, error, icon, id, label }: FormFieldProps) {
  return <div><label htmlFor={id} className="mb-2 block text-xs font-semibold tracking-[0.01em] text-[#141414]/76">{label}</label><div className="relative">{icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#141414]/42">{icon}</span>}{children}</div>{error && <p className="mt-2 text-xs font-medium text-[#E3413F]">{error}</p>}</div>;
}

export default function RegisterPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#FCFFFF]"><LoaderCircle className="size-6 animate-spin text-[#F47920]" aria-label="Loading registration" /></main>}><RegisterForm /></Suspense>;
}