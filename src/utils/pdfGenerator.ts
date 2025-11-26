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

// Helper function to convert hex color to RGB tuple
const hexToRgb = (hex: string): [number, number, number] => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
};

// Helper function to get contractor color by name with fallback to database colors
const getContractorColorByName = (contractorName: string, colorMap: Record<string, string> = {}): [number, number, number] => {
  // First try database color map
  if (colorMap[contractorName]) {
    return hexToRgb(colorMap[contractorName]);
  }
  
  // Fallback to hardcoded colors
  if (CONTRACTOR_COLORS[contractorName]) {
    return CONTRACTOR_COLORS[contractorName];
  }
  
  // Default gray color
  return [220, 220, 220];
};

// Funkcja pomocnicza do znalezienia koloru kontrahenta
const getContractorColor = (contractorName: string, colorMap: Record<string, string> = {}): [number, number, number] => {
  // Najpierw próbujemy mapę kolorów z bazy danych
  if (colorMap[contractorName]) {
    return hexToRgb(colorMap[contractorName]);
  }
  
  // Fallback do hardcoded kolorów
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

export const generateWeeklyPDF = (reservations: Reservation[], weekStart: Date, facilityConfig: FacilityConfig, isRodoVersion = false, colorMap: Record<string, string> = {}) => {
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

  doc.addImage(logo, "JPEG", 10, 8, 23, 23);

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
          // Count consecutive tracks belonging to the same reservation
          let colSpan = 1;
          for (let i = sectionIndex + 1; i < SECTIONS.length; i++) {
            const nextSection = SECTIONS[i];
            
            // Find any reservation on the next track at this time
            const nextReservation = reservations.find((res) => {
              if (!res.date || res.date.toDateString() !== day.toDateString()) return false;
              if (!res.tracks.includes(nextSection)) return false;
              return slot.start >= res.startTime && slot.start < res.endTime;
            });
            
            // If next track has the same reservation (by ID), extend colspan
            if (nextReservation?.id === reservation.id) {
              colSpan++;
            } else {
              // If next track has a different reservation or no reservation, stop merging
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

  
  // Adjust column widths based on facility type
  let timeColumnWidth = 8;
  let trackColumnWidth = 6;
  
  if (facilityConfig.id === "track-8") {
    timeColumnWidth = 8;
    trackColumnWidth = 4.5; // Narrower for 8 tracks to fit on page
  } else if (facilityConfig.id === "rugby") {
    timeColumnWidth = 12; // Wider time columns for rugby
    trackColumnWidth = 16; // Much wider for rugby (only 2 sections, plenty of space)
  }
  
  // Generate column styles dynamically to ensure equal width for all track columns
  const columnStyles: any = {
    0: { 
      cellWidth: timeColumnWidth,
      fontStyle: "bold",
      fontSize: 6,
      fillColor: colors.lightGray,
      textColor: colors.border,
    },
    1: {
      cellWidth: timeColumnWidth,
      fontStyle: "bold",
      fontSize: 6,
      fillColor: colors.lightGray,
      textColor: colors.border,
    },
    [2 + (SECTIONS.length * 7)]: {
      cellWidth: timeColumnWidth,
      fontStyle: "bold",
      fontSize: 6,
      fillColor: colors.lightGray,
      textColor: colors.border,
    },
    [2 + (SECTIONS.length * 7) + 1]: {
      cellWidth: timeColumnWidth,
      fontStyle: "bold",
      fontSize: 6,
      fillColor: colors.lightGray,
      textColor: colors.border,
    },
  };
  
  // Set equal width for all track columns (columns 2 to 2 + SECTIONS.length * 7 - 1)
  for (let i = 2; i < 2 + (SECTIONS.length * 7); i++) {
    columnStyles[i] = { cellWidth: trackColumnWidth };
  }
  
  // Adjust font sizes, cell padding, and margins based on facility type
  let bodyFontSize = 5;
  let headFontSize = 5.5;
  let cellPadding = 1;
  let headCellPadding = 1.2;
  let leftMargin = 5;
  let rightMargin = 5;
  
  if (facilityConfig.id === "track-8") {
    bodyFontSize = 4.5; // Slightly smaller font for 8 tracks
    headFontSize = 5;
    cellPadding = 0.8;
    headCellPadding = 1;
    leftMargin = 4; // Reduce margins to fit 8 tracks
    rightMargin = 4;
  } else if (facilityConfig.id === "rugby") {
    bodyFontSize = 5.5; // Moderate font size for rugby to fit on one page
    headFontSize = 6;
    cellPadding = 0.8; // Reduced padding to fit on one page
    headCellPadding = 1; // Reduced header padding
    // Calculate margins to center table: A4 landscape = 297mm
    // Rugby table width: 14 track cols * 16mm + 4 time cols * 12mm = 272mm
    // Margins: (297 - 272) / 2 = 12.5mm per side
    leftMargin = 12.5;
    rightMargin = 12.5;
  }
  
  // Adjust minCellHeight based on facility type
  let minCellHeight = 3.5;
  if (facilityConfig.id === "rugby") {
    minCellHeight = 3.2; // Reduced to fit rugby on one page
  }
  
  autoTable(doc, {
    head: [headerRow, trackRow],
    body: body,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: bodyFontSize,
      cellPadding: cellPadding,
      lineWidth: 0.2,
      lineColor: colors.border,
      textColor: colors.headerText,
      font: "Roboto",
      minCellHeight: minCellHeight,
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
      fontSize: headFontSize,
      cellPadding: headCellPadding,
      lineWidth: 0.2,
    },
    columnStyles,
    margin: { top: 30, left: leftMargin, right: rightMargin, bottom: 5 },
    tableWidth: "auto",
    didDrawCell: (data) => {
      const totalColumns = 2 + (SECTIONS.length * 7) + 2;
      
      // Track cell positions for green rectangle overlay (RODO mode)
      if (data.section === "body" && data.column.index > 1 && data.column.index < totalColumns - 2) {
        const slot = TIME_SLOTS[data.row.index];
        const colIndexInData = data.column.index - 2;
        const dayIndex = Math.floor(colIndexInData / SECTIONS.length);
        const trackIndexInDay = colIndexInData % SECTIONS.length;
        const day = weekDays[dayIndex];
        const dayOfWeek = getDay(day);
        
        // Store position for green rectangle drawing later
        if (isRodoVersion && facilityConfig.id === "track-6") {
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          const isAfternoon = slot.start >= "16:00" && slot.start < "19:00";
          const isFirstTrack = trackIndexInDay === 0;
          const isLastTrack = trackIndexInDay === SECTIONS.length - 1;
          const isFirstSlot = slot.start === "16:00";
          const isLastSlot = slot.start === "18:30";
          
          if (isWeekday && isAfternoon && isFirstTrack && isFirstSlot) {
            // Store top-left corner
            if (!(doc as any).rodoGreenBlocks) (doc as any).rodoGreenBlocks = [];
            (doc as any).rodoGreenBlocks.push({ dayIndex, x: data.cell.x, y: data.cell.y, isStart: true });
          }
          if (isWeekday && isAfternoon && isLastTrack && isLastSlot) {
            // Store bottom-right corner
            if (!(doc as any).rodoGreenBlocks) (doc as any).rodoGreenBlocks = [];
            (doc as any).rodoGreenBlocks.push({ 
              dayIndex, 
              x: data.cell.x + data.cell.width, 
              y: data.cell.y + data.cell.height,
              isEnd: true 
            });
          }
        }
        
        const cellData = data.cell.raw;
        
        // Handle cells with content (reservations)
        if (typeof cellData === "object" && cellData && "content" in cellData && cellData.content) {
          const contractorName = String(cellData.content);
          const day = weekDays[dayIndex];
          
          // Find the actual reservation to get its category
          const reservation = reservations.find((res) => {
            if (!res.date || res.date.toDateString() !== day.toDateString()) return false;
            return slot.start >= res.startTime && slot.start < res.endTime;
          });
          
          // Determine color
          let color: [number, number, number];
          if (isRodoVersion) {
            const isClosed = isClosedLabel(contractorName);
            const category = isClosed ? "Stadion zamkniety" : (reservation?.category || CONTRACTOR_CATEGORIES[contractorName] || "Trening sportowy");
            color = CATEGORY_COLORS[category] || [220, 220, 220];
          } else {
            const isClosed = isClosedLabel(contractorName);
            color = isClosed ? CONTRACTOR_COLORS["ZAMKNIETY"] : getContractorColor(contractorName, colorMap);
          }
          
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
          
          // Draw borders with thicker day boundaries
          doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
          doc.setLineWidth(0.2);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "S");
          
          // Add thicker day boundary line if needed
          if (trackIndexInDay === 0) {
            doc.setLineWidth(0.5);
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          }
          
          // Use black text for better readability
          const isClosed = isClosedLabel(contractorName);
          doc.setTextColor(0, 0, 0);
          
          // For closed cells, use larger font and bold weight
          if (isClosed) {
            doc.setFontSize(6);
            doc.setFont("Roboto", "bold");
          } else {
            doc.setFontSize(7);
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
        } else {
          // Empty cells - add thicker day boundary if needed
          if (trackIndexInDay === 0) {
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.5);
            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          }
        }
      }
    },
  });

  // Draw green rectangles for RODO afternoon blocks (16:00-19:00, Mon-Fri) if enabled
  if (isRodoVersion && facilityConfig.id === "track-6" && (doc as any).rodoGreenBlocks) {
    const blocks = (doc as any).rodoGreenBlocks;
    
    // Group blocks by day
    const blocksByDay: { [key: number]: { start?: any; end?: any } } = {};
    blocks.forEach((block: any) => {
      if (!blocksByDay[block.dayIndex]) blocksByDay[block.dayIndex] = {};
      if (block.isStart) blocksByDay[block.dayIndex].start = block;
      if (block.isEnd) blocksByDay[block.dayIndex].end = block;
    });
    
    // Draw rectangles for each day
    Object.entries(blocksByDay).forEach(([dayIndex, coords]: [string, any]) => {
      if (coords.start && coords.end) {
        const x = coords.start.x;
        const y = coords.start.y;
        const width = coords.end.x - coords.start.x;
        const height = coords.end.y - coords.start.y;
        
        // Draw opaque green rectangle
        doc.setFillColor(134, 239, 172);
        doc.rect(x, y, width, height, "F");
      }
    });
  }

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
      const color = getContractorColorByName(contractor, colorMap);
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
