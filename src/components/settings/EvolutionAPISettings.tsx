import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Eye, EyeOff, CheckCircle, XCircle, Save, Loader2, Info } from "lucide-react";
import {
  getEvolutionAPISettings,
  updateEvolutionAPISettings,
  testEvolutionAPIConnection,
  validateEvolutionAPISettings,
  maskApiKey,
  type EvolutionAPISettings as EvolutionSettings,
} from "@/lib/api/whatsapp";

export function EvolutionAPISettings() {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const [settings, setSettings] = useState<EvolutionSettings>({
    evolution_api_url: "",
    evolution_api_key: "",
    evolution_instance_name: "",
  });

  const [originalApiKey, setOriginalApiKey] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentWorkspace) return;

      setLoading(true);
      try {
        const data = await getEvolutionAPISettings(currentWorkspace.id);
        if (data) {
          setSettings(data);
          setOriginalApiKey(data.evolution_api_key);
        }
      } catch (error) {
        console.error("Error fetching Evolution API settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [currentWorkspace]);

  const handleTestConnection = async () => {
    const validation = validateEvolutionAPISettings(settings);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testEvolutionAPIConnection(settings);
      setTestResult(result);

      if (result.success) {
        toast.success("Conexão bem-sucedida!");
      } else {
        toast.error(result.error || "Falha na conexão");
      }
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

    const validation = validateEvolutionAPISettings(settings);
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setSaving(true);

    try {
      await updateEvolutionAPISettings(currentWorkspace.id, settings);
      setOriginalApiKey(settings.evolution_api_key);
      toast.success("Configurações salvas!");
    } catch (error) {
      console.error("Error saving Evolution API settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const getWebhookUrl = () => {
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
          Integração WhatsApp (Evolution API)
        </CardTitle>
        <CardDescription>
          Configure a integração com a Evolution API para capturar mensagens do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evolution_api_url">URL da Evolution API</Label>
            <Input
              id="evolution_api_url"
              placeholder="https://sua-api.com"
              value={settings.evolution_api_url}
              onChange={(e) =>
                setSettings({ ...settings, evolution_api_url: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution_api_key">API Key</Label>
            <div className="relative">
              <Input
                id="evolution_api_key"
                type={showApiKey ? "text" : "password"}
                placeholder="Sua API Key"
                value={showApiKey ? settings.evolution_api_key : maskApiKey(settings.evolution_api_key)}
                onChange={(e) =>
                  setSettings({ ...settings, evolution_api_key: e.target.value })
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution_instance_name">Nome da Instância</Label>
            <Input
              id="evolution_instance_name"
              placeholder="minha-instancia"
              value={settings.evolution_instance_name}
              onChange={(e) =>
                setSettings({ ...settings, evolution_instance_name: e.target.value })
              }
            />
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.success
                ? "Conexão com a Evolution API estabelecida com sucesso!"
                : testResult.error || "Falha na conexão"}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || saving}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Testar Conexão
          </Button>
          <Button onClick={handleSave} disabled={saving || testing}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>

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
