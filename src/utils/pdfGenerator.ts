import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfWeek, addDays, getDay } from "date-fns";
import { Reservation, TIME_SLOTS, FacilityConfig, CONTRACTOR_COLORS, CONTRACTOR_CATEGORIES, CATEGORY_COLORS } from "@/types/reservation";
import "jspdf-autotable";
import logo from "@/assets/aktywna-warszawa-logo.jpg";

// Dodajemy polskie czcionki
import { normal as robotoNormalFont, bold as robotoBoldFont, italics as robotoItalicFont, bolditalics as robotoBoldItalicFont } from "roboto-base64";

// Polish day names mapping
const POLISH_DAYS: Record<number, string> = {
  0: "NIEDZIELA",
  1: "PONIEDZIAŁEK",
  2: "WTOREK",
  3: "ŚRODA",
  4: "CZWARTEK",
  5: "PIĄTEK",
  6: "SOBOTA",
};

// Helper function to get contractor color by name
const getContractorColorByName = (contractorName: string): [number, number, number] => {
  // First try direct match
  if (CONTRACTOR_COLORS[contractorName]) {
    return CONTRACTOR_COLORS[contractorName];
  }
  
  // Default gray color
  return [220, 220, 220];
};

// Funkcja pomocnicza do znalezienia koloru kontrahenta
const getContractorColor = (contractorName: string): [number, number, number] => {
  // Najpierw próbujemy bezpośredniego dopasowania
  if (CONTRACTOR_COLORS[contractorName]) {
    return CONTRACTOR_COLORS[contractorName];
  }
  
  // Próbujemy znaleźć podobne nazwy (ignorując wielkość liter)
  const lowerCaseInput = contractorName.toLowerCase();
  for (const [key, color] of Object.entries(CONTRACTOR_COLORS)) {
    if (key.toLowerCase() === lowerCaseInput) {
      return color;
    }
  }
  
  // Domyślny kolor szary
  return [220, 220, 220];
};

interface CellSpan {
  content: string;
  colSpan: number;
  rowSpan?: number;
}

// Funkcja do dodania polskiej czcionki do PDF
const addPolishFont = (doc: jsPDF) => {
  try {
    console.log("Dodawanie polskiej czcionki do PDF");

    if (!robotoNormalFont || !robotoBoldFont || !robotoItalicFont || !robotoBoldItalicFont) {
      console.error("Brak dostępu do pełnego zestawu czcionek Roboto");
      doc.setFont("helvetica");
      return;
    }

    doc.addFileToVFS("Roboto-Regular.ttf", robotoNormalFont);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldFont);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    doc.addFileToVFS("Roboto-Italic.ttf", robotoItalicFont);
    doc.addFont("Roboto-Italic.ttf", "Roboto", "italic");

    doc.addFileToVFS("Roboto-BoldItalic.ttf", robotoBoldItalicFont);
    doc.addFont("Roboto-BoldItalic.ttf", "Roboto", "bolditalic");

    doc.setFont("Roboto", "normal");
    console.log("Domyślna czcionka ustawiona na Roboto");
  } catch (error) {
    console.error("Błąd podczas dodawania polskiej czcionki:", error);
    doc.setFont("helvetica");
  }
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const isClosedLabel = (text: string) => normalizeText(text).includes("ZAMKNIETY");

export const generateWeeklyPDF = (reservations: Reservation[], weekStart: Date, facilityConfig: FacilityConfig, isRodoVersion = false) => {
  try {
    console.log("Rozpoczęcie generowania PDF", { 
      reservationsCount: reservations.length,
      weekStart: weekStart.toISOString(),
      facilityId: facilityConfig.id,
      isRodoVersion
    });
    
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    
    console.log("Utworzono obiekt jsPDF");
    
    // Dodajemy obsługę polskich znaków
    addPolishFont(doc);

  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const SECTIONS = facilityConfig.sections;
  const activeRowSpans = Array.from({ length: weekDays.length }, () => Array(SECTIONS.length).fill(0));

  const colors = {
    headerBg: [33, 150, 243] as [number, number, number],
    headerText: [255, 255, 255] as [number, number, number],
    border: [0, 0, 0] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    lightGray: [250, 250, 250] as [number, number, number],
  };

  doc.addImage(logo, "JPEG", 10, 8, 20, 20);

  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Stołeczne Centrum Sportu AKTYWNA WARSZAWA", 148.5, 12, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.text(`Ośrodek Nowa Skra - Zajętość ${facilityConfig.name}`, 148.5, 18, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("Roboto", "bold");
  doc.text(
    `Harmonogram rezerwacji stadionu ${format(weekDays[0], "dd.MM")} - ${format(weekDays[6], "dd.MM.yyyy")}`,
    148.5,
    24,
    { align: "center" }
  );

  const headerRow = [
    { content: "Godziny", colSpan: 2, rowSpan: 2 },
    ...weekDays.map((day) => ({
      content: `${POLISH_DAYS[getDay(day)]}\n${format(day, "dd.MM.yyyy")}`,
      colSpan: SECTIONS.length,
    })),
    { content: "Godziny", colSpan: 2, rowSpan: 2 },
  ];

  const trackRow = [
    ...weekDays.flatMap(() => SECTIONS.map((section) => `${section}`)),
  ];

  const body = TIME_SLOTS.map((slot, slotIndex) => {
    const row: (string | CellSpan)[] = [slot.start, slot.end];

    weekDays.forEach((day, dayIndex) => {
      let sectionIndex = 0;
      
      while (sectionIndex < SECTIONS.length) {
        if (activeRowSpans[dayIndex][sectionIndex] > 0) {
          activeRowSpans[dayIndex][sectionIndex] -= 1;
          sectionIndex += 1;
          continue;
        }

        const section = SECTIONS[sectionIndex];
        
        const reservation = reservations.find((res) => {
          if (!res.date || res.date.toDateString() !== day.toDateString()) return false;
          if (!res.tracks.includes(section)) return false;
          return slot.start >= res.startTime && slot.start < res.endTime;
        });

        if (reservation) {
          let colSpan = 1;
          for (let i = sectionIndex + 1; i < SECTIONS.length; i++) {
            const nextSection = SECTIONS[i];
            if (reservation.tracks.includes(nextSection)) {
              const nextReservation = reservations.find((res) => {
                if (!res.date || res.date.toDateString() !== day.toDateString()) return false;
                if (!res.tracks.includes(nextSection)) return false;
                return slot.start >= res.startTime && slot.start < res.endTime;
              });
              
              if (nextReservation?.id === reservation.id) {
                colSpan++;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          const reservationEndMinutes = timeToMinutes(reservation.endTime);
          let rowSpan = 1;
          for (let nextSlotIndex = slotIndex + 1; nextSlotIndex < TIME_SLOTS.length; nextSlotIndex++) {
            const nextSlot = TIME_SLOTS[nextSlotIndex];
            const nextStartMinutes = timeToMinutes(nextSlot.start);
            if (nextStartMinutes < reservationEndMinutes) {
              rowSpan++;
            } else {
              break;
            }
          }
          
          const cellContent = reservation.isClosed
            ? (reservation.closedReason || "")
            : reservation.contractor;

          row.push({
            content: cellContent,
            colSpan,
            rowSpan: rowSpan > 1 ? rowSpan : undefined,
          });

          for (let offset = 0; offset < colSpan; offset++) {
            activeRowSpans[dayIndex][sectionIndex + offset] = Math.max(rowSpan - 1, 0);
          }

          sectionIndex += colSpan;
        } else {
          row.push("");
          sectionIndex++;
        }
      }
    });

    row.push(slot.start, slot.end);

    return row;
  });

  
  autoTable(doc, {
    head: [headerRow, trackRow],
    body: body,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: 5,
      cellPadding: 1,
      lineWidth: 0.2,
      lineColor: colors.border,
      textColor: colors.headerText,
      font: "Roboto",
      minCellHeight: 3.5,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      fillColor: colors.white,
    },
    headStyles: {
      fillColor: colors.headerBg,
      textColor: colors.headerText,
      fontStyle: "bold",
      halign: "center",
      fontSize: 5.5,
      cellPadding: 1.2,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { 
        cellWidth: 8,
        fontStyle: "bold",
        fontSize: 5,
        fillColor: colors.lightGray,
        textColor: colors.border,
      },
      1: {
        cellWidth: 8,
        fontStyle: "bold",
        fontSize: 5,
        fillColor: colors.lightGray,
        textColor: colors.border,
      },
      [2 + (SECTIONS.length * 7)]: {
        cellWidth: 8,
        fontStyle: "bold",
        fontSize: 5,
        fillColor: colors.lightGray,
        textColor: colors.border,
      },
      [2 + (SECTIONS.length * 7) + 1]: {
        cellWidth: 8,
        fontStyle: "bold",
        fontSize: 5,
        fillColor: colors.lightGray,
        textColor: colors.border,
      },
    },
    margin: { top: 30, left: 5, right: 5, bottom: 5 },
    tableWidth: "auto",
    didDrawCell: (data) => {
      const totalColumns = 2 + (SECTIONS.length * 7) + 2;
      // Style cells with reservations
      if (data.section === "body" && data.column.index > 1 && data.column.index < totalColumns - 2) {
        // Check if this should have green background (RODO + track-6 + Mon-Fri 16:00-19:00)
        const slot = TIME_SLOTS[data.row.index];
        const colIndexInData = data.column.index - 2; // Offset for first 2 columns (time)
        const dayIndex = Math.floor(colIndexInData / SECTIONS.length);
        const trackIndexInDay = colIndexInData % SECTIONS.length;
        const day = weekDays[dayIndex];
        const dayOfWeek = getDay(day);
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
        const isAfternoon = slot.start >= "16:00" && slot.start < "19:00";
        const isTrack6 = facilityConfig.id === "track-6";
        const shouldBeGreen = isRodoVersion && isTrack6 && isWeekday && isAfternoon;
        
        const cellData = data.cell.raw;
        
        // Handle cells with content (reservations)
        if (typeof cellData === "object" && cellData && "content" in cellData && cellData.content) {
          const contractorName = String(cellData.content);
          
          // Find the actual reservation to get its category
          const reservation = reservations.find((res) => {
            if (!res.date || res.date.toDateString() !== day.toDateString()) return false;
            return slot.start >= res.startTime && slot.start < res.endTime;
          });
          
          // Determine color
          let color: [number, number, number];
          if (shouldBeGreen) {
            // Green for RODO afternoon slots
            color = [134, 239, 172];
          } else if (isRodoVersion) {
            const isClosed = isClosedLabel(contractorName);
            const category = isClosed ? "Stadion zamkniety" : (reservation?.category || CONTRACTOR_CATEGORIES[contractorName] || "Trening sportowy");
            color = CATEGORY_COLORS[category] || [220, 220, 220];
          } else {
            const isClosed = isClosedLabel(contractorName);
            color = isClosed ? CONTRACTOR_COLORS["ZAMKNIETY"] : getContractorColor(contractorName);
          }
          
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
          
          // Draw borders - thicker for day boundaries, selective for green blocks
          if (shouldBeGreen) {
            // For green blocks - only draw outer borders (no internal lines)
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            
            // Left border - ONLY if day boundary
            if (trackIndexInDay === 0) {
              doc.setLineWidth(0.5); // Thicker for day boundary
              const leftX = data.cell.x;
              doc.line(leftX, data.cell.y, leftX, data.cell.y + data.cell.height);
            }
            
            // Right border - ONLY if day boundary
            if (trackIndexInDay === SECTIONS.length - 1) {
              doc.setLineWidth(0.5); // Thicker for day boundary
              const rightX = data.cell.x + data.cell.width;
              doc.line(rightX, data.cell.y, rightX, data.cell.y + data.cell.height);
            }
            
            // Top border - only if first afternoon slot
            const isFirstAfternoonSlot = slot.start === "16:00";
            if (isFirstAfternoonSlot) {
              doc.setLineWidth(0.2);
              doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
            
            // Bottom border - only if last afternoon slot
            const isLastAfternoonSlot = slot.start === "18:30";
            if (isLastAfternoonSlot) {
              doc.setLineWidth(0.2);
              const bottomY = data.cell.y + data.cell.height;
              doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
            }
          } else {
            // Normal borders for non-green cells
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.2);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
            
            // Add thicker day boundary line if needed
            if (trackIndexInDay === 0) {
              doc.setLineWidth(0.5);
              doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
            }
          }
          
          // Use black text for better readability
          const isClosed = isClosedLabel(contractorName);
          doc.setTextColor(0, 0, 0);
          
          // For closed cells, use larger font and bold weight
          if (isClosed) {
            doc.setFontSize(6);
            doc.setFont("Roboto", "bold");
          } else {
            doc.setFontSize(5);
            doc.setFont("Roboto", "normal");
          }
          
          // Draw text for all cells in regular version, or only closed cells in RODO version
          if (!isRodoVersion || isClosed) {
            doc.text(contractorName, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
              align: "center",
              baseline: "middle",
              maxWidth: data.cell.width - 1,
            });
          }
        } else if (shouldBeGreen) {
          // Empty cells in RODO afternoon slots - green background, no text
          const color: [number, number, number] = [134, 239, 172];
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
          
          // Draw selective borders - only outer edges
          doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
          
          // Left border - thicker if day boundary
          if (trackIndexInDay === 0) {
            doc.setLineWidth(0.5); // Thicker for day boundary
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          }
          
          // Right border - thicker if day boundary
          if (trackIndexInDay === SECTIONS.length - 1) {
            doc.setLineWidth(0.5); // Thicker for day boundary
            const rightX = data.cell.x + data.cell.width;
            doc.line(rightX, data.cell.y, rightX, data.cell.y + data.cell.height);
          }
          
          // Top border - only if first afternoon slot
          const isFirstAfternoonSlot = slot.start === "16:00";
          if (isFirstAfternoonSlot) {
            doc.setLineWidth(0.2);
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
          }
          
          // Bottom border - only if last afternoon slot
          const isLastAfternoonSlot = slot.start === "18:30";
          if (isLastAfternoonSlot) {
            doc.setLineWidth(0.2);
            const bottomY = data.cell.y + data.cell.height;
            doc.line(data.cell.x, bottomY, data.cell.x + data.cell.width, bottomY);
          }
        } else {
          // Normal empty cells - add thicker day boundary if needed
          if (trackIndexInDay === 0) {
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.5);
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          }
        }
      }
    },
  });

  // Add legend for RODO version - only if there are reservations
  if (isRodoVersion && reservations.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    doc.text("Legenda:", 10, finalY + 10);
    
    let legendY = finalY + 15;
    let legendX = 10;
    const boxSize = 5;
    const spacing = 8;
    
    // Show only categories, not individual contractors
    const categories = ["Grupa biegowa", "Trening sportowy", "Stadion zamkniety"];
    
    categories.forEach((category) => {
      const color = CATEGORY_COLORS[category] || [220, 220, 220];
      
      doc.setFillColor(color[0], color[1], color[2]);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.rect(legendX, legendY, boxSize, boxSize, "FD");
      
      doc.setFontSize(7);
      doc.setFont("Roboto", "normal");
      doc.setTextColor(0, 0, 0);
      const label = category === "Stadion zamkniety" ? "Stadion zamknięty" : category;
      doc.text(label, legendX + boxSize + 2, legendY + 3.5);
      
      legendY += spacing;
    });
    
    // Add footer text
    doc.setFontSize(7);
    doc.setFont("Roboto", "italic");
    doc.text(
      'Kierownictwo Ośrodka "Nowa Skra" zastrzega sobie prawo do dokonywania zmian w harmonogramach.',
      10,
      legendY + 5
    );
    
    doc.setFontSize(6);
    doc.setFont("Roboto", "normal");
    doc.text(
      'Dodatkowe informacje, w tym aktualny harmonogram dostępny jest na stronie www Ośrodka:',
      10,
      legendY + 10
    );
    doc.text(
      'https://piuw.um.warszawa.pl/waw/aktywna-warszawa/osrodek-nowa-skra',
      10,
      legendY + 14
    );
  } else {
    // For non-RODO version, show all contractors with their colors
    const finalY = (doc as any).lastAutoTable.finalY || 30;
    
    const uniqueContractors = Array.from(new Set(reservations.map(r => r.contractor)));
    const hasClosedReservations = reservations.some(r => r.isClosed);
    
    // Build legend entries
    const legendEntries: Array<{ name: string; color: [number, number, number] }> = [];
    
    // Add regular contractors
    uniqueContractors.forEach(contractor => {
      const color = getContractorColorByName(contractor);
      legendEntries.push({ name: contractor, color });
    });
    
    // Add closed stadium entry if there are any closed reservations
    if (hasClosedReservations) {
      const closedColor = CONTRACTOR_COLORS["ZAMKNIETY"];
      legendEntries.push({ name: "Stadion zamknięty", color: closedColor });
    }
    
    if (legendEntries.length > 0) {
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      doc.text("Legenda:", 10, finalY + 10);
      
      let legendY = finalY + 15;
      let legendX = 10;
      const boxSize = 5;
      const spacing = 8;
      
      legendEntries.forEach((entry, index) => {
        // Draw color box
        doc.setFillColor(entry.color[0], entry.color[1], entry.color[2]);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.rect(legendX, legendY, boxSize, boxSize, "FD");
        
        // Draw entry name
        doc.setFontSize(7);
        doc.setFont("Roboto", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(entry.name, legendX + boxSize + 2, legendY + 3.5);
        
        legendY += spacing;
        
        // Check if we need to move to next column
        if (legendY > 190 && index < legendEntries.length - 1) {
          legendY = finalY + 15;
          legendX += 60;
        }
      });
      
      // Add footer text for non-RODO version
      doc.setFontSize(7);
      doc.setFont("Roboto", "italic");
      doc.text(
        'Kierownictwo Ośrodka "Nowa Skra" zastrzega sobie prawo do dokonywania zmian w harmonogramach.',
        10,
        legendY + 5
      );
      
      doc.setFontSize(6);
      doc.setFont("Roboto", "normal");
      doc.text(
        'Dodatkowe informacje, w tym aktualny harmonogram dostępny jest na stronie www Ośrodka:',
        10,
        legendY + 10
      );
      doc.text(
        'https://piuw.um.warszawa.pl/waw/aktywna-warszawa/osrodek-nowa-skra',
        10,
        legendY + 14
      );
    }
  }

  // Save with appropriate filename
  const facilityName = facilityConfig.id === "track-6" ? "6 TOR" 
    : facilityConfig.id === "track-8" ? "8 TOR"
    : "RUGBY";
  
  // Check if dates are in the same month
  const startDay = format(weekDays[0], "dd");
  const endDay = format(weekDays[6], "dd");
  const startMonth = format(weekDays[0], "MM");
  const endMonth = format(weekDays[6], "MM");
  
  let dateRange: string;
  if (startMonth === endMonth) {
    // Same month: "06-12.10"
    dateRange = `${startDay}-${endDay}.${endMonth}`;
  } else {
    // Different months: "27.10-02.11"
    dateRange = `${startDay}.${startMonth}-${endDay}.${endMonth}`;
  }
  
  const rodoSuffix = isRodoVersion ? "_RODO" : "";
  const filename = `${facilityName} ${dateRange}${rodoSuffix}.pdf`;
  
  console.log("Zapisywanie pliku PDF:", filename);
  doc.save(filename);
  console.log("Plik PDF został zapisany pomyślnie");
  
  } catch (error) {
    console.error("Błąd podczas generowania PDF:", error);
    throw error; // Przekazujemy błąd dalej, aby został obsłużony w komponencie
  }
};
