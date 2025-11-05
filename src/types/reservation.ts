export type FacilityType = "track-6" | "track-8" | "rugby";

export interface FacilityConfig {
  id: FacilityType;
  name: string;
  sections: number[];
  sectionLabel: string;
}

export const FACILITY_CONFIGS: Record<FacilityType, FacilityConfig> = {
  "track-6": {
    id: "track-6",
    name: "Bieżnia 6-torowa",
    sections: [1, 2, 3, 4, 5, 6],
    sectionLabel: "Tor"
  },
  "track-8": {
    id: "track-8",
    name: "Bieżnia 8-torowa",
    sections: [1, 2, 3, 4, 5, 6, 7, 8],
    sectionLabel: "Tor"
  },
  "rugby": {
    id: "rugby",
    name: "Boisko Rugby",
    sections: [1, 2],
    sectionLabel: "Połowa"
  }
};

export interface Contractor {
  id: string;
  name: string;
  color?: string;
  category?: string; // "Grupa biegowa" or "Trening sportowy"
}

export interface Reservation {
  id: string;
  contractor: string;
  date: Date;
  startTime: string;
  endTime: string;
  tracks: number[];
  facilityType: FacilityType;
  isClosed?: boolean; // Marks stadium as closed (unavailable)
  closedReason?: string; // Custom text for closed stadium
  color?: string;
  trackCount?: number; // Used temporarily during creation
  category?: string; // "Grupa biegowa" or "Trening sportowy"
}

export interface WeeklyArchive {
  id: string;
  weekStart: string; // ISO date string "YYYY-MM-DD"
  weekEnd: string;   // ISO date string "YYYY-MM-DD"
  facilityType: FacilityType;
  reservations: Reservation[];
  savedAt: string;   // Formatted display date
  createdAt?: Date;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { start: "07:00", end: "07:30" },
  { start: "07:30", end: "08:00" },
  { start: "08:00", end: "08:30" },
  { start: "08:30", end: "09:00" },
  { start: "09:00", end: "09:30" },
  { start: "09:30", end: "10:00" },
  { start: "10:00", end: "10:30" },
  { start: "10:30", end: "11:00" },
  { start: "11:00", end: "11:30" },
  { start: "11:30", end: "12:00" },
  { start: "12:00", end: "12:30" },
  { start: "12:30", end: "13:00" },
  { start: "13:00", end: "13:30" },
  { start: "13:30", end: "14:00" },
  { start: "14:00", end: "14:30" },
  { start: "14:30", end: "15:00" },
  { start: "15:00", end: "15:30" },
  { start: "15:30", end: "16:00" },
  { start: "16:00", end: "16:30" },
  { start: "16:30", end: "17:00" },
  { start: "17:00", end: "17:30" },
  { start: "17:30", end: "18:00" },
  { start: "18:00", end: "18:30" },
  { start: "18:30", end: "19:00" },
  { start: "19:00", end: "19:30" },
  { start: "19:30", end: "20:00" },
  { start: "20:00", end: "20:30" },
  { start: "20:30", end: "21:00" },
];

export const DEFAULT_CONTRACTORS: Contractor[] = [
  { id: "1", name: "OKS SKRA", category: "Trening sportowy" },
  { id: "2", name: "KS CZEMPION", category: "Trening sportowy" },
  { id: "3", name: "AKL", category: "Trening sportowy" },
  { id: "4", name: "Kamil Żewłakow", category: "Trening sportowy" },
  { id: "5", name: "SGH", category: "Trening sportowy" },
  { id: "6", name: "Grupa biegowa Aktywna Warszawa", category: "Grupa biegowa" },
  { id: "7", name: "ZabieganeDni", category: "Grupa biegowa" },
  { id: "8", name: "Adidas Runners", category: "Grupa biegowa" },
  { id: "9", name: "Sword Athletics Club", category: "Trening sportowy" },
  { id: "10", name: "Endless Pain", category: "Grupa biegowa" },
  { id: "11", name: "Run Club", category: "Grupa biegowa" },
];

export const WEEKDAYS = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 0, label: "Niedziela" },
];

export const TRACKS = [1, 2, 3, 4, 5, 6]; // Default, will be overridden by facility config

export const CONTRACTOR_CATEGORIES: Record<string, string> = {
  "OKS SKRA": "Trening sportowy",
  "KS CZEMPION": "Trening sportowy",
  "AKL": "Trening sportowy",
  "Kamil Żewłakow": "Trening sportowy",
  "SGH": "Trening sportowy",
  "Sword Athletics Club": "Trening sportowy",
  "Grupa biegowa Aktywna Warszawa": "Grupa biegowa",
  "ZabieganeDni": "Grupa biegowa",
  "Adidas Runners": "Grupa biegowa",
  "Endless Pain": "Grupa biegowa",
  "Run Club": "Grupa biegowa",
  "EP": "Trening sportowy",
  "UM": "Trening sportowy",
  "ZAMKNIETY": "Stadion zamkniety",
};

export const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  "Grupa biegowa": [147, 197, 253], // blue-300
  "Trening sportowy": [134, 239, 172], // green-300
  "Stadion zamkniety": [251, 191, 36], // amber-400
};

export const CONTRACTOR_COLORS: Record<string, [number, number, number]> = {
  "OKS SKRA": [147, 197, 253], // blue-300
  "KS CZEMPION": [134, 239, 172], // green-300
  "AKL": [216, 180, 254], // purple-300
  "Kamil Żewłakow": [253, 186, 116], // orange-300
  "SGH": [252, 165, 165], // red-300
  "Grupa biegowa Aktywna Warszawa": [94, 234, 212], // teal-300
  "ZabieganeDni": [249, 168, 212], // pink-300
  "Adidas Runners": [165, 180, 252], // indigo-300
  "Sword Athletics Club": [253, 224, 71], // yellow-300
  "Endless Pain": [103, 232, 249], // cyan-300
  "Run Club": [190, 242, 100], // lime-300
  "EP": [147, 197, 253], // blue-300
  "UM": [134, 239, 172], // green-300
  "ZAMKNIETY": [251, 191, 36], // amber-400
  "BLOKADA": [134, 239, 172], // green-300
};
