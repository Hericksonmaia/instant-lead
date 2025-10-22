import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLinkDialog = ({ open, onOpenChange }: CreateLinkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    mode: "form",
    captureName: false,
    capturePhone: false,
    pixelId: "",
    messageTemplate: "Olá! Gostaria de mais informações.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let workspace = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!workspace.data) {
        const { data: newWorkspace } = await supabase
          .from("workspaces")
          .insert({ name: "Meu Workspace", owner_id: user.id })
          .select()
          .single();
        workspace.data = newWorkspace;
      }

      const { error } = await supabase.from("redirect_links").insert({
        workspace_id: workspace.data.id,
        slug: formData.slug,
        name: formData.name,
        mode: formData.mode,
        capture_name: formData.captureName,
        capture_phone: formData.capturePhone,
        pixel_id: formData.pixelId || null,
        message_template: formData.messageTemplate,
      });

      if (error) throw error;

      toast.success("Link criado com sucesso!");
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Link *</Label>
            <Input
              id="name"
              placeholder="Ex: Campanha Facebook"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL) *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/r/</span>
              <Input
                id="slug"
                placeholder="campanha-fb"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Modo de Redirecionamento *</Label>
            <RadioGroup
              value={formData.mode}
              onValueChange={(value) => setFormData({ ...formData, mode: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="form" id="form" />
                <Label htmlFor="form" className="font-normal cursor-pointer">
                  Formulário (captura dados antes de redirecionar)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="font-normal cursor-pointer">
                  Direto (redireciona imediatamente)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.mode === "form" && (
            <div className="space-y-3">
              <Label>Campos do Formulário</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="captureName"
                  checked={formData.captureName}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, captureName: checked as boolean })
                  }
                />
                <Label htmlFor="captureName" className="font-normal cursor-pointer">
                  Capturar Nome
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="capturePhone"
                  checked={formData.capturePhone}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, capturePhone: checked as boolean })
                  }
                />
                <Label htmlFor="capturePhone" className="font-normal cursor-pointer">
                  Capturar Telefone
                </Label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pixelId">Facebook Pixel ID (opcional)</Label>
            <Input
              id="pixelId"
              placeholder="1234567890"
              value={formData.pixelId}
              onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Mensagem do WhatsApp</Label>
            <Input
              id="messageTemplate"
              placeholder="Use {nome} para personalizar"
              value={formData.messageTemplate}
              onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Use {"{nome}"} para incluir o nome do lead na mensagem
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Link"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};