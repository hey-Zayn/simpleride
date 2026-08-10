'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ArrowRight, Loader2, MousePointer } from 'lucide-react';
import { fetchAddressSuggestions, Suggestion } from '@/lib/geocoding';
import { useRideStore } from '@/store/useRideStore';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationValue {
  lat: number | null;
  lng: number | null;
  address: string;
}

interface LocationState {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationPickerProps {
  pickupValue?: LocationValue | null;
  dropoffValue?: LocationValue | null;
  onPickupChange?: (coords: Coordinates | null, address: string) => void;
  onDropoffChange?: (coords: Coordinates | null, address: string) => void;
  onEnableMapPicker?: (mode: 'pickup' | 'dropoff') => void;
  activeMapPickerMode?: 'pickup' | 'dropoff' | null;
}

const ICON_STROKE = 1.75;

export default function LocationPicker({
  pickupValue,
  dropoffValue,
  onPickupChange,
  onDropoffChange,
  onEnableMapPicker,
  activeMapPickerMode,
}: LocationPickerProps) {
  const getEstimate = useRideStore((state) => state.getEstimate);
  const setStorePickup = useRideStore((state) => state.setPickup);
  const setStoreDropoff = useRideStore((state) => state.setDropoff);
  const isLoadingStore = useRideStore((state) => state.isLoading);
  const { pickup, dropoff, pickupAddress, dropoffAddress } = useRideStore();

  const [localPickup, setLocalPickup] = useState<LocationState>({
    address: pickupAddress || pickupValue?.address || '',
    lat: pickup?.lat || pickupValue?.lat || null,
    lng: pickup?.lng || pickupValue?.lng || null,
  });

  const [localDropoff, setLocalDropoff] = useState<LocationState>({
    address: dropoffAddress || dropoffValue?.address || '',
    lat: dropoff?.lat || dropoffValue?.lat || null,
    lng: dropoff?.lng || dropoffValue?.lng || null,
  });

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [activeSearch, setActiveSearch] = useState<'pickup' | 'dropoff' | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (
      pickupValue &&
      (pickupValue.lat !== localPickup.lat ||
        pickupValue.lng !== localPickup.lng ||
        pickupValue.address !== localPickup.address)
    ) {
      setLocalPickup({
        address: pickupValue.address || '',
        lat: pickupValue.lat,
        lng: pickupValue.lng,
      });
    }
  }, [pickupValue?.lat, pickupValue?.lng, pickupValue?.address]);

  useEffect(() => {
    if (
      dropoffValue &&
      (dropoffValue.lat !== localDropoff.lat ||
        dropoffValue.lng !== localDropoff.lng ||
        dropoffValue.address !== localDropoff.address)
    ) {
      setLocalDropoff({
        address: dropoffValue.address || '',
        lat: dropoffValue.lat,
        lng: dropoffValue.lng,
      });
    }
  }, [dropoffValue?.lat, dropoffValue?.lng, dropoffValue?.address]);

  // Debounced search handlers
  useEffect(() => {
    if (activeSearch !== 'pickup' || !localPickup.address) return;
    const timer = setTimeout(async () => {
      const results = await fetchAddressSuggestions(localPickup.address);
      setPickupSuggestions(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [localPickup.address, activeSearch]);

  useEffect(() => {
    if (activeSearch !== 'dropoff' || !localDropoff.address) return;
    const timer = setTimeout(async () => {
      const results = await fetchAddressSuggestions(localDropoff.address);
      setDropoffSuggestions(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [localDropoff.address, activeSearch]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data.display_name || 'Current Location';

          setLocalPickup({ address: addr, lat: latitude, lng: longitude });
          setStorePickup({ lat: latitude, lng: longitude }, addr);
          onPickupChange?.({ lat: latitude, lng: longitude }, addr);
        } catch {
          setLocalPickup({ address: 'Current Location', lat: latitude, lng: longitude });
          setStorePickup({ lat: latitude, lng: longitude }, 'Current Location');
          onPickupChange?.({ lat: latitude, lng: longitude }, 'Current Location');
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSelectPickup = (item: Suggestion) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name;

    setLocalPickup({ address, lat, lng });
    setStorePickup({ lat, lng }, address);
    onPickupChange?.({ lat, lng }, address);
    setPickupSuggestions([]);
    setActiveSearch(null);
  };

  const handleSelectDropoff = (item: Suggestion) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name;

    setLocalDropoff({ address, lat, lng });
    setStoreDropoff({ lat, lng }, address);
    onDropoffChange?.({ lat, lng }, address);
    setDropoffSuggestions([]);
    setActiveSearch(null);
  };

  const handleCalculateFare = async () => {
    const targetPickupLat = localPickup.lat || pickup?.lat;
    const targetPickupLng = localPickup.lng || pickup?.lng;
    const targetDropoffLat = localDropoff.lat || dropoff?.lat;
    const targetDropoffLng = localDropoff.lng || dropoff?.lng;

    if (!targetPickupLat || !targetPickupLng || !targetDropoffLat || !targetDropoffLng) {
      toast.error('Please select valid pickup and drop-off locations.');
      return;
    }

    setStorePickup({ lat: targetPickupLat, lng: targetPickupLng }, localPickup.address);
    setStoreDropoff({ lat: targetDropoffLat, lng: targetDropoffLng }, localDropoff.address);

    try {
      await getEstimate({
        pickup: { lat: targetPickupLat, lng: targetPickupLng },
        dropoff: { lat: targetDropoffLat, lng: targetDropoffLng },
      });
    } catch {
      toast.error('Failed to calculate fare. Please check your locations.');
    }
  };

  const isLocationValid = Boolean(
    (localPickup.lat || pickup?.lat) && (localDropoff.lat || dropoff?.lat)
  );

  return (
    <div className="p-4 space-y-4">
      {/* Pickup Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-display text-[#141414]/80 uppercase tracking-wide">
            Pickup location
          </label>
          {onEnableMapPicker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEnableMapPicker('pickup')}
              className={`h-6 text-[11px] font-bold font-display px-2 rounded-sm transition-all flex items-center gap-1 ${
                activeMapPickerMode === 'pickup'
                  ? 'bg-[#C1F11D] border-[#141414] text-[#141414] hover:bg-[#C1F11D]'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-[#141414]'
              }`}
            >
              <MousePointer className="w-3 h-3" strokeWidth={ICON_STROKE} />
              Pick on map
            </Button>
          )}
        </div>

        <Popover
          open={activeSearch === 'pickup' && pickupSuggestions.length > 0}
          onOpenChange={(open) => !open && setActiveSearch(null)}
        >
          <PopoverTrigger asChild>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3.5 z-10 pointer-events-none">
                <MapPin className="w-4 h-4 text-emerald-600" strokeWidth={ICON_STROKE} />
              </span>
              <Input
                type="text"
                value={localPickup.address}
                onChange={(e) => {
                  setLocalPickup({ ...localPickup, address: e.target.value, lat: null, lng: null });
                  setActiveSearch('pickup');
                }}
                onFocus={() => setActiveSearch('pickup')}
                placeholder="Enter pickup address..."
                className="w-full bg-[#FFFEE9] border border-[#141414]/20 rounded-sm pl-10 pr-10 py-3 h-auto text-sm font-display text-[#141414] placeholder:text-[#141414]/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                title="Use current location"
                className="absolute right-1 w-8 h-8 rounded-sm hover:bg-transparent text-[#141414]"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#141414]" strokeWidth={ICON_STROKE} />
                ) : (
                  <Navigation className="w-4 h-4 text-[#141414]" strokeWidth={ICON_STROKE} />
                )}
              </Button>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="p-0 border border-[#141414]/20 shadow-lg rounded-sm bg-white w-[var(--radix-popover-trigger-width)] max-w-full"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList className="max-h-48 overflow-y-auto">
                <CommandEmpty className="p-3 text-xs text-muted-foreground">
                  No results found.
                </CommandEmpty>
                <CommandGroup>
                  {pickupSuggestions.map((item, idx) => (
                    <CommandItem
                      key={idx}
                      onSelect={() => handleSelectPickup(item)}
                      className="px-3 py-2 text-xs font-sans text-[#141414] hover:bg-[#C1F11D] cursor-pointer transition-colors rounded-sm"
                    >
                      <p className="truncate w-full">{item.display_name}</p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Dropoff Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-display text-[#141414]/80 uppercase tracking-wide">
            Drop-off destination
          </label>
          {onEnableMapPicker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEnableMapPicker('dropoff')}
              className={`h-6 text-[11px] font-bold font-display px-2 rounded-sm transition-all flex items-center gap-1 ${
                activeMapPickerMode === 'dropoff'
                  ? 'bg-[#C1F11D] border-[#141414] text-[#141414] hover:bg-[#C1F11D]'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-[#141414]'
              }`}
            >
              <MousePointer className="w-3 h-3" strokeWidth={ICON_STROKE} />
              Pick on map
            </Button>
          )}
        </div>

        <Popover
          open={activeSearch === 'dropoff' && dropoffSuggestions.length > 0}
          onOpenChange={(open) => !open && setActiveSearch(null)}
        >
          <PopoverTrigger asChild>
            <div className="relative flex items-center w-full">
              <span className="absolute left-3.5 z-10 pointer-events-none">
                <MapPin className="w-4 h-4 text-rose-600" strokeWidth={ICON_STROKE} />
              </span>
              <Input
                type="text"
                value={localDropoff.address}
                onChange={(e) => {
                  setLocalDropoff({ ...localDropoff, address: e.target.value, lat: null, lng: null });
                  setActiveSearch('dropoff');
                }}
                onFocus={() => setActiveSearch('dropoff')}
                placeholder="Where to?"
                className="w-full bg-[#FFFEE9] border border-[#141414]/20 rounded-sm pl-10 pr-4 py-3 h-auto text-sm font-display text-[#141414] placeholder:text-[#141414]/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              />
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="p-0 border border-[#141414]/20 shadow-lg rounded-sm bg-white w-[var(--radix-popover-trigger-width)] max-w-full"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList className="max-h-48 overflow-y-auto">
                <CommandEmpty className="p-3 text-xs text-muted-foreground">
                  No results found.
                </CommandEmpty>
                <CommandGroup>
                  {dropoffSuggestions.map((item, idx) => (
                    <CommandItem
                      key={idx}
                      onSelect={() => handleSelectDropoff(item)}
                      className="px-3 py-2 text-xs font-sans text-[#141414] hover:bg-[#C1F11D] cursor-pointer transition-colors rounded-sm"
                    >
                      <p className="truncate w-full">{item.display_name}</p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="button"
        disabled={!isLocationValid || isLoadingStore}
        onClick={handleCalculateFare}
        className="w-full mt-1 bg-[#C1F11D] hover:bg-[#b2e212] disabled:opacity-50 text-[#141414] font-display font-bold rounded-sm py-5 text-sm transition-all flex items-center justify-center gap-2 border border-[#141414]/20 active:translate-x-[1px] active:translate-y-[1px]"
      >
        {isLoadingStore ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#141414]" strokeWidth={ICON_STROKE} />
        ) : (
          <>
            Calculate fare
            <ArrowRight className="w-4 h-4" strokeWidth={ICON_STROKE} />
          </>
        )}
      </Button>
    </div>
  );
}