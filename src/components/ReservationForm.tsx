import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Reservation, TIME_SLOTS, WEEKDAYS, Contractor, FacilityConfig } from "@/types/reservation";
import { Checkbox } from "@/components/ui/checkbox";
import { AddContractorDialog } from "./AddContractorDialog";
import { Textarea } from "@/components/ui/textarea";

interface WeekdayConfig {
  dayValue: number;
  startTime: string;
  endTime: string;
  trackCount: number; // Changed from tracks array to count
}

interface ReservationFormProps {
  contractors: Contractor[];
  onAddReservation: (reservations: Omit<Reservation, "id" | "facilityType">[]) => void;
  onAddContractor: (name: string, category: string) => void;
  facilityConfig: FacilityConfig;
}

export const ReservationForm = ({ contractors, onAddReservation, onAddContractor, facilityConfig }: ReservationFormProps) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [contractor, setContractor] = useState<string>("");
  const [category, setCategory] = useState<string>("Trening sportowy");
  const [weekdayConfigs, setWeekdayConfigs] = useState<WeekdayConfig[]>([]);
  const [isClosedStadium, setIsClosedStadium] = useState(false);
  const [closedReason, setClosedReason] = useState<string>("");

  const showWeekdaySelection = dateFrom && dateTo && !isSameDay(dateFrom, dateTo);

  // Automatically set category when contractor changes
  useEffect(() => {
    if (contractor) {
      const selectedContractor = contractors.find(c => c.name === contractor);
      if (selectedContractor?.category) {
        setCategory(selectedContractor.category);
      }
    }
  }, [contractor, contractors]);

  const addWeekdayConfig = (dayValue: number) => {
    setWeekdayConfigs(prev => [...prev, {
      dayValue,
      startTime: "",
      endTime: "",
      trackCount: 0
    }]);
  };

  const removeWeekdayConfig = (index: number) => {
    setWeekdayConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const updateWeekdayConfig = (index: number, updates: Partial<WeekdayConfig>) => {
    setWeekdayConfigs(prev => prev.map((config, i) => 
      i === index ? { ...config, ...updates } : config
    ));
  };

  const updateTrackCount = (configIndex: number, count: number) => {
    setWeekdayConfigs(prev => prev.map((config, i) => 
      i === configIndex ? { ...config, trackCount: count } : config
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isClosedStadium) {
      // For closed stadium, we need dates and at least one weekday config
      if (!dateFrom || !dateTo || weekdayConfigs.length === 0) {
        return;
      }
      
      // Validate configs have required fields (no need to check tracks - will use all)
      const isValid = weekdayConfigs.every(config => 
        config.startTime && config.endTime
      );
      
      if (!isValid) {
        return;
      }
      
      // Generate all dates in range
      const allDates = eachDayOfInterval({ start: dateFrom, end: dateTo });
      
      // Create "closed" reservations for each weekday config - always use ALL tracks
      const newReservations: Omit<Reservation, "id" | "facilityType">[] = [];
      
      weekdayConfigs.forEach(config => {
        const filteredDates = allDates.filter(date => getDay(date) === config.dayValue);
        
        filteredDates.forEach(date => {
          newReservations.push({
            contractor: closedReason.trim() || "ZAMKNIĘTY",
            date,
            startTime: config.startTime,
            endTime: config.endTime,
            tracks: facilityConfig.sections, // Use all sections when closed
            isClosed: true,
            closedReason: closedReason.trim() || undefined,
          });
        });
      });
      
      onAddReservation(newReservations);
      
      // Reset form
      setDateFrom(undefined);
      setDateTo(undefined);
      setContractor("");
      setWeekdayConfigs([]);
      setIsClosedStadium(false);
      setClosedReason("");
      return;
    }
    
    // Regular reservation logic
    if (!dateFrom || !dateTo || !contractor || weekdayConfigs.length === 0) {
      return;
    }

    // Validate all weekday configs
    const isValid = weekdayConfigs.every(config => 
      config.startTime && config.endTime && config.trackCount > 0
    );
    
    if (!isValid) {
      return;
    }

    // Generate all dates in range
    const allDates = eachDayOfInterval({ start: dateFrom, end: dateTo });
    
    // Create reservations for each weekday config
    // Note: tracks will be assigned automatically by parent component
    const newReservations: Omit<Reservation, "id" | "facilityType">[] = [];
    
    weekdayConfigs.forEach(config => {
      const filteredDates = allDates.filter(date => getDay(date) === config.dayValue);
      
      filteredDates.forEach(date => {
        newReservations.push({
          contractor,
          date,
          startTime: config.startTime,
          endTime: config.endTime,
          tracks: [], // Will be filled by parent with available tracks
          trackCount: config.trackCount, // Add track count for parent to use
          category, // Add category to reservation
        } as any);
      });
    });

    onAddReservation(newReservations);

    // Reset form
    setDateFrom(undefined);
    setDateTo(undefined);
    setContractor("");
    setCategory("Trening sportowy");
    setWeekdayConfigs([]);
  };

  const availableWeekdays = WEEKDAYS.filter(
    day => !weekdayConfigs.some(config => config.dayValue === day.value)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-xl shadow-lg border">
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
        <Checkbox
          id="closed-stadium"
          checked={isClosedStadium}
          onCheckedChange={(checked) => {
            setIsClosedStadium(checked as boolean);
            if (checked) {
              setContractor("");
            } else {
              setClosedReason("");
            }
          }}
        />
        <Label
          htmlFor="closed-stadium"
          className="cursor-pointer font-semibold text-destructive"
        >
          Stadion zamknięty (niedostępny)
        </Label>
      </div>

      {isClosedStadium && (
        <div className="space-y-2">
          <Label htmlFor="closed-reason">
            Opis zamknięcia (opcjonalnie)
          </Label>
          <Textarea
            id="closed-reason"
            value={closedReason}
            onChange={(e) => setClosedReason(e.target.value)}
            placeholder="Zostaw puste dla domyślnego tekstu 'ZAMKNIĘTY'"
            className="min-h-[60px]"
          />
          <p className="text-xs text-muted-foreground">
            Jeśli nie wpiszesz tekstu, automatycznie użyty zostanie: "ZAMKNIĘTY"
          </p>
        </div>
      )}

      {!isClosedStadium && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="contractor">Kontrahent</Label>
              <AddContractorDialog onAddContractor={onAddContractor} />
            </div>
            <Select value={contractor} onValueChange={setContractor}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kontrahenta" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {contractors.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name} {c.category && `(${c.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data od</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP", { locale: pl }) : "Wybierz datę"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data do</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP", { locale: pl }) : "Wybierz datę"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                disabled={(date) => dateFrom ? date < dateFrom : false}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showWeekdaySelection && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Konfiguracja dni tygodnia</Label>
              {availableWeekdays.length > 0 && (
                <Select onValueChange={(value) => addWeekdayConfig(parseInt(value))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Dodaj dzień..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {availableWeekdays.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {weekdayConfigs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Dodaj dni tygodnia, w które kontrahent ma rezerwacje
              </p>
            )}

            {weekdayConfigs.map((config, index) => {
              const dayLabel = WEEKDAYS.find(d => d.value === config.dayValue)?.label || "";
              const availableEndTimes = TIME_SLOTS.filter(
                (slot) => slot.start >= config.startTime
              ).map((slot) => slot.end);

              return (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{dayLabel}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWeekdayConfig(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Godzina od</Label>
                      <Select 
                        value={config.startTime} 
                        onValueChange={(value) => updateWeekdayConfig(index, { startTime: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Od" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot.start} value={slot.start}>
                              {slot.start}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Godzina do</Label>
                      <Select 
                        value={config.endTime} 
                        onValueChange={(value) => updateWeekdayConfig(index, { endTime: value })}
                        disabled={!config.startTime}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Do" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {availableEndTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!isClosedStadium && (
                    <div className="space-y-2">
                      <Label>Ile {facilityConfig.sectionLabel.toLowerCase()}ów potrzebujesz?</Label>
                      <Select 
                        value={config.trackCount.toString()} 
                        onValueChange={(value) => updateTrackCount(index, parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz liczbę" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {facilityConfig.sections.map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {facilityConfig.sectionLabel.toLowerCase()}{num > 1 ? (facilityConfig.sectionLabel === 'Tor' ? 'y' : 'wy') : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        System automatycznie przydzieli pierwsze dostępne {facilityConfig.sectionLabel.toLowerCase()}y od 1
                      </p>
                    </div>
                  )}
                  
                  {isClosedStadium && (
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                      <p className="text-sm font-medium text-center">
                        Cały stadion będzie zamknięty
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!showWeekdaySelection && dateFrom && dateTo && isSameDay(dateFrom, dateTo) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Godzina od</Label>
              <Select 
                value={weekdayConfigs[0]?.startTime || ""} 
                onValueChange={(value) => {
                  if (weekdayConfigs.length === 0) {
                    setWeekdayConfigs([{
                      dayValue: getDay(dateFrom),
                      startTime: value,
                      endTime: "",
                      trackCount: 0
                    }]);
                  } else {
                    updateWeekdayConfig(0, { startTime: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Od" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.start} value={slot.start}>
                      {slot.start}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Godzina do</Label>
              <Select 
                value={weekdayConfigs[0]?.endTime || ""} 
                onValueChange={(value) => updateWeekdayConfig(0, { endTime: value })}
                disabled={!weekdayConfigs[0]?.startTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Do" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {TIME_SLOTS.filter(slot => slot.start >= (weekdayConfigs[0]?.startTime || "")).map((slot) => (
                    <SelectItem key={slot.end} value={slot.end}>
                      {slot.end}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isClosedStadium && (
            <div className="space-y-2">
              <Label>Ile {facilityConfig.sectionLabel.toLowerCase()}ów potrzebujesz?</Label>
              <Select 
                value={weekdayConfigs[0]?.trackCount?.toString() || ""} 
                onValueChange={(value) => {
                  if (weekdayConfigs.length === 0) {
                    setWeekdayConfigs([{
                      dayValue: getDay(dateFrom),
                      startTime: "",
                      endTime: "",
                      trackCount: parseInt(value)
                    }]);
                  } else {
                    updateTrackCount(0, parseInt(value));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz liczbę" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {facilityConfig.sections.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {facilityConfig.sectionLabel.toLowerCase()}{num > 1 ? (facilityConfig.sectionLabel === 'Tor' ? 'y' : 'wy') : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                System automatycznie przydzieli pierwsze dostępne {facilityConfig.sectionLabel.toLowerCase()}y od 1
              </p>
            </div>
          )}
          
          {isClosedStadium && (
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-sm font-medium text-center">
                Cały stadion będzie zamknięty
              </p>
            </div>
          )}
        </>
      )}

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        <Plus className="mr-2 h-4 w-4" />
        {isClosedStadium ? "Oznacz jako zamknięty" : "Dodaj rezerwacje"}
      </Button>
    </form>
  );
};
