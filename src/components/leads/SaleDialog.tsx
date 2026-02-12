import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Loader2, Tag } from "lucide-react";
import { TagBadge } from "@/components/tags/TagBadge";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string | null;
  onSaleRegistered: () => void;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

export function SaleDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onSaleRegistered,
}: SaleDialogProps) {
  const { currentWorkspace } = useWorkspace();
  const [saleValue, setSaleValue] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Load tags when dialog opens
  useState(() => {
    if (open && currentWorkspace) {
      setLoadingTags(true);
      supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .then(({ data }) => {
          setTags((data || []) as TagItem[]);
          setLoadingTags(false);
        });
    }
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!saleValue || parseFloat(saleValue) <= 0) {
      toast.error("Informe um valor de venda válido");
      return;
    }

    setSubmitting(true);

    try {
      // Call edge function to register sale and send to Meta CAPI
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            leadId,
            saleValue: parseFloat(saleValue),
            saleCurrency: currency,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error("Sale registration error:", result.error);
        // Still update locally even if Meta fails
        if (result.error?.includes("Facebook")) {
          toast.warning("Venda registrada, mas erro ao enviar para Meta: " + result.error);
        } else {
          throw new Error(result.error);
        }
      } else {
        toast.success("Venda registrada e enviada para Meta com sucesso!");
      }

      // Add tags to lead
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map((tagId) => ({
          lead_id: leadId,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from("lead_tags" as any)
          .insert(tagInserts as any);

        if (tagError) {
          console.error("Error adding tags:", tagError);
        }
      }

      onSaleRegistered();
      onOpenChange(false);
      setSaleValue("");
      setSelectedTags([]);
    } catch (error) {
      console.error("Error registering sale:", error);
      toast.error("Erro ao registrar venda");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Registrar Venda - {leadName || "Lead"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sale-value">Valor da Venda *</Label>
            <div className="flex gap-2">
              <Input
                id="sale-value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={saleValue}
                onChange={(e) => setSaleValue(e.target.value)}
                className="flex-1"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags (opcional)
            </Label>
            {loadingTags ? (
              <p className="text-sm text-muted-foreground">Carregando tags...</p>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tag criada. Crie tags nas configurações.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`transition-all ${
                      selectedTags.includes(tag.id)
                        ? "ring-2 ring-offset-1 ring-primary rounded-full"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <TagBadge name={tag.name} color={tag.color} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Ao registrar, um evento <strong>Purchase</strong> será enviado para a Meta
            Conversions API com todos os dados do lead (telefone, nome, IP, user agent,
            cookies fbc/fbp).
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !saleValue}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Venda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
