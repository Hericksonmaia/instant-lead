import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Loader2 } from "lucide-react";
import { getLeadMessages, type WhatsAppMessage } from "@/lib/api/whatsapp";
import { cn } from "@/lib/utils";

interface MessageHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string | null;
}

export function MessageHistoryModal({
  open,
  onOpenChange,
  leadId,
  leadName,
}: MessageHistoryModalProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    if (open && leadId) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      fetchMessages(1);
    }
  }, [open, leadId]);

  useEffect(() => {
    // Scroll to bottom when messages first load
    if (messages.length > 0 && page === 1 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [messages, page]);

  const fetchMessages = async (pageNum: number) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await getLeadMessages(leadId, pageNum, PAGE_SIZE);
      
      if (pageNum === 1) {
        setMessages(data);
      } else {
        setMessages((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Mensagens - {leadName || "Lead"}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[60vh] pr-2"
        >
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fetchMessages(1)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg p-4 border",
                    index === 0
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>
                      {format(new Date(message.timestamp), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    {index === 0 && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                        Primeira mensagem
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message_content}
                  </p>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
