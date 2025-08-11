import { Plus, BookOpen, Share2, ChevronDown, Folder, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const Sidebar = () => {
  const promptFolders = [
    { name: "Cluely", file: "Prompt.txt", time: "2 months ago", type: "folder" },
    { name: "Cursor Prompts", file: "Agent Prompt v1.2.txt", time: "3 weeks ago", type: "folder" },
    { name: "Devin AI", file: "Prompt.txt", time: "3 months ago", type: "folder" },
    { name: "dia", file: "Prompt.txt", time: "3 months ago", type: "folder" },
    { name: "Junie", file: "Prompt.txt", time: "3 months ago", type: "folder" },
    { name: "Kiro", file: "Prompt.txt", time: "3 weeks ago", type: "folder" },
    { name: "Lovable", file: "Agent Tools.json", time: "2 weeks ago", type: "folder" },
    { name: "Manus Agent Tools & Prompt", file: "Prompt.txt", time: "5 months ago", type: "folder" },
    { name: "Open Source prompts", file: "Prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "Orchids.app", file: "Decision-making prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "Perplexity", file: "Prompt.txt", time: "2 months ago", type: "folder" },
    { name: "Replit", file: "Prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "Same.dev", file: "Prompt.txt", time: "last month", type: "folder" },
    { name: "Spawn", file: "Prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "Trae", file: "Prompt.txt", time: "3 months ago", type: "folder" },
    { name: "v0 Prompts and Tools", file: "Prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "VSCode Agent", file: "Prompt.txt", time: "4 months ago", type: "folder" },
    { name: "Warp.dev", file: "Prompt.txt", time: "last month", type: "folder" },
    { name: "Windsurf", file: "Prompt.txt", time: "2 weeks ago", type: "folder" },
    { name: "Xcode", file: "prompts", time: "last month", type: "folder" },
    { name: "Z.ai Code", file: "prompt.txt", time: "last week", type: "folder" }
  ];

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Repository</h3>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">New Prompt</span>
          </div>
        </div>
      </div>

      {/* Created Prompts List */}
      <div className="flex-1">
        <ScrollArea className="h-full px-4 py-2">
          <div className="space-y-1">
            {promptFolders.map((item, index) => (
              <div
                key={item.name}
                className={`group flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer ${
                  index === 0 ? 'bg-muted' : ''
                }`}
              >
                <Folder className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {item.time}
                    </span>
                  </div>
                  {item.file && (
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {item.file}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
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