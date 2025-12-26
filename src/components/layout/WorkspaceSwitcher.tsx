import { ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-2 h-auto py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-1 flex-col items-start text-left">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {currentWorkspace?.name || "Selecionar"}
              </span>
              <span className="text-xs text-muted-foreground">Workspace</span>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px]" align="start">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setCurrentWorkspace(workspace)}
              className={currentWorkspace?.id === workspace.id ? "bg-accent" : ""}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate">{workspace.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
