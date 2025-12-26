import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Link as LinkIcon } from "lucide-react";
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
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyData {
  date: string;
  leads: number;
}

interface TopLink {
  id: string;
  name: string;
  leads: number;
}

const Analytics = () => {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      // Get links for this workspace
      const { data: links } = await supabase
        .from("redirect_links")
        .select("id, name")
        .eq("workspace_id", currentWorkspace.id);

      if (!links || links.length === 0) {
        setDailyData([]);
        setTopLinks([]);
        setTotalLeads(0);
        setLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Get leads from last 30 days
      const { data: leads } = await supabase
        .from("leads")
        .select("id, link_id, created_at")
        .in("link_id", linkIds)
        .gte("created_at", thirtyDaysAgo);

      if (!leads) {
        setLoading(false);
        return;
      }

      setTotalLeads(leads.length);

      // Group by day
      const dailyMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "dd/MM");
        dailyMap.set(date, 0);
      }

      leads.forEach((lead) => {
        if (lead.created_at) {
          const date = format(new Date(lead.created_at), "dd/MM");
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        }
      });

      setDailyData(
        Array.from(dailyMap.entries()).map(([date, leads]) => ({
          date,
          leads,
        }))
      );

      // Count leads per link
      const linkCounts = new Map<string, number>();
      leads.forEach((lead) => {
        linkCounts.set(lead.link_id, (linkCounts.get(lead.link_id) || 0) + 1);
      });

      const topLinksData = links
        .map((link) => ({
          id: link.id,
          name: link.name,
          leads: linkCounts.get(link.id) || 0,
        }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5);

      setTopLinks(topLinksData);
      setLoading(false);
    };

    fetchAnalytics();
  }, [currentWorkspace]);

  return (
    <DashboardLayout
      title="Analytics"
      description="Visualize o desempenho dos seus links"
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo dos últimos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-3xl font-bold">{totalLeads}</p>
                  <p className="text-sm text-muted-foreground">leads capturados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leads por dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : dailyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
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
                      fill="url(#colorLeads)"
                      name="Leads"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Top 5 Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum link com leads ainda
              </div>
            ) : (
              <div className="space-y-3">
                {topLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{link.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{link.leads}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
