import { useMemo, useState } from "react";
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";

interface Location {
  lat: number;
  lon: number;
  name: string;
  address: string;
  distance?: number;
  acceptsEBT?: boolean;
}

interface MapViewProps {
  locations: Location[];
  center?: { lat: number; lon: number };
  zoom?: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "0.5rem",
};

export const MapView = ({ locations, center, zoom = 12 }: MapViewProps) => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const mapCenter = useMemo(() => {
    if (center) return { lat: center.lat, lng: center.lon };
    if (locations.length > 0) {
      const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const avgLon = locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length;
      return { lat: avgLat, lng: avgLon };
    }
    return { lat: 39.8283, lng: -98.5795 }; // Center of US
  }, [center, locations]);

  const mapOptions = useMemo(() => ({
    disableDefaultUI: false,
    clickableIcons: false,
    scrollwheel: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  }), []);

  if (loadError) {
    return (
      <div className="w-full h-[500px] rounded-lg shadow-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Error loading maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] rounded-lg shadow-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <div className="w-full h-[500px] rounded-lg shadow-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom}
      options={mapOptions}
    >
      {locations.map((location, index) => (
        <MarkerF
          key={index}
          position={{ lat: location.lat, lng: location.lon }}
          onClick={() => setSelectedMarker(index)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: location.acceptsEBT ? "#4CAF50" : "#FF6B35",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
            scale: 10,
          }}
        >
          {selectedMarker === index && (
            <InfoWindowF onCloseClick={() => setSelectedMarker(null)}>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{location.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{location.address}</p>
                {location.distance && (
                  <p className="text-xs text-primary font-medium">
                    {location.distance.toFixed(1)} miles away
                  </p>
                )}
                {location.acceptsEBT && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                    EBT Accepted
                  </span>
                )}
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
};
