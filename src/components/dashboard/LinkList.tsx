import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2, Copy, Users, BarChart3, CopyPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EditLinkDialog } from "./EditLinkDialog";
import { LeadsDialog } from "./LeadsDialog";
import { TagBadge } from "@/components/tags/TagBadge";
import { TagSelector } from "@/components/tags/TagSelector";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface RedirectLink {
  id: string;
  slug: string;
  name: string;
  mode: string;
  created_at: string;
  tags: TagType[];
}

export const LinkList = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [links, setLinks] = useState<RedirectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<RedirectLink | null>(null);
  const [viewingLeads, setViewingLeads] = useState<RedirectLink | null>(null);

  const fetchLinks = async () => {
    if (!currentWorkspace) return;
    
    try {
      // Fetch links
      const { data: linksData, error: linksError } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;
      
      if (!linksData || linksData.length === 0) {
        setLinks([]);
        setLoading(false);
        return;
      }

      // Fetch tags for all links
      const linkIds = linksData.map((l) => l.id);
      const { data: linkTagsData } = await supabase
        .from("link_tags")
        .select(`
          link_id,
          tag_id,
          tags (id, name, color)
        `)
        .in("link_id", linkIds);

      // Map tags to links
      const linksWithTags: RedirectLink[] = linksData.map((link) => {
        const linkTags = linkTagsData
          ?.filter((lt) => lt.link_id === link.id)
          .map((lt) => lt.tags as unknown as TagType)
          .filter(Boolean) || [];
        
        return {
          ...link,
          tags: linkTags,
        };
      });

      setLinks(linksWithTags);
    } catch (error: any) {
      toast.error("Erro ao carregar links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [currentWorkspace]);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const duplicateLink = async (link: RedirectLink) => {
    if (!currentWorkspace) return;
    try {
      // Fetch full link data
      const { data: original, error: fetchError } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("id", link.id)
        .single();

      if (fetchError || !original) throw fetchError;

      const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;

      const { data: newLink, error: insertError } = await supabase
        .from("redirect_links")
        .insert({
          workspace_id: currentWorkspace.id,
          slug: newSlug,
          name: `${original.name} (cópia)`,
          mode: original.mode,
          capture_name: original.capture_name,
          capture_phone: original.capture_phone,
          message_template: original.message_template,
          headline: original.headline,
          subtitle: original.subtitle,
          button_text: original.button_text,
          description: original.description,
          theme_bg_color: original.theme_bg_color,
          theme_text_color: original.theme_text_color,
          theme_button_bg: original.theme_button_bg,
          theme_button_text: original.theme_button_text,
          theme_font: original.theme_font,
          facebook_pixel_id: original.facebook_pixel_id,
          facebook_access_token: original.facebook_access_token,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Duplicate contacts
      const { data: contacts } = await supabase
        .from("redirect_contacts")
        .select("phone, order_index")
        .eq("link_id", link.id);

      if (contacts && contacts.length > 0) {
        await supabase.from("redirect_contacts").insert(
          contacts.map((c) => ({
            link_id: newLink.id,
            phone: c.phone,
            order_index: c.order_index,
          }))
        );
      }

      // Duplicate menu items
      if (original.mode === "menu") {
        const { data: items } = await supabase
          .from("menu_items")
          .select("label, url, icon, order_index")
          .eq("link_id", link.id);

        if (items && items.length > 0) {
          await supabase.from("menu_items").insert(
            items.map((item) => ({
              link_id: newLink.id,
              label: item.label,
              url: item.url,
              icon: item.icon,
              order_index: item.order_index,
            }))
          );
        }
      }

      toast.success("Link duplicado com sucesso!");
      fetchLinks();
    } catch (error: any) {
      toast.error("Erro ao duplicar link");
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("redirect_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Link excluído!");
      fetchLinks();
    } catch (error: any) {
      toast.error("Erro ao excluir link");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nenhum link criado ainda</p>
        <p className="text-sm mt-2">Clique em "Novo Link" para começar</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-semibold">{link.name}</h3>
                <Badge variant={link.mode === "form" ? "default" : link.mode === "menu" ? "outline" : "secondary"}>
                  {link.mode === "form" ? "Formulário" : link.mode === "menu" ? "Menu" : "Direto"}
                </Badge>
                {link.tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                  />
                ))}
                <TagSelector
                  linkId={link.id}
                  selectedTags={link.tags}
                  onTagsChange={(newTags) => {
                    setLinks(links.map((l) =>
                      l.id === link.id ? { ...l, tags: newTags } : l
                    ));
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {window.location.origin}/r/{link.slug}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/analytics/${link.id}`)}
                title="Ver análises"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewingLeads(link)}
                title="Ver leads"
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyLink(link.slug)}
                title="Copiar link"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`/r/${link.slug}`, "_blank")}
                title="Abrir link"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingLink(link)}
                title="Editar link"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => duplicateLink(link)}
                title="Duplicar link"
              >
                <CopyPlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteLink(link.id)}
                title="Excluir link"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          open={!!editingLink}
          onOpenChange={(open) => {
            if (!open) setEditingLink(null);
          }}
          onSuccess={fetchLinks}
        />
      )}

      {viewingLeads && (
        <LeadsDialog
          link={viewingLeads}
          open={!!viewingLeads}
          onOpenChange={(open) => {
            if (!open) setViewingLeads(null);
          }}
        />
      )}
    </>
  );
};