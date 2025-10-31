/**
 * useWeeklyArchive Hook
 * React Query-based hook for managing weekly archives
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ReservationService } from '@/services/reservationService'
import type { FacilityType, WeeklyArchive, Reservation } from '@/types/reservation'

const ARCHIVE_QUERY_KEY = 'weeklyArchive'

export function useWeeklyArchive(facilityType?: FacilityType) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch weekly archives (all if no facilityType specified)
  const {
    data: archives = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: facilityType ? [ARCHIVE_QUERY_KEY, facilityType] : [ARCHIVE_QUERY_KEY],
    queryFn: () => ReservationService.getWeeklyArchives(facilityType),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  // Save weekly archive
  const saveMutation = useMutation({
    mutationFn: ({
      weekStart,
      weekEnd,
      facilityType,
      reservations,
    }: {
      weekStart: string
      weekEnd: string
      facilityType: FacilityType
      reservations: Reservation[]
    }) => ReservationService.saveWeeklyArchive(weekStart, weekEnd, facilityType, reservations),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ARCHIVE_QUERY_KEY] })
      
      // Check if this was an update or create
      const existing = archives.find(
        a => a.weekStart === variables.weekStart && a.facilityType === variables.facilityType
      )
      
      toast({
        title: 'Sukces',
        description: existing 
          ? 'Harmonogram tygodnia został zaktualizowany'
          : 'Harmonogram tygodnia został zapisany',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się zapisać archiwum: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Delete weekly archive
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReservationService.deleteWeeklyArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARCHIVE_QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Archiwum zostało usunięte',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się usunąć archiwum: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  return {
    // Data
    archives,
    isLoading,
    isError,
    error,

    // Mutations
    saveArchive: saveMutation,
    deleteArchive: deleteMutation,

    // Mutation states
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}