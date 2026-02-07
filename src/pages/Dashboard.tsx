import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Link as LinkIcon, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Calendar,
  Plus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyData {
  date: string;
  leads: number;
}

interface RecentLead {
  id: string;
  name: string | null;
  phone: string | null;
  created_at: string | null;
  link_name: string;
}

const DashboardContent = () => {
  const navigate = useNavigate();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalLeads: 0,
    leadsToday: 0,
    leadsWeek: 0,
    leadsMonth: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);

  useEffect(() => {
    if (!currentWorkspace || workspaceLoading) return;

    const fetchDashboardData = async () => {
      setLoading(true);

      const { data: links } = await supabase
        .from("redirect_links")
        .select("id, name")
        .eq("workspace_id", currentWorkspace.id);

      if (!links || links.length === 0) {
        setStats({
          totalLinks: 0,
          totalLeads: 0,
          leadsToday: 0,
          leadsWeek: 0,
          leadsMonth: 0,
        });
        setDailyData([]);
        setRecentLeads([]);
        setLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);
      const linkMap = new Map(links.map((l) => [l.id, l.name]));

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { locale: ptBR }).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      const { data: allLeads } = await supabase
        .from("leads")
        .select("id, link_id, created_at, name, phone")
        .in("link_id", linkIds)
        .order("created_at", { ascending: false });

      if (!allLeads) {
        setLoading(false);
        return;
      }

      const leadsToday = allLeads.filter(
        (l) => l.created_at && l.created_at >= todayStart
      ).length;
      const leadsWeek = allLeads.filter(
        (l) => l.created_at && l.created_at >= weekStart
      ).length;
      const leadsMonth = allLeads.filter(
        (l) => l.created_at && l.created_at >= monthStart
      ).length;

      setStats({
        totalLinks: links.length,
        totalLeads: allLeads.length,
        leadsToday,
        leadsWeek,
        leadsMonth,
      });

      const recent = allLeads.slice(0, 5).map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        created_at: lead.created_at,
        link_name: linkMap.get(lead.link_id) || "Link",
      }));
      setRecentLeads(recent);

      const dailyMap = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const date = format(subDays(now, i), "dd/MM");
        dailyMap.set(date, 0);
      }

      const fourteenDaysAgo = subDays(now, 14).toISOString();
      allLeads
        .filter((l) => l.created_at && l.created_at >= fourteenDaysAgo)
        .forEach((lead) => {
          if (lead.created_at) {
            const date = format(new Date(lead.created_at), "dd/MM");
            if (dailyMap.has(date)) {
              dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
            }
          }
        });

      setDailyData(
        Array.from(dailyMap.entries()).map(([date, leads]) => ({
          date,
          leads,
        }))
      );

      setLoading(false);
    };

    fetchDashboardData();
  }, [currentWorkspace, workspaceLoading]);

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Links
            </CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalLinks}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats.leadsToday}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads na Semana
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.leadsWeek}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads no Mês
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.leadsMonth}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart and Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leads nos últimos 14 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : dailyData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorLeadsDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorLeadsDash)"
                      name="Leads"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads Recentes
            </CardTitle>
            <CardDescription>Últimos 5 leads capturados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum lead ainda</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate("/links")}
                >
                  Criar primeiro link
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {lead.name || lead.phone || "Lead"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.link_name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {lead.created_at
                        ? format(new Date(lead.created_at), "dd/MM HH:mm")
                        : ""}
                    </span>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => navigate("/leads")}
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/links")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
            <Button variant="outline" onClick={() => navigate("/leads")}>
              <Users className="h-4 w-4 mr-2" />
              Ver Leads
            </Button>
            <Button variant="outline" onClick={() => navigate("/analytics")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <DashboardContent />
    </DashboardLayout>
  );
};

export default Dashboard;
