import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Phone, Clock, Loader2, Navigation, Info, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { MapView } from "@/components/MapView";

interface FoodBank {
  name: string;
  address: string;
  distance: number;
  phone?: string;
  hours?: string;
  lat?: number;
  lon?: number;
  wellStocked?: boolean;
}

const FoodBanks = () => {
  const [searchParams] = useSearchParams();
  const [zipCode, setZipCode] = useState(searchParams.get("zip") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoodBank[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedBank, setSelectedBank] = useState<FoodBank | null>(null);
  const { toast } = useToast();

  const searchFoodBanks = async () => {
    if (!zipCode.trim()) {
      toast({
        title: "ZIP code required",
        description: "Please enter a ZIP code to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-food-banks", {
        body: { zipCode, radius: 10 },
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast({
          title: "No results found",
          description: "Try expanding your search radius or check the ZIP code",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search food banks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNearMe = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({ lat, lon });

          try {
            const { data, error } = await supabase.functions.invoke("find-food-banks", {
              body: { lat, lon, radius: 10 },
            });

            if (error) throw error;
            setResults(data.results || []);
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to find nearby food banks",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
          toast({
            title: "Location access denied",
            description: "Please enable location access or enter a ZIP code",
            variant: "destructive",
          });
        }
      );
    }
  };

  useEffect(() => {
    if (searchParams.get("zip")) {
      searchFoodBanks();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Find Food Banks & SNAP Retailers</h1>
        
        <div className="mb-8 flex gap-4 max-w-2xl">
          <Input
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchFoodBanks()}
          />
          <Button onClick={searchFoodBanks} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
          <Button onClick={handleNearMe} disabled={loading} variant="outline">
            <Navigation className="mr-2 h-4 w-4" />
            Near Me
          </Button>
        </div>

        {results.length > 0 && (
          <>
            <div className="mb-6">
              <MapView 
                locations={results.map(bank => ({
                  lat: bank.lat || 0,
                  lon: bank.lon || 0,
                  name: bank.name,
                  address: bank.address,
                  distance: bank.distance
                }))}
                zoom={11}
              />
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Found {results.length} location(s) {zipCode && `near ${zipCode}`}
              </p>
              
              {results.map((bank, index) => (
                <Card 
                  key={index} 
                  className="p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedBank(bank)}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold">{bank.name}</h3>
                    <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                  
                  <div className="space-y-2 text-muted-foreground text-sm sm:text-base">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p>{bank.address}</p>
                    </div>
                    
                    <p className="text-sm font-medium text-primary">
                      {bank.distance.toFixed(1)} miles away
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <Dialog open={!!selectedBank} onOpenChange={() => setSelectedBank(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedBank?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Address</p>
                  <p>{selectedBank?.address}</p>
                </div>
              </div>

              {selectedBank?.phone && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Phone</p>
                    <a href={`tel:${selectedBank.phone}`} className="hover:underline">
                      {selectedBank.phone}
                    </a>
                  </div>
                </div>
              )}

              {selectedBank?.hours && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Hours</p>
                    <p>{selectedBank.hours}</p>
                  </div>
                </div>
              )}
              
              <div>
                <p className="font-medium text-foreground mb-1">Distance</p>
                <p className="text-muted-foreground">{selectedBank?.distance.toFixed(1)} miles away</p>
              </div>

              {selectedBank?.wellStocked !== undefined && (
                <div className={`p-4 rounded-lg border ${selectedBank.wellStocked ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <p className="text-sm font-medium text-foreground">
                      {selectedBank.wellStocked ? 'Well Stocked' : 'Limited Supplies'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedBank.wellStocked 
                      ? 'This food bank typically has good supply levels'
                      : 'Supplies may be limited - consider calling ahead'}
                  </p>
                </div>
              )}

              {selectedBank?.lat && selectedBank?.lon && (
                <Button asChild className="w-full">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBank.lat},${selectedBank.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FoodBanks;
