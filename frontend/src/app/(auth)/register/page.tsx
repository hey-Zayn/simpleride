'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/useAuthStore';
import AuthLayout from '@/components/auth/AuthLayout';
import {
  Eye,
  EyeOff,
  Loader2,
  User as UserIcon,
  Car,
  ArrowRight,
  ArrowLeft,
  Bike,
  Shield,
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.registerUser);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = role === 'DRIVER' ? 3 : 2;

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'RIDER',
      vehicleType: 'BIKE',
    },
  });

  const selectedVehicleType = watch('vehicleType');

  const handleRoleChange = (newRole: 'RIDER' | 'DRIVER') => {
    setRole(newRole);
    setValue('role', newRole, { shouldValidate: true });
    if (newRole === 'DRIVER') {
      setValue('vehicleType', 'BIKE', { shouldValidate: true });
    }
    setStep(1);
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegisterInput)[] = [];

    if (step === 1) {
      fieldsToValidate = ['fullName', 'email', 'phone'];
    } else if (step === 2) {
      fieldsToValidate = ['password'];
      if (role === 'RIDER') {
        handleSubmit(onSubmit)();
        return;
      }
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setErrorMessage(null);

    const payload =
      role === 'RIDER'
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
      router.push(role === 'DRIVER' ? '/driver' : '/rider');
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setErrorMessage(apiErrors.map((e: any) => e.message).join(', '));
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Registration failed. Please check your information.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle={
        role === 'DRIVER'
          ? `Step ${step} of 3: ${
              step === 1
                ? 'Personal Info'
                : step === 2
                ? 'Security & Password'
                : 'Vehicle & License Details'
            }`
          : `Step ${step} of 2: ${step === 1 ? 'Personal Info' : 'Security & Password'}`
      }
    >
      {/* Progress Bar */}
      <div className="w-full bg-[#DCDBC7] h-1.5 rounded-md mb-6 overflow-hidden">
        <div
          className="bg-[#C1F11D] h-full transition-all duration-300 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Role Switcher */}
      {step === 1 && (
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
            <UserIcon className="w-4 h-4 text-[#141414]" />
            Passenger
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
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-md bg-rose-100 border-2 border-rose-300 text-rose-800 text-xs font-sans font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                {...register('fullName')}
                placeholder="Zain Butt"
                className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
              />
              {errors.fullName && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder={role === 'DRIVER' ? 'driver@me.com' : 'rider@me.com'}
                className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
              />
              {errors.email && (
                <p className="text-xs font-semibold text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+923000000000"
                className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
              />
              {errors.phone && (
                <p className="text-xs font-semibold text-rose-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Password Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Password
              </label>
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
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Vehicle & License (Driver Only) */}
        {step === 3 && role === 'DRIVER' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Vehicle Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('vehicleType', 'BIKE', { shouldValidate: true })}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 border-2 font-display text-xs font-bold rounded-md transition-all ${
                    selectedVehicleType === 'BIKE'
                      ? 'border-black bg-[#C1F11D] text-[#141414]'
                      : 'border-black/20 bg-white text-[#141414]/60 hover:text-[#141414]'
                  }`}
                >
                  <Bike className="w-4 h-4 mb-1" /> Bike
                </button>

                <button
                  type="button"
                  onClick={() => setValue('vehicleType', 'MINI', { shouldValidate: true })}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 border-2 font-display text-xs font-bold rounded-md transition-all ${
                    selectedVehicleType === 'MINI'
                      ? 'border-black bg-[#C1F11D] text-[#141414]'
                      : 'border-black/20 bg-white text-[#141414]/60 hover:text-[#141414]'
                  }`}
                >
                  <Car className="w-4 h-4 mb-1" /> Mini
                </button>

                <button
                  type="button"
                  onClick={() => setValue('vehicleType', 'COMFORT', { shouldValidate: true })}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 border-2 font-display text-xs font-bold rounded-md transition-all ${
                    selectedVehicleType === 'COMFORT'
                      ? 'border-black bg-[#C1F11D] text-[#141414]'
                      : 'border-black/20 bg-white text-[#141414]/60 hover:text-[#141414]'
                  }`}
                >
                  <Shield className="w-4 h-4 mb-1" /> Comfort
                </button>
              </div>
              {errors.vehicleType && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.vehicleType.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                Vehicle Number
              </label>
              <input
                type="text"
                {...register('vehicleNumber')}
                placeholder="LEB-9447"
                className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
              />
              {errors.vehicleNumber && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.vehicleNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold font-display text-[#141414]/80 block mb-1.5">
                License Number
              </label>
              <input
                type="text"
                {...register('licenseNumber')}
                placeholder="DL-00000000000"
                className="w-full font-display bg-white border-2 border-black/20 rounded-md px-4 py-3 text-sm text-[#141414] placeholder:text-black/40 focus:outline-none focus:border-black/40 transition-all"
              />
              {errors.licenseNumber && (
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  {errors.licenseNumber.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP BUTTONS */}
        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 bg-white hover:bg-black/5 text-[#141414] font-display font-bold rounded-md py-3.5 text-sm transition-all flex items-center justify-center border-2 border-black/20"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 bg-[#141414] hover:bg-[#141414]/90 text-white font-display font-bold rounded-md py-3.5 text-sm transition-all flex items-center justify-center shadow-md active:scale-[0.99] border-2 border-transparent"
            >
              Next <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C1F11D] hover:bg-[#b2e212] text-[#141414] font-display font-bold rounded-md py-3.5 text-sm transition-all flex items-center justify-center shadow-md active:scale-[0.99] border-2 border-[#9DD90D]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#141414]" />
              ) : (
                `Register as ${role === 'DRIVER' ? 'Driver' : 'Passenger'}`
              )}
            </button>
          )}
        </div>
      </form>

      {/* Bottom Link */}
      <div className="text-center mt-6 pt-5 border-t-2 border-[#DCDBC7]">
        <span className="text-xs text-[#141414]/80 font-display font-bold">Already registered? </span>
        <Link
          href="/login"
          className="text-xs font-display text-[#141414] font-bold hover:opacity-80 ml-1"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FFFEE9]">
          <Loader2 className="w-6 h-6 animate-spin text-[#141414]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}