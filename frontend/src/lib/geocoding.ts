export interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
}

export async function fetchAddressSuggestions(query: string): Promise<Suggestion[]> {
    if (!query || query.trim().length < 3) return [];

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pk&limit=7&addressdetails=1`
        );
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Geocoding error:', error);
        return [];
    }
}


// `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`