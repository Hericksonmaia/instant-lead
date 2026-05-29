import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Exclude sensitive credential columns from the client-facing Workspace type
type Workspace = Omit<
  Tables<"workspaces">,
  "facebook_access_token" | "evolution_api_key" | "evolution_api_url" | "evolution_instance_name"
>;

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    // Exclude sensitive credentials (facebook_access_token, evolution_api_key, etc.)
    // Those are fetched server-side or via dedicated screens with explicit user action.
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, owner_id, name, timezone, facebook_pixel_id, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching workspaces:", error);
      return;
    }

    setWorkspaces(data || []);

    // Set first workspace as current if none selected
    if (data && data.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      const savedWorkspace = data.find((w) => w.id === savedWorkspaceId);
      setCurrentWorkspaceState(savedWorkspace || data[0]);
    }

    setLoading(false);
  };

  const setCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem("currentWorkspaceId", workspace.id);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        refetch: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
