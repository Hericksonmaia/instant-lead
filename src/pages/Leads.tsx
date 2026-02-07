import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, User, Phone, Calendar, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Lead = Tables<"leads"> & {
  redirect_links?: { name: string; slug: string } | null;
};

function LeadsContent() {
  const { currentWorkspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentWorkspace) return;

    const fetchLeads = async () => {
      setLoading(true);

      const { data: links } = await supabase
        .from("redirect_links")
        .select("id")
        .eq("workspace_id", currentWorkspace.id);

      if (!links || links.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);

      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          redirect_links (
            name,
            slug
          )
        `)
        .in("link_id", linkIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error);
      } else {
        setLeads(data || []);
      }

      setLoading(false);
    };

    fetchLeads();
  }, [currentWorkspace]);

  const filteredLeads = leads.filter((lead) => {
    const search = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(search) ||
      lead.phone?.toLowerCase().includes(search) ||
      lead.redirect_links?.name?.toLowerCase().includes(search)
    );
  });

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Link", "Data", "UTM Source", "UTM Campaign"];
    const rows = filteredLeads.map((lead) => [
      lead.name || "",
      lead.phone || "",
      lead.redirect_links?.name || "",
      lead.created_at ? format(new Date(lead.created_at), "dd/MM/yyyy HH:mm") : "",
      lead.utm_source || "",
      lead.utm_campaign || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `leads-${currentWorkspace?.name || "export"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Leads ({filteredLeads.length})
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={exportCSV} disabled={filteredLeads.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>UTM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {lead.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {lead.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        {lead.redirect_links?.name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {lead.created_at
                          ? format(new Date(lead.created_at), "dd/MM HH:mm", { locale: ptBR })
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {lead.utm_source && (
                          <Badge variant="outline" className="text-xs">
                            {lead.utm_source}
                          </Badge>
                        )}
                        {lead.utm_campaign && (
                          <Badge variant="secondary" className="text-xs">
                            {lead.utm_campaign}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Leads = () => {
  return (
    <DashboardLayout
      title="Leads"
      description="Visualize todos os leads capturados"
    >
      <LeadsContent />
    </DashboardLayout>
  );
};

export default Leads;
