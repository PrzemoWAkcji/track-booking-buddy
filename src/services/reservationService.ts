/**
 * Reservation Service
 * Centralized service for all reservation-related operations
 * Replaces direct localStorage usage with Supabase
 */

import { supabase } from '@/integrations/supabase/client'
import type { ReservationInsert, ReservationRow } from '@/integrations/supabase/database.types'
import type { Reservation, FacilityType, WeeklyArchive } from '@/types/reservation'
import { format } from 'date-fns'

export class ReservationService {
  /**
   * Fetch all reservations for a specific facility type
   * If facilityType is not provided, fetches all reservations
   */
  static async getReservations(facilityType?: FacilityType): Promise<Reservation[]> {
    try {
      let query = supabase
        .from('reservations')
        .select('*')
      
      // Filter by facility type if provided
      if (facilityType) {
        query = query.eq('facility_type', facilityType)
      }
      
      const { data, error} = await query.order('date', { ascending: true })

      if (error) {
        console.error('Error fetching reservations:', error)
        throw new Error(`Failed to fetch reservations: ${error.message}`)
      }

      // Convert database rows to app format
      return (data || []).map(this.mapRowToReservation)
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      throw error
    }
  }

  /**
   * Create a new reservation
   */
  static async createReservation(reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
    try {
      // Generate ID if not provided
      const id = crypto.randomUUID()
      
      const insert: ReservationInsert = {
        id,
        contractor_name: reservation.contractor,
        contractor_category: reservation.category || 'Trening sportowy',
        date: reservation.date.toISOString(),
        time_slot: `${reservation.startTime}-${reservation.endTime}`,
        facility_type: reservation.facilityType,
        tracks: reservation.tracks,
        is_closed: reservation.isClosed || false,
        closed_reason: reservation.closedReason || null,
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert(insert)
        .select()
        .single()

      if (error) {
        console.error('Error creating reservation:', error)
        throw new Error(`Failed to create reservation: ${error.message}`)
      }

      return this.mapRowToReservation(data)
    } catch (error) {
      console.error('Failed to create reservation:', error)
      throw error
    }
  }

  /**
   * Update an existing reservation
   */
  static async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation> {
    try {
      const updateData: any = {}
      
      if (updates.contractor !== undefined) updateData.contractor_name = updates.contractor
      if (updates.category !== undefined) updateData.contractor_category = updates.category
      if (updates.date !== undefined) updateData.date = updates.date.toISOString()
      
      // Convert startTime/endTime to time_slot
      if (updates.startTime !== undefined && updates.endTime !== undefined) {
        updateData.time_slot = `${updates.startTime}-${updates.endTime}`
      }
      
      if (updates.facilityType !== undefined) updateData.facility_type = updates.facilityType
      if (updates.tracks !== undefined) updateData.tracks = updates.tracks
      if (updates.isClosed !== undefined) updateData.is_closed = updates.isClosed
      if (updates.closedReason !== undefined) updateData.closed_reason = updates.closedReason

      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating reservation:', error)
        throw new Error(`Failed to update reservation: ${error.message}`)
      }

      return this.mapRowToReservation(data)
    } catch (error) {
      console.error('Failed to update reservation:', error)
      throw error
    }
  }

  /**
   * Delete a reservation
   */
  static async deleteReservation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting reservation:', error)
        throw new Error(`Failed to delete reservation: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete reservation:', error)
      throw error
    }
  }

  /**
   * Delete all reservations for a facility
   * If facilityType is not provided, deletes ALL reservations (use with caution!)
   */
  static async deleteAllReservations(facilityType?: FacilityType): Promise<void> {
    try {
      let query = supabase
        .from('reservations')
        .delete()
      
      // Filter by facility type if provided
      if (facilityType) {
        query = query.eq('facility_type', facilityType)
      } else {
        // Delete all - match anything
        query = query.neq('id', '00000000-0000-0000-0000-000000000000') // Match all rows
      }
      
      const { error } = await query

      if (error) {
        console.error('Error deleting all reservations:', error)
        throw new Error(`Failed to delete all reservations: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete all reservations:', error)
      throw error
    }
  }

  /**
   * Check for conflicting reservations
   * Returns array of conflict messages
   */
  static checkConflicts(
    newReservation: Reservation,
    existingReservations: Reservation[]
  ): string[] {
    const conflicts: string[] = []

    // Skip conflict check if this is a "closed" reservation
    if (newReservation.isClosed) {
      return conflicts
    }

    const relevantReservations = existingReservations.filter(
      (res) =>
        res.date.toDateString() === newReservation.date.toDateString() &&
        res.timeSlot === newReservation.timeSlot &&
        res.facilityType === newReservation.facilityType &&
        res.id !== newReservation.id // Exclude self when editing
    )

    for (const track of newReservation.tracks) {
      const conflicting = relevantReservations.find((res) =>
        res.tracks.includes(track)
      )

      if (conflicting) {
        conflicts.push(
          `Tor ${track} jest już zarezerwowany przez ${conflicting.contractor} w tym czasie`
        )
      }
    }

    return conflicts
  }

  /**
   * Get available tracks for a given time slot
   */
  static getAvailableTracks(
    date: Date,
    timeSlot: string,
    facilityType: FacilityType,
    existingReservations: Reservation[],
    excludeReservationId?: string
  ): number[] {
    const totalTracks = facilityType === 'track-6' ? 6 : facilityType === 'track-8' ? 8 : 1

    const relevantReservations = existingReservations.filter(
      (res) =>
        res.date.toDateString() === date.toDateString() &&
        res.timeSlot === timeSlot &&
        res.facilityType === facilityType &&
        res.id !== excludeReservationId
    )

    // Check if facility is closed for this slot
    const isClosed = relevantReservations.some((res) => res.isClosed)
    if (isClosed) {
      return []
    }

    const occupiedTracks = new Set<number>()
    relevantReservations.forEach((res) => {
      res.tracks.forEach((track) => occupiedTracks.add(track))
    })

    const available: number[] = []
    for (let i = 1; i <= totalTracks; i++) {
      if (!occupiedTracks.has(i)) {
        available.push(i)
      }
    }

    return available
  }

  /**
   * Map database row to app Reservation type
   */
  private static mapRowToReservation(row: ReservationRow): Reservation {
    // Parse time_slot "HH:mm-HH:mm" into startTime and endTime
    const [startTime, endTime] = row.time_slot.split('-')
    
    return {
      id: row.id,
      contractor: row.contractor_name,
      category: row.contractor_category,
      date: new Date(row.date),
      startTime,
      endTime,
      facilityType: row.facility_type,
      tracks: row.tracks,
      isClosed: row.is_closed,
      closedReason: row.closed_reason || undefined,
    }
  }

  /**
   * Migrate data from localStorage to Supabase
   * WARNING: This is a one-time operation
   */
  static async migrateFromLocalStorage(facilityType: FacilityType): Promise<number> {
    try {
      const STORAGE_KEY = `trackReservations_${facilityType}`
      const stored = localStorage.getItem(STORAGE_KEY)
      
      if (!stored) {
        console.log('No localStorage data to migrate for', facilityType)
        return 0
      }

      const parsed = JSON.parse(stored)
      const reservations: Reservation[] = parsed.map((res: any) => ({
        ...res,
        date: new Date(res.date),
      }))

      console.log(`Migrating ${reservations.length} reservations for ${facilityType}...`)

      let successCount = 0
      for (const reservation of reservations) {
        try {
          await this.createReservation(reservation)
          successCount++
        } catch (error) {
          console.error('Failed to migrate reservation:', reservation.id, error)
        }
      }

      console.log(`Successfully migrated ${successCount}/${reservations.length} reservations`)
      
      // Optional: Clear localStorage after successful migration
      // localStorage.removeItem(STORAGE_KEY)

      return successCount
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  // =====================================================
  // WEEKLY ARCHIVE METHODS
  // =====================================================

  /**
   * Get all weekly archives, optionally filtered by facility type
   */
  static async getWeeklyArchives(facilityType?: FacilityType): Promise<WeeklyArchive[]> {
    try {
      let query = supabase
        .from('weekly_archive')
        .select('*')
      
      if (facilityType) {
        query = query.eq('facility_type', facilityType)
      }
      
      const { data, error } = await query.order('week_start', { ascending: false })

      if (error) {
        console.error('Error fetching weekly archives:', error)
        throw new Error(`Failed to fetch weekly archives: ${error.message}`)
      }

      return (data || []).map(row => ({
        id: row.id,
        weekStart: row.week_start,
        weekEnd: row.week_end,
        facilityType: row.facility_type as FacilityType,
        reservations: row.archived_data as Reservation[],
        savedAt: format(new Date(row.created_at), 'dd.MM.yyyy HH:mm'),
        createdAt: new Date(row.created_at)
      }))
    } catch (error) {
      console.error('Failed to fetch weekly archives:', error)
      throw error
    }
  }

  /**
   * Save current week to archive
   * If an archive for the same week+facility already exists, it will be updated
   */
  static async saveWeeklyArchive(
    weekStart: string,
    weekEnd: string,
    facilityType: FacilityType,
    reservations: Reservation[]
  ): Promise<WeeklyArchive> {
    try {
      // Check if archive already exists for this week + facility
      const { data: existing } = await supabase
        .from('weekly_archive')
        .select('id')
        .eq('week_start', weekStart)
        .eq('facility_type', facilityType)
        .maybeSingle()

      // Serialize reservations (convert Date objects to ISO strings)
      const serializedReservations = reservations.map(res => ({
        ...res,
        date: res.date.toISOString()
      }))

      const archiveData = {
        week_start: weekStart,
        week_end: weekEnd,
        facility_type: facilityType,
        archived_data: serializedReservations
      }

      if (existing) {
        // Update existing archive
        const { data, error } = await supabase
          .from('weekly_archive')
          .update(archiveData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating weekly archive:', error)
          throw new Error(`Failed to update weekly archive: ${error.message}`)
        }

        return {
          id: data.id,
          weekStart: data.week_start,
          weekEnd: data.week_end,
          facilityType: data.facility_type as FacilityType,
          reservations: data.archived_data as Reservation[],
          savedAt: format(new Date(data.created_at), 'dd.MM.yyyy HH:mm'),
          createdAt: new Date(data.created_at)
        }
      } else {
        // Create new archive
        const { data, error } = await supabase
          .from('weekly_archive')
          .insert(archiveData)
          .select()
          .single()

        if (error) {
          console.error('Error creating weekly archive:', error)
          throw new Error(`Failed to create weekly archive: ${error.message}`)
        }

        return {
          id: data.id,
          weekStart: data.week_start,
          weekEnd: data.week_end,
          facilityType: data.facility_type as FacilityType,
          reservations: data.archived_data as Reservation[],
          savedAt: format(new Date(data.created_at), 'dd.MM.yyyy HH:mm'),
          createdAt: new Date(data.created_at)
        }
      }
    } catch (error) {
      console.error('Failed to save weekly archive:', error)
      throw error
    }
  }

  /**
   * Delete a weekly archive
   */
  static async deleteWeeklyArchive(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('weekly_archive')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting weekly archive:', error)
        throw new Error(`Failed to delete weekly archive: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to delete weekly archive:', error)
      throw error
    }
  }

  /**
   * Reorganize all reservations to use consecutive tracks
   * Groups reservations by date/timeSlot and reassigns tracks so they are consecutive
   */
  static async reorganizeTracksToConsecutive(facilityType: FacilityType): Promise<number> {
    try {
      console.log(`Starting track reorganization for ${facilityType}...`)
      
      // Get all reservations for this facility
      const reservations = await this.getReservations(facilityType)
      
      if (reservations.length === 0) {
        console.log('No reservations to reorganize')
        return 0
      }

      // Get facility config
      const { FACILITY_CONFIGS } = await import('@/types/reservation')
      const facilityConfig = FACILITY_CONFIGS[facilityType]
      const totalTracks = facilityConfig.sections.length

      // Group reservations by date + timeSlot
      const groups = new Map<string, Reservation[]>()
      
      for (const reservation of reservations) {
        const key = `${reservation.date.toDateString()}_${reservation.startTime}-${reservation.endTime}`
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(reservation)
      }

      let updatedCount = 0

      // Process each group
      for (const [key, groupReservations] of groups.entries()) {
        // Sort reservations by contractor name for stable ordering
        groupReservations.sort((a, b) => a.contractor.localeCompare(b.contractor))

        let nextAvailableTrack = 1

        for (const reservation of groupReservations) {
          // Skip if closed - these should use all tracks
          if (reservation.isClosed) {
            // Ensure closed reservations use all tracks
            if (reservation.tracks.length !== totalTracks) {
              await this.updateReservation(reservation.id, {
                tracks: facilityConfig.sections
              })
              updatedCount++
            }
            continue
          }

          const trackCount = reservation.tracks.length

          // Check if we have enough space left
          if (nextAvailableTrack + trackCount - 1 > totalTracks) {
            console.warn(`Cannot fit reservation ${reservation.id} - not enough consecutive tracks left`)
            continue
          }

          // Assign consecutive tracks
          const newTracks: number[] = []
          for (let i = 0; i < trackCount; i++) {
            newTracks.push(nextAvailableTrack + i)
          }

          // Update only if tracks changed
          const tracksChanged = 
            newTracks.length !== reservation.tracks.length ||
            !newTracks.every((track, idx) => track === reservation.tracks[idx])

          if (tracksChanged) {
            await this.updateReservation(reservation.id, { tracks: newTracks })
            updatedCount++
            console.log(`Updated ${reservation.contractor}: ${reservation.tracks} → ${newTracks}`)
          }

          // Move to next available track position
          nextAvailableTrack += trackCount
        }
      }

      console.log(`Reorganization complete: ${updatedCount} reservations updated`)
      return updatedCount

    } catch (error) {
      console.error('Failed to reorganize tracks:', error)
      throw error
    }
  }
}