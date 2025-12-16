/**
 * ContractorColorsPanel Component
 * Allows users to manage contractor colors dynamically
 */

import { useState } from "react"
import { useContractors } from "@/hooks/useContractors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, X, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Reservation } from "@/types/reservation"

interface ContractorColorsPanelProps {
  reservations?: Reservation[]
}

// Predefined color palette with Tailwind colors (hex values)
const COLOR_PALETTE = [
  { name: "Niebieski", hex: "#93c5fd" },      // blue-300
  { name: "Zielony", hex: "#86efac" },        // green-300
  { name: "Fioletowy", hex: "#d8b4fe" },      // purple-300
  { name: "Pomarańczowy", hex: "#fdba74" },   // orange-300
  { name: "Czerwony", hex: "#fca5a5" },       // red-300
  { name: "Turkusowy", hex: "#5eead4" },      // teal-300
  { name: "Różowy", hex: "#f9a8d4" },         // pink-300
  { name: "Indygo", hex: "#a5b4fc" },         // indigo-300
  { name: "Żółty", hex: "#fde047" },          // yellow-300
  { name: "Cyjan", hex: "#67e8f9" },          // cyan-300
  { name: "Limonkowy", hex: "#bef264" },      // lime-300
  { name: "Szmaragdowy", hex: "#6ee7b7" },    // emerald-300
  { name: "Fiolet", hex: "#c4b5fd" },         // violet-300
  { name: "Róża", hex: "#fda4af" },           // rose-300
  { name: "Bursztynowy", hex: "#fbbf24" },    // amber-400
  { name: "Szary", hex: "#d1d5db" },          // gray-300
]

export function ContractorColorsPanel({ reservations = [] }: ContractorColorsPanelProps) {
  const { contractors, isLoading, updateContractorColor, isUpdating } = useContractors()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>("")

  const contractorsWithReservations = new Set(
    reservations
      .filter(r => r.contractor && r.contractor !== "ZAMKNIĘTY" && r.contractor !== "Brak rezerwacji")
      .map(r => r.contractor)
  )

  const handleStartEdit = (contractorId: string, currentColor: string) => {
    setEditingId(contractorId)
    setSelectedColor(currentColor)
  }

  const handleSaveColor = async (contractorId: string) => {
    if (selectedColor) {
      await updateContractorColor.mutateAsync({ id: contractorId, color: selectedColor })
      setEditingId(null)
      setSelectedColor("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setSelectedColor("")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Zarządzanie kolorami wykonawców
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    )
  }

  const editableContractors = contractors.filter(
    c => c.name !== "Brak rezerwacji" && 
         c.name !== "ZAMKNIĘTY" && 
         contractorsWithReservations.has(c.name)
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Zarządzanie kolorami wykonawców
        </CardTitle>
        <CardDescription>
          Przypisz kolory do każdego wykonawcy. Zmiany będą widoczne w harmonogramie i PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {editableContractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Brak wykonawców do zarządzania. Dodaj wykonawców przez formularz rezerwacji.
              </p>
            ) : (
              editableContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg border-2 shadow-sm"
                      style={{ backgroundColor: contractor.color }}
                      title={contractor.color}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{contractor.name}</p>
                      <p className="text-sm text-muted-foreground">{contractor.category}</p>
                    </div>
                  </div>

                  {editingId === contractor.id ? (
                    <div className="flex flex-col gap-3 ml-4">
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color.hex}
                            onClick={() => setSelectedColor(color.hex)}
                            className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
                              selectedColor === color.hex
                                ? "border-primary ring-2 ring-primary scale-110"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveColor(contractor.id)}
                          disabled={!selectedColor || isUpdating}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Zapisz
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Anuluj
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`custom-color-${contractor.id}`} className="text-xs">
                          Lub wybierz własny:
                        </Label>
                        <Input
                          id={`custom-color-${contractor.id}`}
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-20 h-8"
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(contractor.id, contractor.color)}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Zmień kolor
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}