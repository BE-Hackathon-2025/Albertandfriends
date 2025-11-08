import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to geocode ZIP to coordinates
async function geocodeZip(zipCode: string) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=USA&format=json`,
      {
        headers: {
          'User-Agent': 'FoodBridge/1.0'
        }
      }
    );
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

// Helper to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode, lat, lon, radius = 10 } = await req.json();
    
    console.log('Finding grocery stores for:', { zipCode, lat, lon, radius });

    let searchLat = lat;
    let searchLon = lon;

    if (zipCode && (!searchLat || !searchLon)) {
      const coords = await geocodeZip(zipCode);
      if (coords) {
        searchLat = coords.lat;
        searchLon = coords.lon;
      } else {
        throw new Error('Could not find coordinates for ZIP code');
      }
    }

    if (!searchLat || !searchLon) {
      throw new Error('Location coordinates are required');
    }

    console.log('Searching near:', searchLat, searchLon);

    // Use Overpass API to find grocery stores from OpenStreetMap
    const radiusMeters = radius * 1609.34; // Convert miles to meters
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["shop"="supermarket"](around:${radiusMeters},${searchLat},${searchLon});
        node["shop"="grocery"](around:${radiusMeters},${searchLat},${searchLon});
        node["shop"="convenience"](around:${radiusMeters},${searchLat},${searchLon});
        way["shop"="supermarket"](around:${radiusMeters},${searchLat},${searchLon});
        way["shop"="grocery"](around:${radiusMeters},${searchLat},${searchLon});
        way["shop"="convenience"](around:${radiusMeters},${searchLat},${searchLon});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    if (!response.ok) {
      console.error(`Overpass API error: ${response.status}`);
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    
    const results = data.elements
      .map((element: any) => {
        // Get coordinates (different for nodes vs ways)
        const storeLat = element.lat || element.center?.lat;
        const storeLon = element.lon || element.center?.lon;
        
        if (!storeLat || !storeLon) return null;

        const distance = calculateDistance(searchLat, searchLon, storeLat, storeLon);

        // Build address from tags
        const tags = element.tags || {};
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:state'],
          tags['addr:postcode']
        ].filter(Boolean);

        // Determine if it accepts EBT (we can't know for sure from OSM data, so we'll mark all as potential)
        // In reality, most major supermarkets and grocery stores do accept EBT
        const isLikelyEBT = tags.shop === 'supermarket' || tags.shop === 'grocery';
        
        // Extract phone and hours if available
        const phone = tags['contact:phone'] || tags['phone'];
        const hours = tags['opening_hours'];
        
        // Estimate stock status based on store type (larger stores typically better stocked)
        const wellStocked = tags.shop === 'supermarket' || 
                           (tags.brand && ['walmart', 'target', 'kroger', 'safeway', 'whole foods'].some(
                             brand => tags.brand?.toLowerCase().includes(brand)
                           ));

        return {
          name: tags.name || tags.brand || 'Grocery Store',
          address: addressParts.length > 0 
            ? addressParts.join(', ')
            : 'Address not available',
          distance: distance,
          lat: storeLat,
          lon: storeLon,
          acceptsEBT: isLikelyEBT,
          phone: phone || undefined,
          hours: hours || undefined,
          wellStocked: wellStocked || undefined
        };
      })
      .filter((store: any) => store !== null)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 50); // Limit to 50 results

    console.log(`Found ${results.length} grocery stores`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        results: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
