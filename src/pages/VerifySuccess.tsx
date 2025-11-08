import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VerifySuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is verified and logged in
        console.log("User verified successfully");
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Email Verified Successfully!
          </h1>
          <p className="text-muted-foreground">
            Your email has been verified. You can now close this tab and return to the app.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={() => navigate("/")} 
            className="w-full"
          >
            Go to Home Page
          </Button>
          
          <Button 
            onClick={() => window.close()} 
            variant="outline"
            className="w-full"
          >
            Close This Tab
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VerifySuccess;
