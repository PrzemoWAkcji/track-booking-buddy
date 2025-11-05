/**
 * useReservations Hook
 * React Query-based hook for managing reservations
 * Replaces direct useState + localStorage usage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ReservationService } from '@/services/reservationService'
import type { Reservation, FacilityType } from '@/types/reservation'

const QUERY_KEY = 'reservations'

export function useReservations(facilityType?: FacilityType) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch reservations (all if no facilityType specified)
  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: facilityType ? [QUERY_KEY, facilityType] : [QUERY_KEY],
    queryFn: () => ReservationService.getReservations(facilityType),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  })

  // Create reservation
  const createMutation = useMutation({
    mutationFn: (reservation: Omit<Reservation, 'id'>) =>
      ReservationService.createReservation(reservation as Reservation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została dodana',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się dodać rezerwacji: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Update reservation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reservation> }) =>
      ReservationService.updateReservation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została zaktualizowana',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się zaktualizować rezerwacji: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Delete reservation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReservationService.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Rezerwacja została usunięta',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się usunąć rezerwacji: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Delete all reservations
  const deleteAllMutation = useMutation({
    mutationFn: (facilityTypeToDelete?: FacilityType) => 
      ReservationService.deleteAllReservations(facilityTypeToDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Wszystkie rezerwacje zostały usunięte',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się usunąć rezerwacji: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Migrate from localStorage
  const migrateMutation = useMutation({
    mutationFn: (facilityTypeToMigrate: FacilityType) => 
      ReservationService.migrateFromLocalStorage(facilityTypeToMigrate),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Migracja zakończona',
        description: `Przeniesiono ${count} rezerwacji do chmury`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd migracji',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Reorganize tracks to be consecutive
  const reorganizeMutation = useMutation({
    mutationFn: (facilityTypeToReorganize: FacilityType) => 
      ReservationService.reorganizeTracksToConsecutive(facilityTypeToReorganize),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Reorganizacja zakończona',
        description: `Zaktualizowano ${count} rezerwacji - tory są teraz ułożone obok siebie`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd reorganizacji',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Undo reorganization
  const undoReorganizeMutation = useMutation({
    mutationFn: (facilityTypeToUndo: FacilityType) => 
      ReservationService.undoReorganization(facilityTypeToUndo),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Zmiany cofnięte',
        description: `Przywrócono poprzedni układ torów (${count} rezerwacji)`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd cofania zmian',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    // Data
    reservations,
    isLoading,
    isError,
    error,

    // Mutations
    addReservation: createMutation,
    updateReservation: updateMutation,
    deleteReservation: deleteMutation,
    deleteAllReservations: deleteAllMutation,
    migrateFromLocalStorage: migrateMutation,
    reorganizeTracksToConsecutive: reorganizeMutation,
    undoReorganization: undoReorganizeMutation,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeletingAll: deleteAllMutation.isPending,
    isMigrating: migrateMutation.isPending,
    isReorganizing: reorganizeMutation.isPending,
    isUndoingReorganization: undoReorganizeMutation.isPending,

    // Utilities - wrapped to provide simpler interface
    checkConflicts: (newReservation: Reservation) =>
      ReservationService.checkConflicts(newReservation, reservations),
    hasUndoSnapshot: (facilityType: FacilityType) =>
      ReservationService.hasUndoSnapshot(facilityType),
    getAvailableTracks: async (
      targetFacilityType: FacilityType,
      date: Date,
      startTime: string,
      endTime: string,
      trackCount: number
    ) => {
      // Get existing reservations for the same facility and date
      const existingOnSameDay = reservations.filter(
        r => r.facilityType === targetFacilityType && 
        r.date.toDateString() === date.toDateString()
      );
      
      const facilityConfig = await import('@/types/reservation').then(m => m.FACILITY_CONFIGS[targetFacilityType]);
      const TIME_SLOTS = await import('@/types/reservation').then(m => m.TIME_SLOTS);
      
      // Check each time slot in the new reservation
      const newSlots = TIME_SLOTS.filter(
        slot => slot.start >= startTime && slot.start < endTime
      );
      
      // Find CONSECUTIVE available tracks for all time slots
      // Try each possible starting position for consecutive range
      for (let startTrack = 1; startTrack <= facilityConfig.sections.length - trackCount + 1; startTrack++) {
        const consecutiveTracks: number[] = [];
        let allTracksAvailable = true;
        
        // Check if trackCount consecutive tracks starting from startTrack are all available
        for (let i = 0; i < trackCount; i++) {
          const trackNum = startTrack + i;
          let isAvailableInAllSlots = true;
          
          // Check availability in all time slots
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
          
          if (!isAvailableInAllSlots) {
            allTracksAvailable = false;
            break;
          }
          
          consecutiveTracks.push(trackNum);
        }
        
        // If we found consecutive tracks, return them
        if (allTracksAvailable && consecutiveTracks.length === trackCount) {
          return consecutiveTracks;
        }
      }
      
      // No consecutive tracks found - return empty array
      return [];
    },
  }
}