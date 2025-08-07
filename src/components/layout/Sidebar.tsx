import { Plus, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-screen">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/0fc2130e-03a0-44e0-9b18-d3249c9f27ac.png" 
            alt="Propt Logo" 
            className="w-8 h-8"
          />
          <span className="text-xl font-bold text-foreground">propt</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left hover:bg-muted"
          >
            <Plus className="w-4 h-4 mr-3" />
            New Prompt
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left hover:bg-muted"
          >
            <BookOpen className="w-4 h-4 mr-3" />
            Create Library
          </Button>
        </div>

        {/* My Prompt Libraries */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            My Prompt Libraries
          </h3>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left hover:bg-muted"
          >
            <BookOpen className="w-4 h-4 mr-3" />
            SUPER Prompts
          </Button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-left hover:bg-muted mb-4"
        >
          <Share2 className="w-4 h-4 mr-3" />
          Share All Libraries
        </Button>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            U
          </div>
          <div>
            <div className="font-medium">User</div>
            <div className="text-xs">user@email.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;