/**
 * Migration Helper Component
 * One-time use component to help migrate data from localStorage to Supabase
 * Can be removed after migration is complete
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Cloud, Database, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ReservationService } from '@/services/reservationService'
import type { FacilityType } from '@/types/reservation'

interface MigrationHelperProps {
  facilityType: FacilityType
  onComplete?: () => void
}

export function MigrationHelper({ facilityType, onComplete }: MigrationHelperProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [migratedCount, setMigratedCount] = useState<number>(0)

  const handleMigrate = async () => {
    setStatus('loading')
    setMessage('Migracja w toku...')

    try {
      const count = await ReservationService.migrateFromLocalStorage(facilityType)
      setMigratedCount(count)
      setStatus('success')
      setMessage(`Pomyślnie przeniesiono ${count} rezerwacji do chmury!`)
      
      if (onComplete) {
        setTimeout(onComplete, 2000)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Nieznany błąd migracji')
    }
  }

  const getFacilityName = (type: FacilityType): string => {
    switch (type) {
      case 'track-6':
        return 'Bieżnia 6-torowa'
      case 'track-8':
        return 'Bieżnia 8-torowa'
      case 'rugby':
        return 'Boisko Rugby'
    }
  }

  // Check if there's data to migrate
  const STORAGE_KEY = `trackReservations_${facilityType}`
  const hasLocalData = localStorage.getItem(STORAGE_KEY) !== null

  if (!hasLocalData) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Brak danych do migracji</AlertTitle>
        <AlertDescription>
          Nie znaleziono danych w localStorage dla {getFacilityName(facilityType)}.
          Prawdopodobnie dane już zostały przeniesione lub aplikacja jest nowa.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <CardTitle>Migracja Danych</CardTitle>
        </div>
        <CardDescription>
          Przenieś dane z przeglądarki do chmury
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wykryto dane w localStorage</AlertTitle>
          <AlertDescription>
            Znaleziono lokalne dane dla <strong>{getFacilityName(facilityType)}</strong>.
            Kliknij poniżej, aby przenieść je do bezpiecznej chmury Supabase.
          </AlertDescription>
        </Alert>

        {status === 'success' && (
          <Alert variant="default" className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Sukces!</AlertTitle>
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Błąd migracji</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold mb-2">Co się stanie:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Dane zostaną skopiowane do Supabase</li>
            <li>Oryginalne dane pozostaną w przeglądarce</li>
            <li>Możesz usunąć lokalne dane po weryfikacji</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          onClick={handleMigrate}
          disabled={status === 'loading' || status === 'success'}
          className="flex-1"
        >
          {status === 'loading' ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Migracja...
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ukończono ({migratedCount})
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              Przenieś do chmury
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}