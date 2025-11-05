import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Reservation, TIME_SLOTS, FacilityConfig } from "@/types/reservation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyScheduleProps {
  reservations: Reservation[];
  weekStart: Date;
  onDeleteReservation: (id: string) => void;
  facilityConfig: FacilityConfig;
  contractorColors?: Record<string, string>; // hex color map from database
}

export const WeeklySchedule = ({
  reservations,
  weekStart,
  onDeleteReservation,
  facilityConfig,
  contractorColors = {},
}: WeeklyScheduleProps) => {
  const weekDays = useMemo(() => {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekStart]);

  const getReservationsForCell = (day: Date, timeSlot: string, track: number) => {
    return reservations.filter((res) => {
      if (!isSameDay(res.date, day)) return false;
      if (!res.tracks.includes(track)) return false;

      const slotStart = timeSlot;
      return slotStart >= res.startTime && slotStart < res.endTime;
    });
  };

  // Helper to get contractor color style from hex color
  const getContractorColorStyle = (contractorName: string): React.CSSProperties => {
    const hexColor = contractorColors[contractorName];
    if (hexColor) {
      return {
        backgroundColor: hexColor,
        borderColor: hexColor,
        borderWidth: '2px',
        borderStyle: 'solid'
      };
    }
    // Default gray color for contractors without assigned color
    return {
      backgroundColor: '#d1d5db',
      borderColor: '#9ca3af',
      borderWidth: '2px',
      borderStyle: 'solid'
    };
  };

  return (
    <div className="overflow-x-auto bg-card rounded-xl shadow-lg border">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-secondary text-secondary-foreground">
          <tr>
            <th className="border p-2 text-sm font-semibold min-w-[80px]">Godziny</th>
            {weekDays.map((day) => (
              <th key={day.toISOString()} className="border p-2" colSpan={facilityConfig.sections.length}>
                <div className="text-center">
                  <div className="font-bold text-sm">
                    {format(day, "EEEE", { locale: pl })}
                  </div>
                  <div className="text-xs opacity-90">
                    {format(day, "dd.MM.yyyy", { locale: pl })}
                  </div>
                </div>
              </th>
            ))}
          </tr>
          <tr>
            <th className="border p-2 text-xs">Od - Do</th>
            {weekDays.map((day) => (
              facilityConfig.sections.map((section) => (
                <th
                  key={`${day.toISOString()}-${section}`}
                  className="border p-1 text-xs min-w-[60px]"
                >
                  {facilityConfig.sectionLabel} {section}
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot, slotIndex) => {
            const rowCells: JSX.Element[] = [];
            
            weekDays.forEach((day) => {
              let sectionIndex = 0;
              
              while (sectionIndex < facilityConfig.sections.length) {
                const section = facilityConfig.sections[sectionIndex];
                const cellReservations = getReservationsForCell(day, slot.start, section);
                const reservation = cellReservations[0];

                // Check if this cell should be skipped (part of merged cell above)
                if (reservation && slotIndex > 0) {
                  const prevSlot = TIME_SLOTS[slotIndex - 1];
                  const prevReservations = getReservationsForCell(day, prevSlot.start, section);
                  if (prevReservations[0]?.id === reservation.id) {
                    sectionIndex++;
                    continue; // Skip this cell, it's part of rowspan above
                  }
                }

                // Calculate colspan for horizontal merging (multiple tracks)
                let colspan = 1;
                if (reservation) {
                  for (let i = sectionIndex + 1; i < facilityConfig.sections.length; i++) {
                    const nextSection = facilityConfig.sections[i];
                    
                    // Find any reservation on the next track at this time
                    const nextReservations = getReservationsForCell(day, slot.start, nextSection);
                    
                    // If next track has the same reservation (by ID), extend colspan
                    if (nextReservations[0]?.id === reservation.id) {
                      colspan++;
                    } else {
                      // If next track has a different reservation or no reservation, stop merging
                      break;
                    }
                  }
                }

                // Calculate rowspan for vertical merging (multiple time slots)
                let rowspan = 1;
                if (reservation) {
                  for (let i = slotIndex + 1; i < TIME_SLOTS.length; i++) {
                    const nextSlot = TIME_SLOTS[i];
                    const nextReservations = getReservationsForCell(day, nextSlot.start, section);
                    if (nextReservations[0]?.id === reservation.id) {
                      rowspan++;
                    } else {
                      break;
                    }
                  }
                }

                rowCells.push(
                  <td
                    key={`${day.toISOString()}-${slot.start}-${section}`}
                    className="border p-0 text-xs relative group"
                    rowSpan={rowspan}
                    colSpan={colspan}
                  >
                    {reservation && (
                      <div
                        className="w-full h-full flex items-center justify-center text-center font-medium relative min-h-[28px]"
                        style={
                          reservation.isClosed
                            ? {
                                backgroundColor: '#fbbf24',
                                borderColor: '#fbbf24',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                color: '#111827'
                              }
                            : getContractorColorStyle(reservation.contractor)
                        }
                      >
                        {(reservation.closedReason || reservation.contractor) && (
                          <div className="text-xs px-1 truncate">
                            {reservation.isClosed 
                              ? reservation.closedReason
                              : reservation.contractor
                            }
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => onDeleteReservation(reservation.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                );

                sectionIndex += colspan;
              }
            });

            return (
              <tr key={slot.start} className="hover:bg-muted/50 transition-colors">
                <td className="border p-2 text-xs font-medium whitespace-nowrap bg-muted/30">
                  {slot.start} - {slot.end}
                </td>
                {rowCells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
