import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { MenuPage } from "@/components/redirect/MenuPage";
import { z } from "zod";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const leadSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo").regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, "Nome contém caracteres inválidos"),
  phone: z.string().min(8, "Telefone inválido").max(20, "Telefone muito longo").regex(/^[\d\s\(\)\+\-]+$/, "Telefone contém caracteres inválidos"),
});

const RedirectPage = () => {
  const { slug } = useParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const { trackEvent } = useMetaPixel(
    link ? { pixelId: link.facebook_pixel_id || "", linkId: link.link_id || link.id } : null
  );

  useEffect(() => {
    loadLink();
  }, [slug]);

  const loadLink = async () => {
    try {
      // Use scoped RPC instead of direct table query
      const { data, error } = await supabase.rpc("get_redirect_data", {
        p_slug: slug!,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Link não encontrado");

      const linkData = data[0];
      setLink(linkData);

      // Direct redirect
      if (linkData.mode === "direct") {
        handleDirectRedirect(linkData);
      }

      // Menu mode - load menu items via RPC
      if (linkData.mode === "menu") {
        const { data: items } = await supabase.rpc("get_menu_items", {
          p_link_id: linkData.link_id,
        });
        setMenuItems(items || []);
      }
    } catch (error: any) {
      toast.error("Link não encontrado");
    } finally {
      setLoading(false);
    }
  };

  // Track PageView when link loads
  useEffect(() => {
    if (link?.link_id) {
      trackEvent({
        eventName: "PageView",
        eventSourceUrl: window.location.href,
      });
    }
  }, [link?.link_id]);

  const handleDirectRedirect = async (linkData: any) => {
    try {
      const { data: contactId } = await supabase.rpc("get_next_contact", {
        p_link_id: linkData.link_id,
      });

      if (!contactId) {
        toast.error("Nenhum atendente disponível");
        return;
      }

      // Use scoped RPC for contacts
      const { data: contacts } = await supabase.rpc("get_link_contacts", {
        p_link_id: linkData.link_id,
      });
      const contact = contacts?.find((c: any) => c.contact_id === contactId);

      if (!contact) return;

      // Get UTM params
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmCampaign = urlParams.get("utm_campaign");

      // Get Meta cookies
      const fbc = getCookie("_fbc");
      const fbp = getCookie("_fbp");

      // Save lead
      await supabase.from("leads").insert({
        link_id: linkData.link_id,
        contact_id: contactId,
        redirected_to: contact.phone,
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        ip_address: await fetch("https://api.ipify.org?format=json")
          .then((r) => r.json())
          .then((d) => d.ip)
          .catch(() => null),
        user_agent: navigator.userAgent,
        fbc: fbc || null,
        fbp: fbp || null,
        event_source_url: window.location.href,
      } as any);

      // Track conversion
      await trackEvent({
        eventName: "Contact",
        eventSourceUrl: window.location.href,
        customData: {
          content_name: linkData.name,
          content_category: "redirect_link",
        },
      });

      // Redirect
      const message = encodeURIComponent(linkData.message_template || "");
      window.location.href = `https://wa.me/${contact.phone}?text=${message}`;
    } catch (error: any) {
      toast.error("Erro ao redirecionar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs
      const fieldsToValidate: Record<string, string> = {};
      if (link.capture_name) fieldsToValidate.name = formData.name;
      if (link.capture_phone) fieldsToValidate.phone = formData.phone;

      if (link.capture_name || link.capture_phone) {
        const schema = z.object({
          ...(link.capture_name ? { name: leadSchema.shape.name } : {}),
          ...(link.capture_phone ? { phone: leadSchema.shape.phone } : {}),
        });
        const result = schema.safeParse(fieldsToValidate);
        if (!result.success) {
          const firstError = result.error.errors[0]?.message || "Dados inválidos";
          toast.error(firstError);
          setSubmitting(false);
          return;
        }
      }

      const { data: contactId, error: rpcError } = await supabase.rpc("get_next_contact", {
        p_link_id: link.link_id,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        toast.error("Erro ao buscar atendente");
        setSubmitting(false);
        return;
      }

      if (!contactId) {
        toast.error("Nenhum atendente disponível");
        setSubmitting(false);
        return;
      }

      // Use scoped RPC for contacts
      const { data: contacts } = await supabase.rpc("get_link_contacts", {
        p_link_id: link.link_id,
      });
      const contact = contacts?.find((c: any) => c.contact_id === contactId);

      if (!contact) {
        toast.error("Erro ao buscar contato");
        setSubmitting(false);
        return;
      }

      // Get UTM params
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmCampaign = urlParams.get("utm_campaign");

      // Get Meta cookies
      const fbc = getCookie("_fbc");
      const fbp = getCookie("_fbp");

      // Sanitize inputs before saving
      const sanitizedName = formData.name ? formData.name.trim().substring(0, 100) : null;
      const sanitizedPhone = formData.phone ? formData.phone.replace(/[^\d\s\(\)\+\-]/g, "").substring(0, 20) : null;

      // Save lead (don't await - let it run in background)
      supabase.from("leads").insert({
        link_id: link.link_id,
        contact_id: contactId,
        name: sanitizedName,
        phone: sanitizedPhone,
        redirected_to: contact.phone,
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        user_agent: navigator.userAgent,
        fbc: fbc || null,
        fbp: fbp || null,
        event_source_url: window.location.href,
      } as any).then(({ error }) => {
        if (error) console.error("Lead save error:", error);
      });

      // Track conversion (don't await)
      trackEvent({
        eventName: "Contact",
        eventSourceUrl: window.location.href,
        userData: {
          email: sanitizedPhone ? `${sanitizedPhone.replace(/\D/g, "")}@leadflow.temp` : undefined,
          phone: sanitizedPhone || undefined,
          firstName: sanitizedName?.split(" ")[0],
          lastName: sanitizedName?.split(" ").slice(1).join(" "),
        },
        customData: {
          content_name: link.name,
          content_category: "form_submission",
        },
      });

      // Redirect immediately
      let message = link.message_template || "";
      if (sanitizedName) {
        message = message.replace(/{nome}/g, sanitizedName);
      }
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodedMessage}`;
      
      window.location.href = whatsappUrl;
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error("Erro ao enviar");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Menu mode
  if (link?.mode === "menu") {
    return <MenuPage link={{ ...link, id: link.link_id, logo_url: link.logo_url }} menuItems={menuItems} />;
  }

  if (!link || link.mode === "direct") {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
        <Card className="w-full max-w-md shadow-glow border-0 overflow-hidden animate-scale-in">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-whatsapp flex items-center justify-center shadow-glow animate-pulse">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Redirecionando...</h2>
                <p className="text-muted-foreground text-lg">
                  Você será redirecionado para o WhatsApp em instantes
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-full max-w-md shadow-glow border-0 overflow-hidden animate-fade-in">
        <CardHeader className="text-center pb-6 pt-8 px-6 bg-gradient-to-b from-accent/30 to-transparent">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-whatsapp flex items-center justify-center shadow-glow animate-pulse">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold mb-3 text-foreground">
            {link.headline || link.name}
          </CardTitle>
          <p className="text-base text-muted-foreground leading-relaxed">
            {link.subtitle || 'Preencha os dados abaixo para ser atendido via WhatsApp'}
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {link.capture_name && (
              <div className="space-y-2 animate-slide-up">
                <Label htmlFor="name" className="text-sm font-medium">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                  className="h-12 text-base border-2 focus:border-primary transition-all"
                />
              </div>
            )}

            {link.capture_phone && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  maxLength={20}
                  className="h-12 text-base border-2 focus:border-primary transition-all"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold bg-whatsapp hover:bg-whatsapp-dark shadow-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {link.button_text || 'Continuar para WhatsApp'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirectPage;
