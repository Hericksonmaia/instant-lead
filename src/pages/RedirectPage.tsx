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

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

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
    link ? { pixelId: "placeholder", linkId: link.id } : null
  );

  useEffect(() => {
    loadLink();
  }, [slug]);

  const loadLink = async () => {
    try {
      const { data, error } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Link não encontrado");

      setLink(data);

      // Direct redirect
      if (data.mode === "direct") {
        handleDirectRedirect(data);
      }

      // Menu mode - load menu items
      if (data.mode === "menu") {
        const { data: items } = await supabase
          .from("menu_items" as any)
          .select("*")
          .eq("link_id", data.id)
          .order("order_index");
        setMenuItems((items as any[]) || []);
      }
    } catch (error: any) {
      toast.error("Link não encontrado");
    } finally {
      setLoading(false);
    }
  };

  // Track PageView when link loads
  useEffect(() => {
    if (link?.id) {
      trackEvent({
        eventName: "PageView",
        eventSourceUrl: window.location.href,
      });
    }
  }, [link?.id]);
  const handleDirectRedirect = async (linkData: any) => {
    try {
      const { data: contactId } = await supabase.rpc("get_next_contact", {
        p_link_id: linkData.id,
      });

      if (!contactId) {
        toast.error("Nenhum atendente disponível");
        return;
      }

      const { data: contact } = await supabase
        .from("redirect_contacts")
        .select("phone")
        .eq("id", contactId)
        .single();

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
        link_id: linkData.id,
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
      const message = encodeURIComponent(linkData.message_template);
      window.location.href = `https://wa.me/${contact.phone}?text=${message}`;
    } catch (error: any) {
      toast.error("Erro ao redirecionar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: contactId, error: rpcError } = await supabase.rpc("get_next_contact", {
        p_link_id: link.id,
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

      const { data: contact, error: contactError } = await supabase
        .from("redirect_contacts")
        .select("phone")
        .eq("id", contactId)
        .single();

      if (contactError || !contact) {
        console.error("Contact error:", contactError);
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

      // Save lead (don't await - let it run in background)
      supabase.from("leads").insert({
        link_id: link.id,
        contact_id: contactId,
        name: formData.name || null,
        phone: formData.phone || null,
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
          email: formData.phone ? `${formData.phone.replace(/\D/g, "")}@leadflow.temp` : undefined,
          phone: formData.phone,
          firstName: formData.name?.split(" ")[0],
          lastName: formData.name?.split(" ").slice(1).join(" "),
        },
        customData: {
          content_name: link.name,
          content_category: "form_submission",
        },
      });

      // Redirect immediately
      let message = link.message_template || "";
      if (formData.name) {
        message = message.replace(/{nome}/g, formData.name);
      }
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodedMessage}`;
      
      console.log("Redirecting to:", whatsappUrl);
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
    return <MenuPage link={link} menuItems={menuItems} />;
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
