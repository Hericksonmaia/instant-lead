import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Eye, EyeOff, CheckCircle, XCircle, Save, Loader2, Info, Plus, Trash2, Edit2, X } from "lucide-react";
import {
  testEvolutionAPIConnection,
  validateEvolutionAPISettings,
  maskApiKey,
  type EvolutionAPISettings as EvolutionSettings,
} from "@/lib/api/whatsapp";

interface EvolutionInstance {
  id: string;
  workspace_id: string;
  instance_name: string;
  api_url: string;
  api_key: string;
  created_at: string;
}

export function EvolutionAPISettings() {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const [form, setForm] = useState<EvolutionSettings>({
    evolution_api_url: "",
    evolution_api_key: "",
    evolution_instance_name: "",
  });

  useEffect(() => {
    if (currentWorkspace) fetchInstances();
  }, [currentWorkspace]);

  const fetchInstances = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("evolution_instances" as any)
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at");

    if (error) {
      console.error("Error fetching instances:", error);
    } else {
      setInstances((data as any[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ evolution_api_url: "", evolution_api_key: "", evolution_instance_name: "" });
    setEditingId(null);
    setShowForm(false);
    setTestResult(null);
    setShowApiKey(false);
  };

  const startEdit = (instance: EvolutionInstance) => {
    setForm({
      evolution_api_url: instance.api_url,
      evolution_api_key: instance.api_key,
      evolution_instance_name: instance.instance_name,
    });
    setEditingId(instance.id);
    setShowForm(true);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const validation = validateEvolutionAPISettings(form);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testEvolutionAPIConnection(form);
      setTestResult(result);
      toast[result.success ? "success" : "error"](result.success ? "Conexão bem-sucedida!" : result.error || "Falha na conexão");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao testar conexão";
      setTestResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;
    const validation = validateEvolutionAPISettings(form);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await (supabase.from("evolution_instances" as any) as any)
          .update({
            api_url: form.evolution_api_url,
            api_key: form.evolution_api_key,
            instance_name: form.evolution_instance_name,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("evolution_instances" as any) as any)
          .insert({
            workspace_id: currentWorkspace.id,
            api_url: form.evolution_api_url,
            api_key: form.evolution_api_key,
            instance_name: form.evolution_instance_name,
          });
        if (error) throw error;
      }
      toast.success(editingId ? "Instância atualizada!" : "Instância adicionada!");
      resetForm();
      fetchInstances();
    } catch (error) {
      console.error("Error saving instance:", error);
      toast.error("Erro ao salvar instância");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase.from("evolution_instances" as any) as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Instância removida!");
      fetchInstances();
    } catch (error) {
      toast.error("Erro ao remover instância");
    }
  };

  const getWebhookUrl = (instanceId?: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'shifwuxxsaussklbgadr';
    return `https://${projectId}.supabase.co/functions/v1/evolution-webhook?workspace_id=${currentWorkspace?.id || ''}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Instâncias WhatsApp (Evolution API)
        </CardTitle>
        <CardDescription>
          Configure múltiplas instâncias da Evolution API para capturar mensagens do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instances List */}
        {instances.length > 0 && (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{instance.instance_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{instance.api_url}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(instance)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(instance.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {instances.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma instância configurada</p>
        )}

        {/* Add/Edit Form */}
        {showForm ? (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{editingId ? "Editar Instância" : "Nova Instância"}</h4>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>URL da Evolution API</Label>
              <Input
                placeholder="https://sua-api.com"
                value={form.evolution_api_url}
                onChange={(e) => setForm({ ...form, evolution_api_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="Sua API Key"
                  value={showApiKey ? form.evolution_api_key : maskApiKey(form.evolution_api_key)}
                  onChange={(e) => setForm({ ...form, evolution_api_key: e.target.value })}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Instância</Label>
              <Input
                placeholder="minha-instancia"
                value={form.evolution_instance_name}
                onChange={(e) => setForm({ ...form, evolution_instance_name: e.target.value })}
              />
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  {testResult.success ? "Conexão estabelecida com sucesso!" : testResult.error || "Falha na conexão"}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleTestConnection} disabled={testing || saving}>
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Testar
              </Button>
              <Button onClick={handleSave} disabled={saving || testing}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Instância
          </Button>
        )}

        {/* Webhook Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-medium">Configuração do Webhook:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Acesse o painel da Evolution API</li>
              <li>Configure o webhook URL para:</li>
            </ol>
            <code className="block bg-muted px-3 py-2 rounded text-xs break-all mt-2">
              {getWebhookUrl()}
            </code>
            <ol className="list-decimal list-inside space-y-1 text-sm" start={3}>
              <li>Ative o evento <code className="bg-muted px-1 rounded">MESSAGES_UPSERT</code></li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
