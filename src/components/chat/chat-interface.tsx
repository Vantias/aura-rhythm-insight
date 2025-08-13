import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, X, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadConversationHistory();
    }
  }, [isOpen]);

  const loadConversationHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;

      const formattedMessages: Message[] = conversations?.map(conv => ({
        id: conv.id,
        content: conv.message,
        isUser: conv.message_type === 'user',
        timestamp: new Date(conv.created_at),
      })) || [];

      if (formattedMessages.length === 0) {
        // Add welcome message if no conversation history
        formattedMessages.push({
          id: 'welcome',
          content: "Hello! I'm your Aura assistant. I'm here to help you understand your health patterns and provide personalized insights based on your wellness data. What would you like to know about your health journey?",
          isUser: false,
          timestamp: new Date(),
        });
      }

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Add fallback welcome message
      setMessages([{
        id: 'welcome',
        content: "Hello! I'm your Aura assistant. I'm here to help you understand your health patterns. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('aura-chat', {
        body: {
          message: inputValue,
          userId: user.id
        }
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || data.fallbackResponse || "I'm sorry, I'm having trouble right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      if (data.fallbackResponse) {
        toast({
          title: "Limited functionality",
          description: "I'm having trouble accessing your health data. Try syncing your device.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
      
      toast({
        title: "Connection error",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] bg-gradient-card border-border/50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Aura Assistant</h3>
              <p className="text-xs text-muted-foreground">Your wellness companion</p>
            </div>
          </div>
          <Button onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading conversation...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    message.isUser ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-primary"
                    )}
                  >
                    {message.isUser ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border/50"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-muted border border-border/50 rounded-2xl px-4 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your health patterns..."
              className="flex-1 bg-background/50 border-border/50"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}