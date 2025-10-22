import { Reservation, FACILITY_CONFIGS } from "@/types/reservation";
import { format, addDays } from "date-fns";
import { pl } from "date-fns/locale";

export const exportWeekToExcel = (
  weekStart: string,
  facilityType: string,
  reservations: Reservation[],
  facilityName: string
) => {
  const weekStartDate = new Date(weekStart);
  const weekEndDate = addDays(weekStartDate, 6);
  
  const dateRangeStr = `${format(weekStartDate, "dd.MM")} - ${format(weekEndDate, "dd.MM.yyyy")}`;
  const fileName = `${facilityName} ${dateRangeStr.replace(/ /g, "_").replace(/\./g, "-")}.csv`;
  
  const headers = ["Data", "Godzina", "Tory", "Kontrahent", "Kategoria"];
  const rows: string[][] = [];
  
  const sortedReservations = [...reservations].sort((a, b) => 
    a.date.getTime() - b.date.getTime() || 
    a.startTime.localeCompare(b.startTime)
  );
  
  sortedReservations.forEach(res => {
    rows.push([
      format(res.date, "dd.MM.yyyy", { locale: pl }),
      `${res.startTime} - ${res.endTime}`,
      res.tracks.join(", "),
      res.contractor,
      res.category || ""
    ]);
  });
  
  const csvContent = [
    [facilityName],
    [`Tydzień: ${dateRangeStr}`],
    [`Liczba rezerwacji: ${reservations.length}`],
    [],
    headers,
    ...rows
  ]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAllWeeksToExcel = (
  weeklyArchive: Array<{
    facilityType: string;
    weekStart: string;
    reservations: Reservation[];
    savedAt: string;
  }>
) => {
  if (weeklyArchive.length === 0) return;
  
  const fileName = `Archiwum_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
  
  const headers = ["Obiekt", "Tydzień", "Data", "Godzina", "Tory", "Kontrahent", "Kategoria"];
  const rows: string[][] = [];
  
  const sortedArchive = [...weeklyArchive].sort((a, b) => 
    new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
  
  sortedArchive.forEach(entry => {
    const facilityName = FACILITY_CONFIGS[entry.facilityType as keyof typeof FACILITY_CONFIGS]?.name || entry.facilityType;
    const weekStartDate = new Date(entry.weekStart);
    const weekEndDate = addDays(weekStartDate, 6);
    const dateRangeStr = `${format(weekStartDate, "dd.MM")} - ${format(weekEndDate, "dd.MM.yyyy")}`;
    
    const sortedReservations = [...entry.reservations].sort((a, b) => 
      a.date.getTime() - b.date.getTime() || 
      a.startTime.localeCompare(b.startTime)
    );
    
    sortedReservations.forEach((res, idx) => {
      rows.push([
        idx === 0 ? facilityName : "",
        idx === 0 ? dateRangeStr : "",
        format(res.date, "dd.MM.yyyy", { locale: pl }),
        `${res.startTime} - ${res.endTime}`,
        res.tracks.join(", "),
        res.contractor,
        res.category || ""
      ]);
    });
    
    rows.push(["", "", "", "", "", "", ""]);
  });
  
  const csvContent = [
    ["Pełne archiwum rezerwacji"],
    [`Wygenerowano: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: pl })}`],
    [],
    headers,
    ...rows
  ]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
