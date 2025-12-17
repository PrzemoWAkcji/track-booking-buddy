import { useState, useEffect } from "react";
import { startOfWeek, addWeeks, subWeeks, format, addDays, endOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { ReservationForm } from "@/components/ReservationForm";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { ContractorColorsPanel } from "@/components/ContractorColorsPanel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Calendar, Trash2, Undo, Palette } from "lucide-react";
import { Reservation, Contractor, DEFAULT_CONTRACTORS, FacilityType, FACILITY_CONFIGS, TIME_SLOTS } from "@/types/reservation";
import { generateWeeklyPDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { useReservations } from "@/hooks/useReservations";
import { useContractors } from "@/hooks/useContractors";

const Index = () => {
  // Use Supabase-backed hooks
  const { 
    reservations, 
    isLoading, 
    addReservation, 
    deleteReservation, 
    deleteAllReservations,
    undoReorganization,
    isUndoingReorganization,
    getAvailableTracks,
    checkConflicts,
    hasUndoSnapshot
  } = useReservations();

  const {
    contractors: dbContractors,
    getColorMap,
    isLoading: isContractorsLoading
  } = useContractors();

  const [facilityType, setFacilityType] = useState<FacilityType>("track-6");
  const [contractors, setContractors] = useState<Contractor[]>(DEFAULT_CONTRACTORS);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [isRodoVersion, setIsRodoVersion] = useState(false);
  const [showColorsPanel, setShowColorsPanel] = useState(false);
  const [maskedTracks, setMaskedTracks] = useState<number[]>([]);
  
  const facilityConfig = FACILITY_CONFIGS[facilityType];
  
  const handleAddReservations = async (newReservations: Omit<Reservation, "id" | "facilityType">[]) => {
    const processedReservations: Omit<Reservation, "id" | "facilityType">[] = [];
    const conflicts: string[] = [];
    
    for (const newRes of newReservations) {
      const trackCount = (newRes as any).trackCount || newRes.tracks.length;
      
      // If tracks already assigned (e.g., closed stadium), keep them
      if (newRes.tracks.length > 0) {
        processedReservations.push(newRes);
        continue;
      }
      
      // Use the hook's getAvailableTracks function
      const availableTracksForAllSlots = await getAvailableTracks(
        facilityType,
        newRes.date,
        newRes.startTime,
        newRes.endTime,
        trackCount
      );
      
      // Check if we have enough available tracks
      if (availableTracksForAllSlots.length < trackCount) {
        conflicts.push(
          `${format(newRes.date, "dd.MM.yyyy", { locale: pl })} ${newRes.startTime}-${newRes.endTime}: ` +
          `brak ${trackCount} wolnych ${facilityConfig.sectionLabel.toLowerCase()}ów (dostępne: ${availableTracksForAllSlots.length})`
        );
      } else {
        processedReservations.push({
          ...newRes,
          tracks: availableTracksForAllSlots
        });
      }
    }
    
    if (conflicts.length > 0) {
      toast.error("Nie można dodać rezerwacji", {
        description: conflicts.slice(0, 3).join("\n")
      });
      return;
    }
    
    // Add reservations to Supabase
    for (const res of processedReservations) {
      addReservation.mutate({
        ...res,
        facilityType: facilityType,
      });
    }
  };

  const handleAddContractor = (name: string, category: string) => {
    const newContractor: Contractor = {
      id: crypto.randomUUID(),
      name,
      category,
    };
    setContractors((prev) => [...prev, newContractor]);
    toast.success("Kontrahent został dodany");
  };

  const handleDeleteReservation = (id: string) => {
    deleteReservation.mutate(id);
  };

  const handleClearAll = () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie rezerwacje?")) {
      deleteAllReservations.mutate();
    }
  };

  const handleGeneratePDF = () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const filteredReservations = reservations.filter(r => r.facilityType === facilityType);
      const colorMap = getColorMap();
      
      console.log("Generowanie PDF dla:", {
        weekStart,
        facilityType,
        facilityConfig,
        isRodoVersion,
        filteredReservationsCount: filteredReservations.length,
        maskedTracks,
        colorMap
      });
      
      if (filteredReservations.length === 0) {
        const testReservation: Reservation = {
          id: "test-id",
          contractor: "Test Kontrahent",
          date: new Date(weekStart),
          startTime: "10:00",
          endTime: "11:00",
          tracks: [1, 2],
          facilityType: facilityType,
          category: "Trening sportowy"
        };
        
        console.log("Dodajemy testową rezerwację:", testReservation);
        generateWeeklyPDF([testReservation], weekStart, facilityConfig, isRodoVersion, colorMap, maskedTracks);
      } else {
        generateWeeklyPDF(filteredReservations, weekStart, facilityConfig, isRodoVersion, colorMap, maskedTracks);
      }
      
      toast.success(`PDF ${isRodoVersion ? '(wersja RODO)' : ''} został wygenerowany`);
    } catch (error) {
      toast.error("Błąd podczas generowania PDF");
      console.error("PDF generation error:", error);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Ładowanie rezerwacji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            System Rezerwacji Torów
          </h1>
          <p className="text-muted-foreground text-lg">
            Ośrodek Nowa Skra - {facilityConfig.name}
          </p>
        </div>

        {/* Facility Type Selector */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card p-4 rounded-xl shadow-lg border space-y-2">
            <label className="text-sm font-semibold">Typ obiektu:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.values(FACILITY_CONFIGS).map((config) => (
                <Button
                  key={config.id}
                  variant={facilityType === config.id ? "default" : "outline"}
                  onClick={() => setFacilityType(config.id)}
                  className="w-full"
                >
                  {config.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Reservation Form */}
        <div className="max-w-3xl mx-auto">
          <ReservationForm
            contractors={contractors}
            onAddReservation={handleAddReservations}
            onAddContractor={handleAddContractor}
            facilityConfig={facilityConfig}
          />
        </div>

        {/* Schedule Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl shadow-lg border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {format(weekStart, "dd MMMM yyyy", { locale: pl })}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rodo-version"
                checked={isRodoVersion}
                onChange={(e) => setIsRodoVersion(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
              />
              <label htmlFor="rodo-version" className="text-sm font-medium cursor-pointer">
                Wersja RODO (bez nazw)
              </label>
            </div>

            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-xs text-muted-foreground">Zasłoń tory:</span>
              <div className="flex gap-1">
                {facilityConfig.sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => {
                      setMaskedTracks(prev =>
                        prev.includes(section)
                          ? prev.filter(t => t !== section)
                          : [...prev, section]
                      );
                    }}
                    className={`w-8 h-8 rounded border text-xs font-semibold transition-colors ${
                      maskedTracks.includes(section)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-border hover:bg-muted/80'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleGeneratePDF}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Download className="mr-2 h-4 w-4" />
              Generuj PDF
            </Button>

            <Button
              onClick={() => setShowColorsPanel(!showColorsPanel)}
              variant={showColorsPanel ? "default" : "outline"}
              title="Zarządzaj kolorami wykonawców"
            >
              <Palette className="mr-2 h-4 w-4" />
              Kolory
            </Button>

            <Button
              onClick={() => undoReorganization.mutate(facilityType)}
              variant="outline"
              size="sm"
              title="Cofnij ostatnią reorganizację torów"
              disabled={!hasUndoSnapshot(facilityType) || isUndoingReorganization}
            >
              <Undo className="mr-2 h-4 w-4" />
              {isUndoingReorganization ? "Cofanie..." : "Cofnij zmiany"}
            </Button>

            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
              title="Wyczyść wszystko"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contractor Colors Management Panel */}
        {showColorsPanel && (
          <div className="max-w-6xl mx-auto">
            <ContractorColorsPanel reservations={reservations.filter(r => r.facilityType === facilityType)} />
          </div>
        )}

        {/* Weekly Schedule */}
        <WeeklySchedule
          reservations={reservations.filter(r => r.facilityType === facilityType)}
          weekStart={weekStart}
          onDeleteReservation={handleDeleteReservation}
          facilityConfig={facilityConfig}
          contractorColors={getColorMap()}
        />
      </div>
    </div>
  );
};

export default Index;
