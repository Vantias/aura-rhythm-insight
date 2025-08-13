import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContextTag {
  id: string;
  label: string;
  category: "nutrition" | "activity" | "mood" | "sleep";
  icon: string;
}

const contextTags: ContextTag[] = [
  // Nutrition
  { id: "caffeine", label: "Caffeine", category: "nutrition", icon: "☕" },
  { id: "alcohol", label: "Alcohol", category: "nutrition", icon: "🍷" },
  { id: "late_meal", label: "Late Meal", category: "nutrition", icon: "🍽️" },
  { id: "hydrated", label: "Well Hydrated", category: "nutrition", icon: "💧" },
  { id: "supplements", label: "Supplements", category: "nutrition", icon: "💊" },
  
  // Activity
  { id: "workout", label: "Workout", category: "activity", icon: "💪" },
  { id: "cardio", label: "Cardio", category: "activity", icon: "🏃" },
  { id: "yoga", label: "Yoga/Stretch", category: "activity", icon: "🧘" },
  { id: "sedentary", label: "Sedentary Day", category: "activity", icon: "🛋️" },
  { id: "outdoor", label: "Outdoor Activity", category: "activity", icon: "🌳" },
  
  // Mood
  { id: "stressed", label: "Stressed", category: "mood", icon: "😫" },
  { id: "relaxed", label: "Relaxed", category: "mood", icon: "😌" },
  { id: "anxious", label: "Anxious", category: "mood", icon: "😰" },
  { id: "happy", label: "Happy", category: "mood", icon: "😊" },
  { id: "focused", label: "Focused", category: "mood", icon: "🎯" },
  
  // Sleep
  { id: "screen_time", label: "Late Screen Time", category: "sleep", icon: "📱" },
  { id: "meditation", label: "Meditation", category: "sleep", icon: "🧘‍♀️" },
  { id: "nap", label: "Napped", category: "sleep", icon: "😴" },
  { id: "travel", label: "Travel/Time Change", category: "sleep", icon: "✈️" },
];

interface ContextLoggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextLogger({ isOpen, onClose }: ContextLoggerProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleTag = (tagId: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTags(newSelected);
  };

  const handleSave = async () => {
    if (selectedTags.size === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const contextData = {
        user_id: user.id,
        action_type: "context_log",
        data: {
          tags: Array.from(selectedTags),
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from("quick_actions_log")
        .insert(contextData);

      if (error) throw error;

      toast({
        title: "Context logged successfully",
        description: `${selectedTags.size} tags saved for today`,
      });
      
      setSelectedTags(new Set());
      onClose();
    } catch (error) {
      console.error("Error saving context:", error);
      toast({
        title: "Failed to save context",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const categorizedTags = contextTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, ContextTag[]>);

  const categoryLabels = {
    nutrition: "Nutrition & Hydration",
    activity: "Physical Activity",
    mood: "Mind & Mood",
    sleep: "Sleep & Recovery",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-gradient-card border-border/50 flex flex-col">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Log Today's Context
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select what influenced your day. This helps Aura understand your patterns.
              </p>
            </div>
            <Button onClick={onClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(categorizedTags).map(([category, tags]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    variant="outline"
                    className={cn(
                      "h-auto p-3 text-left border-border/50 bg-background/50 hover:bg-muted/50 transition-all",
                      selectedTags.has(tag.id) && 
                      "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-lg">{tag.icon}</span>
                      <span className="text-xs font-medium flex-1">{tag.label}</span>
                      {selectedTags.has(tag.id) && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>

        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedTags.size > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {selectedTags.size} selected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={selectedTags.size === 0}
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                size="sm"
              >
                Save Context
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}