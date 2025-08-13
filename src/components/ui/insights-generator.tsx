import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InsightsGeneratorProps {
  onInsightsGenerated: () => void;
}

export function InsightsGenerator({ onInsightsGenerated }: InsightsGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Insights Generated",
        description: data.message || "New insights have been generated based on your health data",
      });

      onInsightsGenerated();
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate insights. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate personalized insights by analyzing your health patterns, context logs, and correlations over the past 14 days.
        </p>
        
        <Button
          onClick={generateInsights}
          disabled={isGenerating}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Your Data...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate New Insights
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}