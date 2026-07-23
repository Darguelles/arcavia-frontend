import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from '../../src/lib/useUserLocation'

describe('useUserLocation', () => {
  let watchPosition: ReturnType<typeof vi.fn>
  let clearWatch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    watchPosition = vi.fn().mockReturnValue(7)
    clearWatch = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('exposes a fix from watchPosition', () => {
    const { result } = renderHook(() => useUserLocation())
    const successCb = watchPosition.mock.calls[0][0] as (p: unknown) => void
    act(() => {
      successCb({ coords: { latitude: -12.05, longitude: -77.03, accuracy: 18 } })
    })
    expect(result.current.location).toEqual({ lat: -12.05, lng: -77.03, accuracy: 18 })
    expect(result.current.error).toBeNull()
  })

  it('uses coarse (non-high-accuracy) options to save battery', () => {
    renderHook(() => useUserLocation())
    const options = watchPosition.mock.calls[0][2] as PositionOptions
    expect(options.enableHighAccuracy).toBe(false)
  })

  it('reports a denied error without a location', () => {
    const { result } = renderHook(() => useUserLocation())
    const errorCb = watchPosition.mock.calls[0][1] as (e: unknown) => void
    act(() => {
      errorCb({ code: 1, PERMISSION_DENIED: 1 })
    })
    expect(result.current.error).toBe('denied')
    expect(result.current.location).toBeNull()
  })

  it('reports unavailable for non-permission errors', () => {
    const { result } = renderHook(() => useUserLocation())
    const errorCb = watchPosition.mock.calls[0][1] as (e: unknown) => void
    act(() => {
      errorCb({ code: 2, PERMISSION_DENIED: 1 })
    })
    expect(result.current.error).toBe('unavailable')
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

  it('reports unavailable when geolocation is absent', () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useUserLocation())
    expect(result.current.error).toBe('unavailable')
  })
})
