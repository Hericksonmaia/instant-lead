import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, GripVertical, Upload, X } from "lucide-react";
import { MENU_ICON_OPTIONS, MenuIcon } from "@/components/redirect/MenuIcons";

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

interface MenuItem {
  id?: string;
  label: string;
  url: string;
  icon?: string;
  order_index: number;
}

const FONTS = ["Inter", "Roboto", "Playfair", "Lato", "Open Sans", "Bebas", "Cinzel", "Space Mono", "Comfortaa"];

export const EditLinkDialog = ({ link, open, onOpenChange, onSuccess }: EditLinkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState({ label: "", url: "", icon: "none" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [newPhone, setNewPhone] = useState("");
  const [settings, setSettings] = useState({
    name: link.name || "",
    slug: link.slug || "",
    mode: link.mode || "form",
    captureName: link.capture_name || false,
    capturePhone: link.capture_phone || false,
    headline: link.headline || "",
    subtitle: link.subtitle || "",
    buttonText: link.button_text || "",
    messageTemplate: link.message_template || "",
    description: (link as any).description || "",
  });
  const [theme, setTheme] = useState({
    bgColor: (link as any).theme_bg_color || "#0f172a",
    textColor: (link as any).theme_text_color || "#f8fafc",
    buttonBg: (link as any).theme_button_bg || "#22c55e",
    buttonText: (link as any).theme_button_text || "#ffffff",
    font: (link as any).theme_font || "Inter",
  });
  
  const [pixelSettings, setPixelSettings] = useState({
    pixelId: (link as any).facebook_pixel_id || "",
    facebookToken: (link as any).facebook_access_token || "",
  });

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchMenuItems();
      setSettings({
        name: link.name || "",
        slug: link.slug || "",
        mode: link.mode || "form",
        captureName: link.capture_name || false,
        capturePhone: link.capture_phone || false,
        headline: link.headline || "",
        subtitle: link.subtitle || "",
        buttonText: link.button_text || "",
        messageTemplate: link.message_template || "",
        description: (link as any).description || "",
      });
      setTheme({
        bgColor: (link as any).theme_bg_color || "#0f172a",
        textColor: (link as any).theme_text_color || "#f8fafc",
        buttonBg: (link as any).theme_button_bg || "#22c55e",
        buttonText: (link as any).theme_button_text || "#ffffff",
        font: (link as any).theme_font || "Inter",
      });
      setPixelSettings({
        pixelId: (link as any).facebook_pixel_id || "",
        facebookToken: (link as any).facebook_access_token || "",
      });
      setLogoUrl((link as any).logo_url || "");
      setLogoPreview((link as any).logo_url || null);
      setLogoFile(null);
    }
  }, [open, link]);


  const fetchContacts = async () => {
    const { data } = await supabase
      .from("redirect_contacts")
      .select("*")
      .eq("link_id", link.id)
      .order("order_index");

    setContacts(data || []);
  };

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from("menu_items" as any)
      .select("*")
      .eq("link_id", link.id)
      .order("order_index");
    setMenuItems((data as any[]) || []);
  };

  const addMenuItem = async () => {
    if (!newMenuItem.label || !newMenuItem.url) return;
    try {
      const maxOrder = menuItems.length > 0 ? Math.max(...menuItems.map(m => m.order_index)) : -1;
      const { error } = await (supabase.from("menu_items" as any) as any).insert({
        link_id: link.id,
        label: newMenuItem.label,
        url: newMenuItem.url,
        icon: newMenuItem.icon === "none" ? null : newMenuItem.icon,
        order_index: maxOrder + 1,
      });
      if (error) throw error;
      toast.success("Link adicionado!");
      setNewMenuItem({ label: "", url: "", icon: "none" });
      fetchMenuItems();
    } catch (error: any) {
      toast.error("Erro ao adicionar link");
    }
  };

  const removeMenuItem = async (id: string) => {
    try {
      const { error } = await (supabase.from("menu_items" as any) as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Link removido!");
      fetchMenuItems();
    } catch (error: any) {
      toast.error("Erro ao remover link");
    }
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
    if (!settings.slug || settings.slug.trim() === "") {
      toast.error("O slug não pode estar vazio");
      return;
    }

    setLoading(true);
    try {
      // Check if slug is unique (only if changed)
      if (settings.slug !== link.slug) {
        const { data: existing } = await supabase
          .from("redirect_links")
          .select("id")
          .eq("slug", settings.slug)
          .neq("id", link.id)
          .maybeSingle();

        if (existing) {
          toast.error("Este slug já está em uso por outro link. Escolha um slug diferente.");
          setLoading(false);
          return;
        }
      }

      // Upload logo if changed
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${link.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(filePath, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
        finalLogoUrl = urlData.publicUrl;
      }

      // Save link settings including theme and description
      const { error: linkError } = await supabase
        .from("redirect_links")
        .update({
          name: settings.name,
          slug: settings.slug,
          mode: settings.mode,
          capture_name: settings.captureName,
          capture_phone: settings.capturePhone,
          headline: settings.headline || null,
          subtitle: settings.subtitle || null,
          button_text: settings.buttonText || null,
          message_template: settings.messageTemplate,
          description: settings.description || null,
          theme_bg_color: theme.bgColor,
          theme_text_color: theme.textColor,
          theme_button_bg: theme.buttonBg,
          theme_button_text: theme.buttonText,
          theme_font: theme.font,
          facebook_pixel_id: pixelSettings.pixelId || null,
          facebook_access_token: pixelSettings.facebookToken || null,
          logo_url: finalLogoUrl || null,
        } as any)
        .eq("id", link.id);

      if (linkError) throw linkError;

      toast.success("Configurações salvas!");
      onSuccess();
    } catch (error: any) {
      console.error("Save settings error:", error);
      toast.error("Erro ao salvar configurações: " + (error?.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Link: {link.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={settings.mode === "menu" ? "menu-items" : "contacts"}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contacts">Atendentes</TabsTrigger>
            <TabsTrigger value="menu-items">Menu</TabsTrigger>
            <TabsTrigger value="theme">Tema</TabsTrigger>
            <TabsTrigger value="settings">Config</TabsTrigger>
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

          {/* Menu Items Tab */}
          <TabsContent value="menu-items" className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">
              Adicione os links que aparecerão na página de menu (modo "Menu").
            </p>

            {/* Logo upload */}
            <div className="space-y-2">
              <Label>Logo do Perfil</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-full object-cover border" />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(""); }}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-primary hover:underline">
                      {logoPreview ? "Trocar logo" : "Fazer upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">JPG, PNG. Máx 2MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Novo Link</Label>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Texto do botão (ex: Nosso Instagram)"
                  value={newMenuItem.label}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, label: e.target.value })}
                />
                <div className="flex gap-2">
                  <Select
                    value={newMenuItem.icon}
                    onValueChange={(v) => setNewMenuItem({ ...newMenuItem, icon: v })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      {MENU_ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            {opt.value !== "none" && <MenuIcon name={opt.value} className="inline-flex" />}
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://instagram.com/..."
                    value={newMenuItem.url}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, url: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={addMenuItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Links do Menu ({menuItems.length})</Label>
              {menuItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum link adicionado
                </p>
              ) : (
                <div className="space-y-2">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {item.icon && item.icon !== "none" ? (
                          <MenuIcon name={item.icon} className="shrink-0 text-muted-foreground" />
                        ) : (
                          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => item.id && removeMenuItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição da Página</Label>
              <Input
                id="edit-description"
                placeholder="Uma breve descrição sobre você/empresa"
                value={settings.description}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              />
            </div>

            <Button onClick={saveSettings} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">
              Personalize as cores e fonte da página de redirecionamento.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.bgColor}
                    onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={theme.bgColor}
                    onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor do Texto</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={theme.textColor}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor do Botão</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.buttonBg}
                    onChange={(e) => setTheme({ ...theme, buttonBg: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={theme.buttonBg}
                    onChange={(e) => setTheme({ ...theme, buttonBg: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.buttonText}
                    onChange={(e) => setTheme({ ...theme, buttonText: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={theme.buttonText}
                    onChange={(e) => setTheme({ ...theme, buttonText: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={theme.font} onValueChange={(v) => setTheme({ ...theme, font: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Live preview */}
            <div className="border rounded-lg overflow-hidden">
              <div
                className="p-6 text-center space-y-3"
                style={{ backgroundColor: theme.bgColor, color: theme.textColor, fontFamily: theme.font }}
              >
                <p className="text-sm font-bold">Preview</p>
                <div
                  className="px-4 py-2 rounded-lg mx-auto inline-block font-semibold text-sm"
                  style={{ backgroundColor: theme.buttonBg, color: theme.buttonText }}
                >
                  Exemplo de Botão
                </div>
              </div>
            </div>

            <Button onClick={saveSettings} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Tema"
              )}
            </Button>
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
                    value={settings.slug}
                    onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Atenção: alterar o slug invalida links já compartilhados
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="menu" id="edit-menu" />
                    <Label htmlFor="edit-menu" className="font-normal cursor-pointer">
                      Menu (página com múltiplos links estilo bio)
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
                  Configurações específicas deste link (sobrescrevem as do workspace)
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-pixelId">Facebook Pixel ID</Label>
                  <Input
                    id="edit-pixelId"
                    placeholder="1234567890"
                    value={pixelSettings.pixelId}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, pixelId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-facebookToken">Token de API do Facebook</Label>
                  <Input
                    id="edit-facebookToken"
                    type="password"
                    placeholder="Token de acesso da Conversions API"
                    value={pixelSettings.facebookToken}
                    onChange={(e) => setPixelSettings({ ...pixelSettings, facebookToken: e.target.value })}
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