import { Plus, BookOpen, Share2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Sidebar = () => {
  const aiServices = [
    "Manus Agent Tools & Prompt",
    "Devin AI", 
    "Z.ai Code",
    "Trae",
    "Perplexity",
    "Cluely",
    "Kiro",
    "Replit",
    "Cursor",
    "GitHub Copilot"
  ];

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-screen">
      {/* Select Tool Section */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Select Tool</h3>
          <Select defaultValue={aiServices[0]}>
            <SelectTrigger className="w-full bg-input border-2 border-primary text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {aiServices.map((service) => (
                <SelectItem key={service} value={service} className="text-foreground hover:bg-muted">
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Services List */}
      <div className="flex-1 p-4">
        <div className="space-y-1">
          {aiServices.map((service, index) => (
            <Button
              key={service}
              variant="ghost"
              className={`w-full justify-start text-left text-foreground hover:bg-muted ${
                index === 0 ? 'bg-muted' : ''
              }`}
            >
              {service}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-left hover:bg-muted mb-4 text-foreground"
        >
          <Share2 className="w-4 h-4 mr-3" />
          Share All Libraries
        </Button>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            U
          </div>
          <div>
            <div className="font-medium text-foreground">User</div>
            <div className="text-xs">user@email.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;