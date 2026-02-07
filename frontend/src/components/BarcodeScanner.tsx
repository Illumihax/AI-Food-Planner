import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff, AlertCircle, CheckCircle } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  autoStart?: boolean
}

export default function BarcodeScanner({ onScan, onError, autoStart = false }: BarcodeScannerProps) {
  const { t } = useTranslation()
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize scanner
    if (containerRef.current) {
      scannerRef.current = new Html5Qrcode('barcode-scanner')
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop().catch(console.error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (autoStart && hasPermission === null) {
      startScanning()
    }
  }, [autoStart])

  const startScanning = async () => {
    if (!scannerRef.current) return

    setError(null)
    setLastScanned(null)

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Success callback
          setLastScanned(decodedText)
          onScan(decodedText)
          
          // Optional: Stop after successful scan
          // stopScanning()
        },
        () => {
          // Error callback (called frequently when no barcode detected)
          // We don't need to handle this
        }
      )
      setIsScanning(true)
      setHasPermission(true)
    } catch (err: any) {
      console.error('Failed to start scanner:', err)
      setHasPermission(false)
      
      let errorMessage = t('barcode.errorGeneric')
      if (err.toString().includes('Permission')) {
        errorMessage = t('barcode.errorPermission')
      } else if (err.toString().includes('NotFoundError')) {
        errorMessage = t('barcode.errorNoCamera')
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop()
        }
        setIsScanning(false)
      } catch (err) {
        console.error('Failed to stop scanner:', err)
      }
    }
  }

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning()
    } else {
      startScanning()
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Scanner viewport */}
        <div 
          id="barcode-scanner"
          ref={containerRef}
          className="relative w-full bg-black"
          style={{ minHeight: isScanning ? '300px' : '0' }}
        />
        
        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {/* Last scanned */}
          {lastScanned && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {t('barcode.scanned')}: <span className="font-mono font-medium">{lastScanned}</span>
              </p>
            </div>
          )}
          
          {/* Start/Stop button */}
          <Button 
            onClick={toggleScanning} 
            variant={isScanning ? 'destructive' : 'default'}
            className="w-full"
          >
            {isScanning ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                {t('barcode.stopScanning')}
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {t('barcode.startScanning')}
              </>
            )}
          </Button>
          
          {/* Instructions */}
          {!isScanning && !error && (
            <p className="text-sm text-muted-foreground text-center">
              {t('barcode.instructions')}
            </p>
          )}
          
          {isScanning && (
            <p className="text-sm text-muted-foreground text-center">
              {t('barcode.scanning')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
