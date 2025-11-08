import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Package, Receipt } from "lucide-react";
import Header from "@/components/Header";

const Home = () => {
  const [zipCode, setZipCode] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (zipCode.trim()) {
      navigate(`/food-banks?zip=${zipCode}`);
    }
  };

  const handleFindLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        navigate(`/food-banks?lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/90 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl md:text-5xl font-bold text-primary-foreground">
            Find Food Banks & Meal Programs Near You
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/90 max-w-3xl mx-auto">
            Locate nearby food assistance, check available inventory, and get the help you need
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter your ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12 bg-background"
              />
            </div>
            <Button onClick={handleSearch} size="lg" variant="secondary" className="h-12">
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
            <Button onClick={handleFindLocation} size="lg" variant="outline" className="h-12 bg-background hover:bg-accent">
              <MapPin className="mr-2 h-5 w-5" />
              Find My Location
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Finding food assistance is simple and confidential. Here's how to get started.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-lg p-6 shadow-sm text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
                <MapPin className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Search by Location</h3>
              <p className="text-muted-foreground">
                Enter your ZIP code to find nearby food banks and pantries
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
                <Package className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Check Availability</h3>
              <p className="text-muted-foreground">
                View real-time inventory to see what items are currently available
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
                <Receipt className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Scan Receipts</h3>
              <p className="text-muted-foreground">
                Upload receipts to get personalized recipe suggestions
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
