import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Tag, Check } from "lucide-react";
import { toast } from "sonner";
import { TagBadge } from "./TagBadge";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  linkId: string;
  selectedTags: TagType[];
  onTagsChange: (tags: TagType[]) => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export function TagSelector({ linkId, selectedTags, onTagsChange }: TagSelectorProps) {
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspace && open) {
      fetchTags();
    }
  }, [currentWorkspace, open]);

  const fetchTags = async () => {
    if (!currentWorkspace) return;

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("name");

    if (error) {
      console.error("Error fetching tags:", error);
      return;
    }

    setAllTags(data || []);
  };

  const createTag = async () => {
    if (!currentWorkspace || !newTagName.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .insert({
        workspace_id: currentWorkspace.id,
        name: newTagName.trim(),
        color: newTagColor,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar tag");
      console.error(error);
    } else if (data) {
      setAllTags([...allTags, data]);
      toggleTag(data);
      setNewTagName("");
      toast.success("Tag criada!");
    }
    setLoading(false);
  };

  const toggleTag = async (tag: TagType) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);

    if (isSelected) {
      // Remove tag from link
      const { error } = await supabase
        .from("link_tags")
        .delete()
        .eq("link_id", linkId)
        .eq("tag_id", tag.id);

      if (error) {
        toast.error("Erro ao remover tag");
        return;
      }

      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      // Add tag to link
      const { error } = await supabase.from("link_tags").insert({
        link_id: linkId,
        tag_id: tag.id,
      });

      if (error) {
        toast.error("Erro ao adicionar tag");
        return;
      }

      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1">
          <Tag className="h-3 w-3" />
          <Plus className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Tags</div>

          {/* Existing tags */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {allTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma tag criada</p>
            ) : (
              allTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-accent transition-colors text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-sm">{tag.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new tag */}
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs text-muted-foreground">Criar nova tag</div>
            <Input
              placeholder="Nome da tag"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    newTagColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              size="sm"
              className="w-full h-8"
              onClick={createTag}
              disabled={!newTagName.trim() || loading}
            >
              <Plus className="h-3 w-3 mr-1" />
              Criar Tag
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
