import { create } from 'zustand';
import api from '@/lib/axios';
import { canDriverTransition, DriverActionStatus, DriverRide, IncomingRideRequest, normalizeDriverRide, RideStatus } from '@/types/driver-ride';

type ApiEnvelope = { data?: unknown };

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response as { data?: { message?: unknown } };
    if (typeof response.data?.message === 'string') return response.data.message;
  }
  return fallback;
};

interface DriverTripState {
  activeRide: DriverRide | null;
  incomingRide: IncomingRideRequest | null;
  isSubmitting: boolean;
  error: string | null;
  setIncomingRide: (ride: IncomingRideRequest | null) => void;
  reconcileRide: (payload: unknown) => void;
  reconcileStatus: (rideId: string, status: RideStatus) => void;
  acceptRide: (request: IncomingRideRequest) => Promise<DriverRide>;
  counterOffer: (request: IncomingRideRequest, counterFare: number) => Promise<void>;
  updateStatus: (status: DriverActionStatus, otp?: string) => Promise<DriverRide>;
  clearTerminalRide: () => void;
}

export const useDriverTripStore = create<DriverTripState>((set, get) => ({
  activeRide: null, incomingRide: null, isSubmitting: false, error: null,
  setIncomingRide: (incomingRide) => set({ incomingRide }),
  reconcileRide: (payload) => { const activeRide = normalizeDriverRide(payload, 'ACCEPTED'); if (activeRide) set({ activeRide, incomingRide: null, error: null }); },
  reconcileStatus: (rideId, status) => set((state) => state.activeRide?.id === rideId ? { activeRide: { ...state.activeRide, status } } : state),
  acceptRide: async (request) => {
    set({ isSubmitting: true, error: null });
    try {
      const response = await api.patch<ApiEnvelope>(`/ride/api/rides/${request.rideId}/accept`);
      const activeRide = normalizeDriverRide(response.data.data ?? response.data, 'ACCEPTED');
      if (!activeRide) throw new Error('The accept response did not match the ride contract.');
      set({ activeRide, incomingRide: null }); return activeRide;
    } catch (error: unknown) { const message = getErrorMessage(error, 'Could not accept ride.'); set({ error: message }); throw new Error(message); }
    finally { set({ isSubmitting: false }); }
  },
  counterOffer: async (request, counterFare) => {
    set({ isSubmitting: true, error: null });
    try { await api.post(`/ride/api/rides/${request.rideId}/counter`, { counterFare }); set({ incomingRide: null }); }
    catch (error: unknown) { const message = getErrorMessage(error, 'Could not send counter offer.'); set({ error: message }); throw new Error(message); }
    finally { set({ isSubmitting: false }); }
  },
  updateStatus: async (status, otp) => {
    const activeRide = get().activeRide;
    if (!activeRide || !canDriverTransition(activeRide.status, status)) throw new Error('That trip action is not available in the current state.');
    if (status === 'IN_PROGRESS' && !/^\d{4}$/.test(otp ?? '')) throw new Error('Enter the 4-digit rider OTP to start the trip.');
    set({ isSubmitting: true, error: null });
    try {
      const response = await api.patch<ApiEnvelope>(`/ride/api/rides/${activeRide.id}/status`, { status, ...(otp ? { otp } : {}) });
      const updatedRide = normalizeDriverRide(response.data.data ?? response.data, status);
      if (!updatedRide) throw new Error('The status response did not match the ride contract.');
      set({ activeRide: updatedRide }); return updatedRide;
    } catch (error: unknown) { const message = getErrorMessage(error, 'Failed to update trip status.'); set({ error: message }); throw new Error(message); }
    finally { set({ isSubmitting: false }); }
  },
  clearTerminalRide: () => set((state) => state.activeRide && ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(state.activeRide.status) ? { activeRide: null, error: null } : state),
}));