import { Link } from "react-router-dom";
import { User, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="FoodBridge Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">FoodBridge</h1>
              <p className="text-xs text-muted-foreground">Community Food Resources</p>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/food-banks" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Food Banks
            </Link>
            <Link to="/grocery-stores" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Grocery Stores
            </Link>
            <Link to="/receipt-scanner" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Receipt Scanner
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link to="/auth">
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Link 
                    to="/" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/food-banks" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Food Banks
                  </Link>
                  <Link 
                    to="/grocery-stores" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Grocery Stores
                  </Link>
                  <Link 
                    to="/receipt-scanner" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Receipt Scanner
                  </Link>
                  <Link 
                    to="/about" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    About
                  </Link>
                  <Link 
                    to="/contact" 
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    Contact
                  </Link>
                  <div className="pt-4 border-t space-y-2">
                    {user ? (
                      <>
                        <Button asChild variant="ghost" className="w-full">
                          <Link to="/profile" onClick={() => setIsOpen(false)}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </Button>
                        <Button onClick={() => { handleSignOut(); setIsOpen(false); }} variant="outline" className="w-full">
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
