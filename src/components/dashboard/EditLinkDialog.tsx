import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface EditLinkDialogProps {
  link: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Contact {
  id: string;
  phone: string;
  order_index: number;
}

export const EditLinkDialog = ({ link, open, onOpenChange, onSuccess }: EditLinkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [settings, setSettings] = useState({
    name: link.name || "",
    mode: link.mode || "form",
    captureName: link.capture_name || false,
    capturePhone: link.capture_phone || false,
    headline: link.headline || "",
    subtitle: link.subtitle || "",
    buttonText: link.button_text || "",
    messageTemplate: link.message_template || "",
  });
  
  const [workspaceSettings, setWorkspaceSettings] = useState({
    pixelId: "",
    facebookToken: "",
  });

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchWorkspaceSettings();
      setSettings({
        name: link.name || "",
        mode: link.mode || "form",
        captureName: link.capture_name || false,
        capturePhone: link.capture_phone || false,
        headline: link.headline || "",
        subtitle: link.subtitle || "",
        buttonText: link.button_text || "",
        messageTemplate: link.message_template || "",
      });
    }
  }, [open, link]);

  const fetchWorkspaceSettings = async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("facebook_pixel_id, facebook_access_token")
      .eq("id", link.workspace_id)
      .single();

    if (data) {
      setWorkspaceSettings({
        pixelId: data.facebook_pixel_id || "",
        facebookToken: data.facebook_access_token || "",
      });
    }
  };

  const fetchContacts = async () => {
    const { data } = await supabase
      .from("redirect_contacts")
      .select("*")
      .eq("link_id", link.id)
      .order("order_index");

    setContacts(data || []);
  };

  const addContact = async () => {
    if (!newPhone) return;

    try {
      const maxOrder = contacts.length > 0 ? Math.max(...contacts.map(c => c.order_index)) : -1;
      
      const { error } = await supabase.from("redirect_contacts").insert({
        link_id: link.id,
        phone: newPhone,
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      toast.success("Atendente adicionado!");
      setNewPhone("");
      fetchContacts();
    } catch (error: any) {
      toast.error("Erro ao adicionar atendente");
    }
  };

  const removeContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("redirect_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Atendente removido!");
      fetchContacts();
    } catch (error: any) {
      toast.error("Erro ao remover atendente");
    }
  };

  const resetQueue = async () => {
    try {
      const { error } = await supabase.rpc("reset_link_queue", {
        p_link_id: link.id,
      });

      if (error) throw error;

      toast.success("Fila resetada!");
    } catch (error: any) {
      toast.error("Erro ao resetar fila");
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save link settings
      const { error: linkError } = await supabase
        .from("redirect_links")
        .update({
          name: settings.name,
          mode: settings.mode,
          capture_name: settings.captureName,
          capture_phone: settings.capturePhone,
          headline: settings.headline || null,
          subtitle: settings.subtitle || null,
          button_text: settings.buttonText || null,
          message_template: settings.messageTemplate,
        })
        .eq("id", link.id);

      if (linkError) throw linkError;

      // Save workspace Facebook settings
      const { error: workspaceError } = await supabase
        .from("workspaces")
        .update({
          facebook_pixel_id: workspaceSettings.pixelId || null,
          facebook_access_token: workspaceSettings.facebookToken || null,
        })
        .eq("id", link.workspace_id);

      if (workspaceError) throw workspaceError;

      toast.success("Configurações salvas!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Link: {link.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts">Atendentes</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <div className="space-y-2">
              <Label>Adicionar Atendente (WhatsApp)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="5511999999999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Button onClick={addContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fila de Atendentes ({contacts.length})</Label>
                <Button variant="outline" size="sm" onClick={resetQueue}>
                  Resetar Fila
                </Button>
              </div>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum atendente cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-headline">Título Principal</Label>
                <Input
                  id="edit-headline"
                  placeholder="Entre em contato"
                  value={settings.headline}
                  onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para usar o nome do link
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-subtitle">Subtítulo</Label>
                <Input
                  id="edit-subtitle"
                  placeholder="Preencha os dados abaixo..."
                  value={settings.subtitle}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-buttonText">Texto do Botão</Label>
                <Input
                  id="edit-buttonText"
                  placeholder="Continuar para WhatsApp"
                  value={settings.buttonText}
                  onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-messageTemplate">Mensagem do WhatsApp</Label>
                <Input
                  id="edit-messageTemplate"
                  placeholder="Use {nome} para personalizar"
                  value={settings.messageTemplate}
                  onChange={(e) => setSettings({ ...settings, messageTemplate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{nome}"} para incluir o nome do lead
                </p>
              </div>

              <Button onClick={saveSettings} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Link</Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Campanha Facebook"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/r/</span>
                  <Input
                    id="edit-slug"
                    value={link.slug}
                    disabled
                    className="opacity-50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O slug não pode ser alterado após a criação
                </p>
              </div>

              <div className="space-y-3">
                <Label>Modo de Redirecionamento</Label>
                <RadioGroup
                  value={settings.mode}
                  onValueChange={(value) => setSettings({ ...settings, mode: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="form" id="edit-form" />
                    <Label htmlFor="edit-form" className="font-normal cursor-pointer">
                      Formulário (captura dados antes de redirecionar)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="edit-direct" />
                    <Label htmlFor="edit-direct" className="font-normal cursor-pointer">
                      Direto (redireciona imediatamente)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {settings.mode === "form" && (
                <div className="space-y-3">
                  <Label>Campos do Formulário</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-captureName"
                      checked={settings.captureName}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, captureName: checked as boolean })
                      }
                    />
                    <Label htmlFor="edit-captureName" className="font-normal cursor-pointer">
                      Capturar Nome
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-capturePhone"
                      checked={settings.capturePhone}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, capturePhone: checked as boolean })
                      }
                    />
                    <Label htmlFor="edit-capturePhone" className="font-normal cursor-pointer">
                      Capturar Telefone
                    </Label>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm">Facebook Pixel & API</h3>
                <p className="text-xs text-muted-foreground">
                  Configurações aplicadas a todos os links deste workspace
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-pixelId">Facebook Pixel ID</Label>
                  <Input
                    id="edit-pixelId"
                    placeholder="1234567890"
                    value={workspaceSettings.pixelId}
                    onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, pixelId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-facebookToken">Token de API do Facebook</Label>
                  <Input
                    id="edit-facebookToken"
                    type="password"
                    placeholder="Token de acesso da Conversions API"
                    value={workspaceSettings.facebookToken}
                    onChange={(e) => setWorkspaceSettings({ ...workspaceSettings, facebookToken: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    🔒 Token armazenado com segurança no servidor (nunca exposto ao navegador)
                  </p>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Todas as Configurações"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};