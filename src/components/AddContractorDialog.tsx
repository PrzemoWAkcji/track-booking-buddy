import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Contractor } from "@/types/reservation";

interface AddContractorDialogProps {
  onAddContractor: (name: string, category: string) => void;
}

export const AddContractorDialog = ({ onAddContractor }: AddContractorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Trening sportowy");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddContractor(name.trim(), category);
      setName("");
      setCategory("Trening sportowy");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj nowego
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego kontrahenta</DialogTitle>
          <DialogDescription>
            Wpisz nazwę nowego kontrahenta poniżej.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nazwa kontrahenta</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Nowy Klub Sportowy"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Grupa biegowa">Grupa biegowa</SelectItem>
                <SelectItem value="Trening sportowy">Trening sportowy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Dodaj
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
