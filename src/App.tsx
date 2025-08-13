import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/layout/Navigation";
import Home from "./pages/Home";
import BrowsePrompts from "./pages/BrowsePrompts";
import UploadRefine from "./pages/UploadRefine";
import ABTesting from "./pages/ABTesting";
import GeneratePrompt from "./pages/GeneratePrompt";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Simple auth state management (in production, use Supabase Auth)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = () => {
    // Simple demo login (in production, use Supabase Auth)
    const demoUser = { email: 'user@example.com', id: '1' };
    setUser(demoUser);
    localStorage.setItem('user', JSON.stringify(demoUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation user={user} onLogin={handleLogin} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<BrowsePrompts />} />
              <Route path="/upload" element={<UploadRefine />} />
              <Route path="/testing" element={<ABTesting />} />
              <Route path="/generate" element={<GeneratePrompt />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
