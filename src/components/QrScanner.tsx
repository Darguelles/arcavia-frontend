import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { SecondaryButton } from './SecondaryButton'

interface QrScannerProps {
  onDecode: (text: string) => void
  onError?: (message: string) => void
}

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

  useEffect(() => {
    let cancelled = false
    const scanner = new Html5Qrcode(regionId, { verbose: false })
    scannerRef.current = scanner

    const handleSuccess = (decodedText: string) => {
      if (decodedRef.current) return
      decodedRef.current = true
      // Stop before handing off so the camera light turns off promptly.
      scanner.stop().catch(() => {})
      onDecode(decodedText)
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleSuccess,
        () => {} // per-frame decode failures are noise — ignore
      )
      .then(() => {
        if (!cancelled) setStatus('scanning')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus('error')
        onError?.(err instanceof Error ? err.message : 'CAMERA_UNAVAILABLE')
      })

    return () => {
      cancelled = true
      // stop() rejects if never started; swallow.
      scanner.stop().catch(() => {})
      scanner.clear()
    }
  }, [regionId, onDecode, onError])

  const handleFile = async (file: File) => {
    if (decodedRef.current) return
    try {
      const scanner = scannerRef.current ?? new Html5Qrcode(regionId, { verbose: false })
      // Stop live scanning first if running.
      await scanner.stop().catch(() => {})
      const result = await scanner.scanFile(file, false)
      handleDecodedFromFile(result)
    } catch {
      onError?.('No pudimos leer el código en la imagen.')
    }
  }

  const handleDecodedFromFile = (text: string) => {
    if (decodedRef.current) return
    decodedRef.current = true
    onDecode(text)
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
