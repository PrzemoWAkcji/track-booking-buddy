import { useState, useEffect } from "react";
import { startOfWeek, addWeeks, subWeeks, format, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { ReservationForm } from "@/components/ReservationForm";
import { WeeklySchedule } from "@/components/WeeklySchedule";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Calendar, History, Trash2, FileText } from "lucide-react";
import { Reservation, Contractor, DEFAULT_CONTRACTORS, FacilityType, FACILITY_CONFIGS, TIME_SLOTS } from "@/types/reservation";
import { generateWeeklyPDF } from "@/utils/pdfGenerator";
import { exportWeekToExcel, exportAllWeeksToExcel } from "@/utils/excelExporter";
import { toast } from "sonner";

const STORAGE_KEY = "reservations";
const WEEKLY_ARCHIVE_KEY = "reservations_weekly_archive";

const Index = () => {
  const [facilityType, setFacilityType] = useState<FacilityType>("track-6");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>(DEFAULT_CONTRACTORS);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [isRodoVersion, setIsRodoVersion] = useState(false);
  const [weeklyArchive, setWeeklyArchive] = useState<Array<{ facilityType: FacilityType; weekStart: string; reservations: Reservation[]; savedAt: string }>>([]);
  const [showArchive, setShowArchive] = useState(false);
  
  const facilityConfig = FACILITY_CONFIGS[facilityType];
  
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const reservationsWithDates = parsed.map((res: any) => ({
          ...res,
          date: new Date(res.date)
        }));
        setReservations(reservationsWithDates);
      } catch (error) {
        console.error("Błąd przy ładowaniu rezerwacji:", error);
      }
    }
    
    const storedArchive = localStorage.getItem(WEEKLY_ARCHIVE_KEY);
    if (storedArchive) {
      try {
        const parsed = JSON.parse(storedArchive);
        const archiveWithDates = parsed.map((entry: any) => ({
          facilityType: entry.facilityType,
          weekStart: entry.weekStart,
          savedAt: entry.savedAt,
          reservations: entry.reservations.map((res: any) => ({
            ...res,
            date: new Date(res.date)
          }))
        }));
        setWeeklyArchive(archiveWithDates);
      } catch (error) {
        console.error("Błąd przy ładowaniu archiwum:", error);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations]);
  
  const saveWeekToArchive = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    
    const existingIndex = weeklyArchive.findIndex(
      entry => entry.facilityType === facilityType && entry.weekStart === weekStartStr
    );
    
    const newEntry = {
      facilityType,
      weekStart: weekStartStr,
      reservations: reservations.filter(r => r.facilityType === facilityType),
      savedAt: format(new Date(), "dd.MM.yyyy HH:mm")
    };
    
    let updatedArchive;
    if (existingIndex >= 0) {
      updatedArchive = [...weeklyArchive];
      updatedArchive[existingIndex] = newEntry;
      toast.success("Harmonogram tygodnia został zaktualizowany");
    } else {
      updatedArchive = [newEntry, ...weeklyArchive];
      toast.success("Harmonogram tygodnia został zapisany");
    }
    
    setWeeklyArchive(updatedArchive);
    localStorage.setItem(WEEKLY_ARCHIVE_KEY, JSON.stringify(updatedArchive));
  };

  const loadWeekFromArchive = (entry: typeof weeklyArchive[0]) => {
    const reservationsWithDates = entry.reservations.map(res => ({
      ...res,
      date: new Date(res.date)
    }));
    setReservations(reservationsWithDates);
    const weekStart = new Date(entry.weekStart);
    setCurrentWeek(weekStart);
    setFacilityType(entry.facilityType);
    toast.success(`Załadowano harmonogram z ${format(new Date(entry.weekStart), "dd.MM.yyyy", { locale: pl })}`);
  };

  const handleAddReservations = (newReservations: Omit<Reservation, "id" | "facilityType">[]) => {
    const processedReservations: Omit<Reservation, "id" | "facilityType">[] = [];
    const conflicts: string[] = [];
    
    newReservations.forEach(newRes => {
      const trackCount = (newRes as any).trackCount || newRes.tracks.length;
      
      // If tracks already assigned (e.g., closed stadium), keep them
      if (newRes.tracks.length > 0) {
        processedReservations.push(newRes);
        return;
      }
      
      const existingOnSameDay = reservations.filter(
        r => r.facilityType === facilityType && 
        r.date.toDateString() === newRes.date.toDateString()
      );
      
      // Check each time slot in the new reservation
      const newSlots = TIME_SLOTS.filter(
        slot => slot.start >= newRes.startTime && slot.start < newRes.endTime
      );
      
      // Find available tracks for all time slots
      const availableTracksForAllSlots: number[] = [];
      
      for (let trackNum = 1; trackNum <= facilityConfig.sections.length; trackNum++) {
        let isAvailableInAllSlots = true;
        
        for (const slot of newSlots) {
          const occupiedInSlot = existingOnSameDay.some(existing => 
            slot.start >= existing.startTime && 
            slot.start < existing.endTime && 
            existing.tracks.includes(trackNum)
          );
          
          if (occupiedInSlot) {
            isAvailableInAllSlots = false;
            break;
          }
        }
        
        if (isAvailableInAllSlots) {
          availableTracksForAllSlots.push(trackNum);
        }
        
        // Stop if we have enough tracks
        if (availableTracksForAllSlots.length === trackCount) {
          break;
        }
      }
      
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
    });
    
    if (conflicts.length > 0) {
      toast.error("Nie można dodać rezerwacji", {
        description: conflicts.slice(0, 3).join("\n")
      });
      return;
    }
    
    const reservationsWithIds = processedReservations.map((res) => ({
      ...res,
      id: crypto.randomUUID(),
      facilityType: facilityType,
    }));
    setReservations((prev) => [...prev, ...reservationsWithIds]);
    toast.success(`Dodano ${newReservations.length} rezerwacji`);
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
    setReservations((prev) => prev.filter((res) => res.id !== id));
    toast.success("Rezerwacja została usunięta");
  };

  const handleClearAll = () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie rezerwacje?")) {
      setReservations([]);
      toast.success("Wszystkie rezerwacje zostały usunięte");
    }
  };

  const handleGeneratePDF = () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const filteredReservations = reservations.filter(r => r.facilityType === facilityType);
      
      // Dodajemy więcej logów, aby zdiagnozować problem
      console.log("Generowanie PDF dla:", {
        weekStart,
        facilityType,
        facilityConfig,
        isRodoVersion,
        filteredReservationsCount: filteredReservations.length
      });
      
      // Sprawdzamy, czy mamy jakieś rezerwacje
      if (filteredReservations.length === 0) {
        // Jeśli nie ma rezerwacji, dodajmy testową rezerwację
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
        generateWeeklyPDF([testReservation], weekStart, facilityConfig, isRodoVersion);
      } else {
        generateWeeklyPDF(filteredReservations, weekStart, facilityConfig, isRodoVersion);
      }
      
      toast.success(`PDF ${isRodoVersion ? '(wersja RODO)' : ''} został wygenerowany`);
    } catch (error) {
      toast.error("Błąd podczas generowania PDF");
      console.error("PDF generation error:", error);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

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
            
            <Button
              onClick={handleGeneratePDF}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Download className="mr-2 h-4 w-4" />
              Generuj PDF
            </Button>

            <Button
              onClick={saveWeekToArchive}
              variant="outline"
              title="Zapisz bieżący tydzień do archiwum"
            >
              <Download className="mr-2 h-4 w-4" />
              Zapisz tydzień
            </Button>

            <Button
              onClick={() => setShowArchive(!showArchive)}
              variant="outline"
              title="Przeglądaj wcześniejsze tygodnie"
            >
              <History className="mr-2 h-4 w-4" />
              Archiwum ({weeklyArchive.length})
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

        {/* Weekly Archive */}
        {showArchive && weeklyArchive.length > 0 && (
          <div className="max-w-6xl mx-auto bg-card p-4 rounded-xl shadow-lg border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Archiwum harmonogramów tygodniowych:</h3>
              <Button
                onClick={() => {
                  exportAllWeeksToExcel(weeklyArchive);
                  toast.success("Całe archiwum zostało wyeksportowane");
                }}
                variant="outline"
                size="sm"
                title="Exportuj całe archiwum do jednego pliku"
              >
                <FileText className="mr-2 h-4 w-4" />
                Exportuj wszystko
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyArchive.map((entry, index) => {
                const weekEnd = addDays(new Date(entry.weekStart), 6);
                const dateRange = `${format(new Date(entry.weekStart), "dd.MM")} - ${format(weekEnd, "dd.MM.yyyy")}`;
                const facilityName = FACILITY_CONFIGS[entry.facilityType].name;
                
                return (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-medium">{dateRange}</p>
                        <p className="text-xs text-muted-foreground">{facilityName}</p>
                        <p className="text-xs text-muted-foreground">Zapisano: {entry.savedAt}</p>
                        <p className="text-xs font-medium mt-1">{entry.reservations.length} rezerwacji</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            exportWeekToExcel(entry.weekStart, entry.facilityType, entry.reservations, facilityName);
                            toast.success("Tydzień został wyeksportowany");
                          }}
                          size="sm"
                          variant="outline"
                          title="Exportuj ten tydzień do pliku"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => loadWeekFromArchive(entry)}
                          size="sm"
                          variant="default"
                        >
                          Załaduj
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1 max-h-40 overflow-y-auto border-t pt-3">
                      {entry.reservations.length > 0 ? (
                        entry.reservations.map((res, rIdx) => (
                          <div key={rIdx} className="p-2 bg-background rounded text-muted-foreground">
                            <span className="font-medium">{res.contractor}</span> - {format(res.date, "dd.MM")} {res.startTime}-{res.endTime}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic">Brak rezerwacji</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        <WeeklySchedule
          reservations={reservations.filter(r => r.facilityType === facilityType)}
          weekStart={weekStart}
          onDeleteReservation={handleDeleteReservation}
          facilityConfig={facilityConfig}
        />

        {/* Legend */}
        <div className="bg-card p-6 rounded-xl shadow-lg border">
          <h3 className="font-semibold text-lg mb-4">Legenda kontrahentów:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {contractors.map((contractor) => {
              const colorMap: Record<string, string> = {
                "OKS SKRA": "bg-blue-300 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700",
                "KS CZEMPION": "bg-green-300 dark:bg-green-900/30 border-green-400 dark:border-green-700",
                "AKL": "bg-purple-300 dark:bg-purple-900/30 border-purple-400 dark:border-purple-700",
                "Kamil Żewłakow": "bg-orange-300 dark:bg-orange-900/30 border-orange-400 dark:border-orange-700",
                "SGH": "bg-red-300 dark:bg-red-900/30 border-red-400 dark:border-red-700",
                "Grupa biegowa Aktywna Warszawa": "bg-teal-300 dark:bg-teal-900/30 border-teal-400 dark:border-teal-700",
                "ZabieganeDni": "bg-pink-300 dark:bg-pink-900/30 border-pink-400 dark:border-pink-700",
                "Adidas Runners": "bg-indigo-300 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-700",
                "Sword Athletics Club": "bg-yellow-300 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700",
                "Endless Pain": "bg-cyan-300 dark:bg-cyan-900/30 border-cyan-400 dark:border-cyan-700",
                "Run Club": "bg-lime-300 dark:bg-lime-900/30 border-lime-400 dark:border-lime-700",
              };
              
              const color = colorMap[contractor.name] || "bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600";
              
              return (
                <div
                  key={contractor.id}
                  className={`p-3 rounded-lg border text-sm font-medium ${color}`}
                >
                  {contractor.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
