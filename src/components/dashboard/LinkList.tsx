import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2, Copy, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EditLinkDialog } from "./EditLinkDialog";
import { LeadsDialog } from "./LeadsDialog";

interface RedirectLink {
  id: string;
  slug: string;
  name: string;
  mode: string;
  created_at: string;
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
      const { data, error } = await supabase
        .from("redirect_links")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
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
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{link.name}</h3>
                <Badge variant={link.mode === "form" ? "default" : "secondary"}>
                  {link.mode === "form" ? "Formulário" : "Direto"}
                </Badge>
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