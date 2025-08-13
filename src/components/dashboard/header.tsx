import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, User } from "lucide-react";
import { HealthStatusBadge } from "@/components/ui/health-status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  userStatus: "excellent" | "good" | "normal" | "attention" | "concern";
  statusMessage: string;
  onOpenChat: () => void;
  onOpenContextLog: () => void;
}

export function DashboardHeader({
  userStatus,
  statusMessage,
  onOpenChat,
  onOpenContextLog,
}: DashboardHeaderProps) {
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Aura</h1>
              <p className="text-sm text-muted-foreground">Wellness Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onOpenContextLog}
              size="sm"
              variant="outline"
              className="hidden sm:flex bg-background/50 border-border/50 hover:bg-muted/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Context
            </Button>
            
            <Button
              onClick={onOpenChat}
              size="sm"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Aura Assistant
            </Button>

            <Button
              onClick={handleSignOut}
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <HealthStatusBadge status={userStatus} />
            <span className="text-foreground font-medium">{statusMessage}</span>
          </div>
        </div>
      </div>
    </header>
  );
}