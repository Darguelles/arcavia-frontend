import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from '../../src/lib/useUserLocation'

describe('useUserLocation', () => {
  let watchPosition: ReturnType<typeof vi.fn>
  let clearWatch: ReturnType<typeof vi.fn>
  let getCurrentPosition: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Secure context so the hook proceeds to watch (a LAN-IP http origin would
    // be 'insecure' and short-circuit before touching geolocation).
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
    watchPosition = vi.fn().mockReturnValue(7)
    clearWatch = vi.fn()
    getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch, getCurrentPosition } })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('exposes a fix from watchPosition and reports granted', () => {
    const { result } = renderHook(() => useUserLocation())
    const successCb = watchPosition.mock.calls[0][0] as (p: unknown) => void
    act(() => {
      successCb({ coords: { latitude: -12.05, longitude: -77.03, accuracy: 18 } })
    })
    expect(result.current.location).toEqual({ lat: -12.05, lng: -77.03, accuracy: 18 })
    expect(result.current.status).toBe('granted')
  })

  it('uses coarse (non-high-accuracy) options to save battery', () => {
    renderHook(() => useUserLocation())
    const options = watchPosition.mock.calls[0][2] as PositionOptions
    expect(options.enableHighAccuracy).toBe(false)
  })

  it('reports denied without a location', () => {
    const { result } = renderHook(() => useUserLocation())
    const errorCb = watchPosition.mock.calls[0][1] as (e: unknown) => void
    act(() => {
      errorCb({ code: 1, PERMISSION_DENIED: 1 })
    })
    expect(result.current.status).toBe('denied')
    expect(result.current.location).toBeNull()
  })

  it('reports unavailable for non-permission errors', () => {
    const { result } = renderHook(() => useUserLocation())
    const errorCb = watchPosition.mock.calls[0][1] as (e: unknown) => void
    act(() => {
      errorCb({ code: 2, PERMISSION_DENIED: 1 })
    })
    expect(result.current.status).toBe('unavailable')
  })

  it('reports insecure and never watches on an insecure context', () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })
    const { result } = renderHook(() => useUserLocation())
    expect(result.current.status).toBe('insecure')
    expect(watchPosition).not.toHaveBeenCalled()
  })

  it('request() actively asks via getCurrentPosition', () => {
    const { result } = renderHook(() => useUserLocation())
    act(() => result.current.request())
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    const successCb = getCurrentPosition.mock.calls[0][0] as (p: unknown) => void
    act(() => {
      successCb({ coords: { latitude: 1, longitude: 2, accuracy: 5 } })
    })
    expect(result.current.status).toBe('granted')
  })

  it('does not start a watch when disabled', () => {
    renderHook(() => useUserLocation(false))
    expect(watchPosition).not.toHaveBeenCalled()
  })

  it('clears the watch on unmount', () => {
    const { unmount } = renderHook(() => useUserLocation())
    unmount()
    expect(clearWatch).toHaveBeenCalledWith(7)
  })

  it('reports unsupported when geolocation is absent', () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useUserLocation())
    expect(result.current.status).toBe('unsupported')
  })
})
