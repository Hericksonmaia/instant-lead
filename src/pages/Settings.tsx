import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, Settings as SettingsIcon, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsContent() {
  const { currentWorkspace, refetch } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    company_name: "",
  });

  // Workspace state
  const [workspace, setWorkspace] = useState({
    name: "",
    facebook_pixel_id: "",
    facebook_access_token: "",
    timezone: "America/Sao_Paulo",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          company_name: profileData.company_name || "",
        });
      }

      // Fetch workspace
      if (currentWorkspace) {
        setWorkspace({
          name: currentWorkspace.name || "",
          facebook_pixel_id: currentWorkspace.facebook_pixel_id || "",
          facebook_access_token: currentWorkspace.facebook_access_token || "",
          timezone: currentWorkspace.timezone || "America/Sao_Paulo",
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [currentWorkspace]);

  const saveProfile = async () => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        company_name: profile.company_name,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
      console.error(error);
    } else {
      toast.success("Perfil atualizado!");
    }

    setSaving(false);
  };

  const saveWorkspace = async () => {
    if (!currentWorkspace) return;

    setSaving(true);

    const { error } = await supabase
      .from("workspaces")
      .update({
        name: workspace.name,
        facebook_pixel_id: workspace.facebook_pixel_id || null,
        facebook_access_token: workspace.facebook_access_token || null,
        timezone: workspace.timezone,
      })
      .eq("id", currentWorkspace.id);

    if (error) {
      toast.error("Erro ao salvar workspace");
      console.error(error);
    } else {
      toast.success("Workspace atualizado!");
      await refetch();
    }

    setSaving(false);
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="workspace" className="gap-2">
          <Building2 className="h-4 w-4" />
          Workspace
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Perfil
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Empresa</Label>
                  <Input
                    id="company_name"
                    value={profile.company_name}
                    onChange={(e) =>
                      setProfile({ ...profile, company_name: e.target.value })
                    }
                    placeholder="Nome da empresa"
                  />
                </div>
                <Button onClick={saveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Perfil"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="workspace">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Configurações do Workspace
            </CardTitle>
            <CardDescription>
              Configure o workspace "{currentWorkspace?.name}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="workspace_name">Nome do Workspace</Label>
                  <Input
                    id="workspace_name"
                    value={workspace.name}
                    onChange={(e) =>
                      setWorkspace({ ...workspace, name: e.target.value })
                    }
                    placeholder="Nome do workspace"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pixel_id">Facebook Pixel ID</Label>
                  <Input
                    id="pixel_id"
                    value={workspace.facebook_pixel_id}
                    onChange={(e) =>
                      setWorkspace({ ...workspace, facebook_pixel_id: e.target.value })
                    }
                    placeholder="Ex: 1234567890123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access_token">Facebook Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    value={workspace.facebook_access_token}
                    onChange={(e) =>
                      setWorkspace({ ...workspace, facebook_access_token: e.target.value })
                    }
                    placeholder="Token de acesso da Conversions API"
                  />
                </div>
                <Button onClick={saveWorkspace} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Workspace"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

const Settings = () => {
  return (
    <DashboardLayout
      title="Configurações"
      description="Gerencie seu perfil e workspace"
    >
      <SettingsContent />
    </DashboardLayout>
  );
};

export default Settings;
