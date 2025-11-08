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

// Helper to calculate distance between two points
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
    
    console.log('Finding food banks for:', { zipCode, lat, lon, radius });

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

    // Search for food assistance locations
    const radiusMeters = radius * 1609.34;
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="food_bank"](around:${radiusMeters},${searchLat},${searchLon});
        way["amenity"="food_bank"](around:${radiusMeters},${searchLat},${searchLon});
        node["amenity"="social_facility"]["social_facility"="food_bank"](around:${radiusMeters},${searchLat},${searchLon});
        way["amenity"="social_facility"]["social_facility"="food_bank"](around:${radiusMeters},${searchLat},${searchLon});
        node["amenity"="community_centre"]["community_centre:for"~"food"](around:${radiusMeters},${searchLat},${searchLon});
        way["amenity"="community_centre"]["community_centre:for"~"food"](around:${radiusMeters},${searchLat},${searchLon});
        node["amenity"="place_of_worship"]["religion"="christian"]["denomination"~"."](around:${radiusMeters},${searchLat},${searchLon});
        way["amenity"="place_of_worship"]["religion"="christian"]["denomination"~"."](around:${radiusMeters},${searchLat},${searchLon});
        node["shop"="charity"](around:${radiusMeters},${searchLat},${searchLon});
        way["shop"="charity"](around:${radiusMeters},${searchLat},${searchLon});
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
        const bankLat = element.lat || element.center?.lat;
        const bankLon = element.lon || element.center?.lon;
        
        if (!bankLat || !bankLon) return null;

        const distance = calculateDistance(searchLat, searchLon, bankLat, bankLon);

        const tags = element.tags || {};
        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:state'],
          tags['addr:postcode']
        ].filter(Boolean);

        // Determine name based on type
        let name = tags.name || tags.operator;
        if (!name) {
          if (tags.amenity === 'place_of_worship') {
            name = `${tags.denomination || 'Community'} Church`;
          } else if (tags.shop === 'charity') {
            name = 'Charity Organization';
          } else {
            name = 'Food Assistance Location';
          }
        }
        
        // Estimate stock status based on organization size indicators
        const wellStocked = tags.name?.toLowerCase().includes('regional') ||
                           tags.name?.toLowerCase().includes('central') ||
                           tags.amenity === 'social_facility';

        return {
          name,
          address: addressParts.length > 0 
            ? addressParts.join(', ')
            : 'Address not available',
          distance: distance,
          phone: tags.phone || tags['contact:phone'],
          hours: tags.opening_hours,
          lat: bankLat,
          lon: bankLon,
          wellStocked: wellStocked || undefined
        };
      })
      .filter((bank: any) => bank !== null)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 20);

    console.log(`Found ${results.length} food assistance locations`);

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
