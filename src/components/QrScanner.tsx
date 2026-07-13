import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { SecondaryButton } from './SecondaryButton'

interface QrScannerProps {
  onDecode: (text: string) => void
  onError?: (message: string) => void
}

const RUNNING = [Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED]

/**
 * Live QR decoder (spec §9). Uses html5-qrcode (never BarcodeDetector alone —
 * absent in Firefox/Safari). Includes an <input type=file capture> fallback so a
 * user can photograph the QR if live scanning fails — the single biggest iOS
 * risk. Requires a secure context (HTTPS) for camera access.
 */
export function QrScanner({ onDecode, onError }: QrScannerProps) {
  const regionId = `qr-region-${useId().replace(/:/g, '')}`
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const decodedRef = useRef(false)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Latest callbacks via refs so the camera effect can run ONCE (on mount) and
  // never restart when the parent re-creates its handlers — restart churn is a
  // main cause of "error opening the camera".
  const onDecodeRef = useRef(onDecode)
  const onErrorRef = useRef(onError)
  onDecodeRef.current = onDecode
  onErrorRef.current = onError

  useEffect(() => {
    const scanner = new Html5Qrcode(regionId, { verbose: false })
    scannerRef.current = scanner
    let startPromise: Promise<void> | null = null
    let tornDown = false

    // html5-qrcode's stop() THROWS synchronously if it isn't running yet, so we
    // (a) wait for start() to settle before stopping and (b) only stop from a
    // running state, wrapping everything so teardown can never throw. This is
    // what makes StrictMode's mount→cleanup→mount cycle safe.
    const teardown = async () => {
      if (tornDown) return
      tornDown = true
      try {
        await startPromise?.catch(() => {})
        if (scannerRef.current && RUNNING.includes(scanner.getState())) {
          await scanner.stop()
        }
      } catch {
        // already stopped / never started — ignore
      }
    }

    const handleSuccess = (decodedText: string) => {
      if (decodedRef.current) return
      decodedRef.current = true
      void teardown() // turn the camera off promptly
      onDecodeRef.current(decodedText)
    }

    startPromise = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleSuccess,
        () => {} // per-frame decode failures are noise — ignore
      )
      .then(() => {
        if (!tornDown) setStatus('scanning')
      })
      .catch((err: unknown) => {
        if (tornDown) return
        setStatus('error')
        onErrorRef.current?.(err instanceof Error ? err.message : 'CAMERA_UNAVAILABLE')
      })

    return () => {
      void teardown()
    }
  }, [regionId])

  const handleFile = async (file: File) => {
    if (decodedRef.current) return
    const scanner = scannerRef.current ?? new Html5Qrcode(regionId, { verbose: false })
    try {
      // Stop live scanning first if it's running (guarded — stop() can throw).
      try {
        if (RUNNING.includes(scanner.getState())) await scanner.stop()
      } catch {
        // ignore
      }
      const result = await scanner.scanFile(file, false)
      if (!decodedRef.current) {
        decodedRef.current = true
        onDecodeRef.current(result)
      }
    } catch {
      onErrorRef.current?.('No pudimos leer el código en la imagen.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={regionId}
        className="aspect-square w-full max-w-[280px] overflow-hidden rounded-[10px] bg-black/60"
      />
      {status === 'starting' && <p className="text-[13px] text-cream/70">Iniciando cámara…</p>}
      {status === 'error' && (
        <p className="text-center text-[13px] text-incorrect">
          No pudimos acceder a la cámara. Usa la opción de foto abajo.
        </p>
      )}

      {/* File / photo fallback (spec §9) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()}>
        Tomar / subir foto del código
      </SecondaryButton>
    </div>
  )
}
