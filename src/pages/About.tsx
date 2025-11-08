import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Heart, Users, Target } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About FoodBridge</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            FoodBridge is dedicated to connecting communities with essential food resources.
            We believe that everyone deserves access to nutritious food and helpful resources 
            to make the most of what they have.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
                <Heart className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
              <p className="text-sm text-muted-foreground">
                Eliminate food insecurity by connecting people with local food assistance programs
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community First</h3>
              <p className="text-sm text-muted-foreground">
                Building stronger communities through accessible food resources and support
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Our Goal</h3>
              <p className="text-sm text-muted-foreground">
                Make food assistance simple, dignified, and accessible to all who need it
              </p>
            </Card>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">What We Offer</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Food Bank Locator:</strong> Find nearby food banks, 
                pantries, and SNAP retailers in your area using your ZIP code or current location.
              </p>
              <p>
                <strong className="text-foreground">Grocery Store Finder:</strong> Locate grocery stores 
                that accept various food assistance programs.
              </p>
              <p>
                <strong className="text-foreground">Receipt Scanner:</strong> Upload your grocery receipts 
                to get personalized recipe suggestions based on what you already have, complete with 
                nutritional information.
              </p>
              <p>
                <strong className="text-foreground">Privacy & Confidentiality:</strong> Your information 
                is always kept private and secure. We never share your personal data.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
