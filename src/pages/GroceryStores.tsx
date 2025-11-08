import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Loader2, Info, Phone, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { MapView } from "@/components/MapView";

interface Store {
  name: string;
  address: string;
  distance: number;
  lat?: number;
  lon?: number;
  acceptsEBT?: boolean;
  phone?: string;
  hours?: string;
  wellStocked?: boolean;
}

const GroceryStores = () => {
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Store[]>([]);
  const [filter, setFilter] = useState<"all" | "ebt" | "non-ebt">("all");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const { toast } = useToast();

  const filteredResults = results.filter((store) => {
    if (filter === "ebt") return store.acceptsEBT;
    if (filter === "non-ebt") return !store.acceptsEBT;
    return true;
  });

  const searchStores = async () => {
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
      const { data, error } = await supabase.functions.invoke("find-grocery-stores", {
        body: { zipCode, radius: 5 },
      });

      if (error) throw error;

      setResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast({
          title: "No results found",
          description: "Try expanding your search area",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search grocery stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { data, error } = await supabase.functions.invoke("find-grocery-stores", {
              body: {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                radius: 5,
              },
            });

            if (error) throw error;
            setResults(data.results || []);
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to find nearby stores",
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Find EBT-Accepting Grocery Stores</h1>
        <p className="text-muted-foreground mb-6">
          Search for nearby stores that accept EBT/SNAP benefits
        </p>
        
        <div className="mb-8 flex gap-4 max-w-2xl">
          <Input
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchStores()}
          />
          <Button onClick={searchStores} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Search
          </Button>
          <Button onClick={handleFindNearby} disabled={loading} variant="outline">
            <MapPin className="mr-2 h-4 w-4" />
            Near Me
          </Button>
        </div>

        {results.length > 0 && (
          <>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Stores ({results.length})</TabsTrigger>
                <TabsTrigger value="ebt">EBT Only ({results.filter(s => s.acceptsEBT).length})</TabsTrigger>
                <TabsTrigger value="non-ebt">Non-EBT ({results.filter(s => !s.acceptsEBT).length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mb-6">
              <MapView 
                locations={results.map(store => ({
                  lat: store.lat || 0,
                  lon: store.lon || 0,
                  name: store.name,
                  address: store.address,
                  distance: store.distance,
                  acceptsEBT: store.acceptsEBT
                }))}
                zoom={11}
              />
            </div>
          </>
        )}

        {filteredResults.length > 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Showing {filteredResults.length} store(s)</p>
            
            {filteredResults.map((store, index) => (
              <Card 
                key={index} 
                className="p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedStore(store)}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold">{store.name}</h3>
                  <div className="flex gap-2 items-center shrink-0">
                    {store.acceptsEBT && (
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                        EBT
                      </span>
                    )}
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground mb-3">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base">{store.address}</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      {store.distance.toFixed(1)} miles away
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                <span>{selectedStore?.name}</span>
                {selectedStore?.acceptsEBT && (
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                    EBT Accepted
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Address</p>
                  <p>{selectedStore?.address}</p>
                </div>
              </div>

              {selectedStore?.phone && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Phone</p>
                    <a href={`tel:${selectedStore.phone}`} className="hover:underline">
                      {selectedStore.phone}
                    </a>
                  </div>
                </div>
              )}

              {selectedStore?.hours && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Hours</p>
                    <p>{selectedStore.hours}</p>
                  </div>
                </div>
              )}
              
              <div>
                <p className="font-medium text-foreground mb-1">Distance</p>
                <p className="text-muted-foreground">{selectedStore?.distance.toFixed(1)} miles away</p>
              </div>

              {selectedStore?.wellStocked !== undefined && (
                <div className={`p-4 rounded-lg border ${selectedStore.wellStocked ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <p className="text-sm font-medium text-foreground">
                      {selectedStore.wellStocked ? 'Well Stocked' : 'Limited Stock'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedStore.wellStocked 
                      ? 'This store typically has good inventory levels'
                      : 'Stock may be limited - consider calling ahead'}
                  </p>
                </div>
              )}

              {selectedStore?.acceptsEBT && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-foreground mb-1">EBT/SNAP Benefits</p>
                  <p className="text-sm text-muted-foreground">This store accepts EBT and SNAP benefits for eligible purchases.</p>
                </div>
              )}

              {selectedStore?.lat && selectedStore?.lon && (
                <Button asChild className="w-full">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.lat},${selectedStore.lon}`}
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

export default GroceryStores;
