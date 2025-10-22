import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Trash2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeadsDialogProps {
  link: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  redirected_to: string | null;
  created_at: string;
  ip_address: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
}

export const LeadsDialog = ({ link, open, onOpenChange }: LeadsDialogProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchLeads();
    }
  }, [open]);

  useEffect(() => {
    const filtered = leads.filter((lead) => {
      const search = searchTerm.toLowerCase();
      return (
        (lead.name?.toLowerCase().includes(search) || false) ||
        (lead.phone?.includes(search) || false) ||
        (lead.redirected_to?.includes(search) || false)
      );
    });
    setFilteredLeads(filtered);
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("link_id", link.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  const deleteSelected = async () => {
    if (selectedLeads.size === 0) return;

    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", Array.from(selectedLeads));

      if (error) throw error;

      toast.success(`${selectedLeads.size} lead(s) excluído(s)!`);
      setSelectedLeads(new Set());
      fetchLeads();
    } catch (error: any) {
      toast.error("Erro ao excluir leads");
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ["Nome", "Telefone", "Redirecionado Para", "Data/Hora", "IP", "UTM Source", "UTM Campaign"],
      ...filteredLeads.map((lead) => [
        lead.name || "",
        lead.phone || "",
        lead.redirected_to || "",
        new Date(lead.created_at).toLocaleString("pt-BR"),
        lead.ip_address || "",
        lead.utm_source || "",
        lead.utm_campaign || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${link.slug}-${new Date().toISOString()}.csv`;
    a.click();

    toast.success("CSV exportado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Leads: {link.name}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={filteredLeads.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelected}
              disabled={selectedLeads.size === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedLeads.size})
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.size === filteredLeads.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Redirecionado Para</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>UTM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </TableCell>
                    <TableCell>{lead.name || "-"}</TableCell>
                    <TableCell>{lead.phone || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{lead.redirected_to}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(lead.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {lead.utm_source || lead.utm_campaign
                        ? `${lead.utm_source || ""}${lead.utm_campaign ? "/" + lead.utm_campaign : ""}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};