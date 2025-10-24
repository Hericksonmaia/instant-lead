import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, TrendingUp, MousePointerClick, Calendar } from "lucide-react";
import { toast } from "sonner";

interface LinkData {
  id: string;
  name: string;
  slug: string;
  mode: string;
  created_at: string;
}

interface Stats {
  totalLeads: number;
  totalViews: number;
  conversionRate: number;
}

const LinkAnalytics = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState<LinkData | null>(null);
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, totalViews: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch link data
        const { data: linkData, error: linkError } = await supabase
          .from("redirect_links")
          .select("*")
          .eq("id", linkId)
          .single();

        if (linkError) throw linkError;
        setLink(linkData);

        // Fetch leads count
        const { count: leadsCount, error: leadsError } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("link_id", linkId);

        if (leadsError) throw leadsError;

        // Calculate stats
        const totalLeads = leadsCount || 0;
        const totalViews = totalLeads; // Simplified for now
        const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

        setStats({
          totalLeads,
          totalViews,
          conversionRate: Math.round(conversionRate),
        });
      } catch (error: any) {
        toast.error("Erro ao carregar dados");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (linkId) {
      fetchData();
    }
  }, [linkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Link não encontrado</h2>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary">{link.name}</h1>
            <p className="text-sm text-muted-foreground">{window.location.origin}/r/{link.slug}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Leads capturados
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                Acessos ao link
              </p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Conversão de visitantes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Link</CardTitle>
            <CardDescription>Detalhes e configurações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Criado em: {new Date(link.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Modo:</span>
              <span className="text-sm capitalize">{link.mode === "form" ? "Formulário" : "Direto"}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LinkAnalytics;
