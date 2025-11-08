import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import { InlineChat } from "@/components/InlineChat";

interface Recipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: string;
}

const ReceiptScanner = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke("scan-receipt", {
          body: { image: base64Image },
        });

        if (error) throw error;

        setItems(data.items || []);
        setRecipes(data.recipes || []);
        
        // Save receipt to database if user is authenticated
        if (user && data.items && data.recipes) {
          try {
            // Upload image to storage
            const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('images')
              .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('images')
              .getPublicUrl(fileName);

            // Save receipt data to database
            const { error: insertError } = await (supabase as any)
              .from('receipts')
              .insert({
                user_id: user.id,
                image_url: publicUrl,
                receipt_data: {
                  items: data.items,
                  recipes: data.recipes
                }
              });

            if (insertError) throw insertError;
          } catch (saveError: any) {
            console.error('Error saving receipt:', saveError);
            // Don't show error to user, just log it
          }
        }
        
        toast({
          title: "Success!",
          description: `Found ${data.items?.length || 0} items and generated ${data.recipes?.length || 0} recipes${user ? '. Receipt saved to your profile!' : ''}`,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scan receipt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Receipt Scanner</h1>
        
        {items.length > 0 && (
          <Card className="p-4 mb-6 bg-primary/10 border-primary/20">
            <p className="text-sm text-foreground">
              ✨ Great! We've found your items and generated recipe suggestions below.
            </p>
          </Card>
        )}
        
        <Card className="p-8 mb-8">
          {!previewUrl ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Upload className="h-8 w-8 text-accent-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload Your Receipt</h2>
              <p className="text-muted-foreground mb-6">
                Take a photo of your grocery receipt and we'll extract the items and suggest recipes
              </p>
              
              <label htmlFor="receipt-upload">
                <Button asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </span>
                </Button>
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleClearImage}
                  variant="outline"
                  disabled={loading}
                >
                  Choose Different Image
                </Button>
                <Button
                  onClick={handleProcessReceipt}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ChefHat className="mr-2 h-4 w-4" />
                      Process Receipt
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {items.length > 0 && (
          <>
            <Card className="p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>

            <div className="mb-8">
              <InlineChat ingredients={items} />
            </div>
          </>
        )}

        {recipes.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              Suggested Recipes
            </h3>
            
            {recipes.map((recipe, index) => (
              <Card key={index} className="p-6">
                <h4 className="text-xl font-semibold mb-2">{recipe.name}</h4>
                <p className="text-muted-foreground mb-4">{recipe.description}</p>
                
                <div className="mb-4">
                  <h5 className="font-semibold mb-2">Ingredients:</h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h5 className="font-semibold mb-2">Instructions:</h5>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    {recipe.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                {recipe.nutrition && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <h5 className="font-semibold mb-2">Nutritional Information:</h5>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {recipe.nutrition}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReceiptScanner;
