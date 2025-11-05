/**
 * useContractors Hook
 * React Query-based hook for managing contractors and their colors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Contractor {
  id: string
  name: string
  category: string
  color: string
  created_at?: string
  updated_at?: string
}

const QUERY_KEY = 'contractors'

export function useContractors() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch all contractors
  const {
    data: contractors = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Contractor[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Create contractor
  const createMutation = useMutation({
    mutationFn: async (contractor: Omit<Contractor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('contractors')
        .insert([contractor])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Wykonawca został dodany',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się dodać wykonawcy: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Update contractor color
  const updateColorMutation = useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const { data, error } = await supabase
        .from('contractors')
        .update({ color })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Kolor został zaktualizowany',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się zaktualizować koloru: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Update contractor
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contractor> }) => {
      const { data, error } = await supabase
        .from('contractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Wykonawca został zaktualizowany',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się zaktualizować wykonawcy: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Delete contractor
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contractors')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast({
        title: 'Sukces',
        description: 'Wykonawca został usunięty',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Błąd',
        description: `Nie udało się usunąć wykonawcy: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Get contractor color by name (utility function)
  const getContractorColor = (contractorName: string): string | null => {
    const contractor = contractors.find(c => c.name === contractorName)
    return contractor?.color || null
  }

  // Get all contractors as name->color map
  const getColorMap = (): Record<string, string> => {
    const map: Record<string, string> = {}
    contractors.forEach(c => {
      map[c.name] = c.color
    })
    return map
  }

  return {
    // Data
    contractors,
    isLoading,
    isError,
    error,

    // Mutations
    createContractor: createMutation,
    updateContractor: updateMutation,
    updateContractorColor: updateColorMutation,
    deleteContractor: deleteMutation,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Utilities
    getContractorColor,
    getColorMap,
  }
}