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
import { Download, Search, User, Phone, Calendar, Link as LinkIcon, MessageSquare, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageHistoryModal } from "@/components/leads/MessageHistoryModal";
import { SaleDialog } from "@/components/leads/SaleDialog";
import {
  getLeadsWithMessages,
  hasRecentMessage,
  truncateMessage,
  type LeadWithMessages,
} from "@/lib/api/whatsapp";

type Lead = Tables<"leads"> & {
  redirect_links?: { name: string; slug: string } | null;
  sold?: boolean;
  sale_value?: number;
  sale_currency?: string;
};

function LeadsContent() {
  const { currentWorkspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messagesMap, setMessagesMap] = useState<Map<string, LeadWithMessages>>(new Map());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleLeadTarget, setSaleLeadTarget] = useState<Lead | null>(null);

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
        
        // Fetch messages for all leads
        if (data && data.length > 0) {
          try {
            const leadIds = data.map((l) => l.id);
            const messages = await getLeadsWithMessages(leadIds);
            setMessagesMap(messages);
          } catch (err) {
            console.error("Error fetching messages:", err);
          }
        }
      }

      setLoading(false);
    };

    fetchLeads();
  }, [currentWorkspace]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setHistoryModalOpen(true);
  };

  const handleSaleClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setSaleLeadTarget(lead);
    setSaleDialogOpen(true);
  };

  const fetchLeadsAgain = () => {
    if (!currentWorkspace) return;
    // Re-trigger effect
    setLoading(true);
    supabase
      .from("redirect_links")
      .select("id")
      .eq("workspace_id", currentWorkspace.id)
      .then(({ data: links }) => {
        if (!links || links.length === 0) {
          setLeads([]);
          setLoading(false);
          return;
        }
        const linkIds = links.map((l) => l.id);
        supabase
          .from("leads")
          .select("*, redirect_links (name, slug)")
          .in("link_id", linkIds)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            setLeads((data || []) as Lead[]);
            setLoading(false);
          });
      });
  };

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
                  <TableHead>Primeira Msg</TableHead>
                  <TableHead>Última Msg</TableHead>
                   <TableHead>Data</TableHead>
                   <TableHead>Venda</TableHead>
                   <TableHead>UTM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const leadMessages = messagesMap.get(lead.id);
                  const isRecent = hasRecentMessage(leadMessages?.last_message);
                  
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLeadClick(lead)}
                    >
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
                        <div className="flex items-center gap-2 max-w-[150px]">
                          {leadMessages?.first_message ? (
                            <span className="text-sm text-muted-foreground truncate" title={leadMessages.first_message.message_content}>
                              {truncateMessage(leadMessages.first_message.message_content, 30)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[150px]">
                          {leadMessages?.last_message ? (
                            <>
                              <span className="text-sm text-muted-foreground truncate" title={leadMessages.last_message.message_content}>
                                {truncateMessage(leadMessages.last_message.message_content, 30)}
                              </span>
                              {isRecent && (
                                <Badge variant="outline" className="bg-accent text-accent-foreground shrink-0">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Recente
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                        {(lead as any).sold ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            R$ {(lead as any).sale_value?.toFixed(2)}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={(e) => handleSaleClick(e, lead)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Venda
                          </Button>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedLead && (
          <MessageHistoryModal
            open={historyModalOpen}
            onOpenChange={setHistoryModalOpen}
            leadId={selectedLead.id}
            leadName={selectedLead.name}
          />
        )}

        {saleLeadTarget && (
          <SaleDialog
            open={saleDialogOpen}
            onOpenChange={setSaleDialogOpen}
            leadId={saleLeadTarget.id}
            leadName={saleLeadTarget.name}
            onSaleRegistered={fetchLeadsAgain}
          />
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
