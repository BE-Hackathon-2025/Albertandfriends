import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Chatbot } from "@/components/Chatbot";
import Home from "./pages/Home";
import FoodBanks from "./pages/FoodBanks";
import GroceryStores from "./pages/GroceryStores";
import ReceiptScanner from "./pages/ReceiptScanner";
import Gallery from "./pages/Gallery";
import Auth from "./pages/Auth";
import VerifySuccess from "./pages/VerifySuccess";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ChatbotWrapper = () => {
  const location = useLocation();
  const isReceiptScanner = location.pathname === "/receipt-scanner";
  
  if (isReceiptScanner) return null;
  return <Chatbot />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ChatbotWrapper />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/food-banks" element={<FoodBanks />} />
          <Route path="/grocery-stores" element={<GroceryStores />} />
          <Route path="/receipt-scanner" element={<ReceiptScanner />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-success" element={<VerifySuccess />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
