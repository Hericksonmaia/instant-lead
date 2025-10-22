import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface EditLinkDialogProps {
  link: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Contact {
  id: string;
  phone: string;
  order_index: number;
}

export const EditLinkDialog = ({ link, open, onOpenChange, onSuccess }: EditLinkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open]);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from("redirect_contacts")
      .select("*")
      .eq("link_id", link.id)
      .order("order_index");

    setContacts(data || []);
  };

  const addContact = async () => {
    if (!newPhone) return;

    try {
      const maxOrder = contacts.length > 0 ? Math.max(...contacts.map(c => c.order_index)) : -1;
      
      const { error } = await supabase.from("redirect_contacts").insert({
        link_id: link.id,
        phone: newPhone,
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      toast.success("Atendente adicionado!");
      setNewPhone("");
      fetchContacts();
    } catch (error: any) {
      toast.error("Erro ao adicionar atendente");
    }
  };

  const removeContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("redirect_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Atendente removido!");
      fetchContacts();
    } catch (error: any) {
      toast.error("Erro ao remover atendente");
    }
  };

  const resetQueue = async () => {
    try {
      const { error } = await supabase.rpc("reset_link_queue", {
        p_link_id: link.id,
      });

      if (error) throw error;

      toast.success("Fila resetada!");
    } catch (error: any) {
      toast.error("Erro ao resetar fila");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Link: {link.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">Atendentes</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <div className="space-y-2">
              <Label>Adicionar Atendente (WhatsApp)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="5511999999999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Button onClick={addContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fila de Atendentes ({contacts.length})</Label>
                <Button variant="outline" size="sm" onClick={resetQueue}>
                  Resetar Fila
                </Button>
              </div>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum atendente cadastrado
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{contact.phone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configurações adicionais em breve...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};