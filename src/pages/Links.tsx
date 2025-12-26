import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LinkList } from "@/components/dashboard/LinkList";
import { CreateLinkDialog } from "@/components/dashboard/CreateLinkDialog";

const Links = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <DashboardLayout
      title="Links"
      description="Gerencie seus links de redirecionamento"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Link
          </Button>
        </div>

        <LinkList />
      </div>

      <CreateLinkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Links;
