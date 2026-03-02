import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    mode: "form",
    captureName: false,
    capturePhone: false,
    messageTemplate: "Olá! Gostaria de mais informações.",
    headline: "",
    subtitle: "",
    buttonText: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) {
      toast.error("Workspace não selecionado");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from("redirect_links").insert({
        workspace_id: currentWorkspace.id,
        slug: formData.slug,
        name: formData.name,
        mode: formData.mode,
        capture_name: formData.captureName,
        capture_phone: formData.capturePhone,
        message_template: formData.messageTemplate,
        headline: formData.headline || null,
        subtitle: formData.subtitle || null,
        button_text: formData.buttonText || null,
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="menu" id="menu" />
                <Label htmlFor="menu" className="font-normal cursor-pointer">
                  Menu (página com múltiplos links estilo bio)
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

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">🎨 Personalização da Página</h3>
            
            <div className="space-y-2">
              <Label htmlFor="headline">Título Principal</Label>
              <Input
                id="headline"
                placeholder="Entre em contato"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para usar o nome do link
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                placeholder="Preencha os dados abaixo para ser atendido"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto do Botão</Label>
              <Input
                id="buttonText"
                placeholder="Continuar para WhatsApp"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              />
            </div>
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