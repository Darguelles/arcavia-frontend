import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDocumentVisibility, useWakeLock, watchAndPoll } from '../../src/lib/geoCheckin'

describe('watchAndPoll', () => {
  let watchPosition: ReturnType<typeof vi.fn>
  let clearWatch: ReturnType<typeof vi.fn>
  let getCurrentPosition: ReturnType<typeof vi.fn>

  const fixPosition = (
    lat: number,
    lng: number,
    accuracy = 10,
    altitude: number | null = null
  ) => ({
    coords: { latitude: lat, longitude: lng, accuracy, altitude },
  })

  beforeEach(() => {
    vi.useFakeTimers()
    watchPosition = vi.fn().mockReturnValue(1)
    clearWatch = vi.fn()
    getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', {
      geolocation: { watchPosition, clearWatch, getCurrentPosition },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reports GEOLOCATION_UNSUPPORTED when the API is absent', () => {
    vi.stubGlobal('navigator', {})
    const onFix = vi.fn()
    const onError = vi.fn()
    watchAndPoll(onFix, onError)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(onFix).not.toHaveBeenCalled()
  })

  it('forwards watchPosition fixes as RawFix', () => {
    const onFix = vi.fn()
    watchAndPoll(onFix, vi.fn())
    const successCb = watchPosition.mock.calls[0][0] as (p: unknown) => void
    successCb(fixPosition(-12.05, -77.03, 8, 100))
    expect(onFix).toHaveBeenCalledWith({ lat: -12.05, lng: -77.03, accuracy: 8, altitude: 100 })
  })

  it('polls getCurrentPosition on the configured interval', () => {
    const onFix = vi.fn()
    watchAndPoll(onFix, vi.fn(), 5000)
    expect(getCurrentPosition).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000)
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5000)
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('cleanup clears both the watch and the poll interval', () => {
    const cleanup = watchAndPoll(vi.fn(), vi.fn(), 5000)
    cleanup()
    expect(clearWatch).toHaveBeenCalledWith(1)
    vi.advanceTimersByTime(20000)
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })
})

describe('useWakeLock', () => {
  let request: ReturnType<typeof vi.fn>
  let release: ReturnType<typeof vi.fn>
  let listeners: Record<string, () => void>

  beforeEach(() => {
    listeners = {}
    release = vi.fn().mockResolvedValue(undefined)
    const sentinel = {
      release,
      addEventListener: (event: string, cb: () => void) => {
        listeners[event] = cb
      },
    }
    request = vi.fn().mockResolvedValue(sentinel)
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
    })
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
  })

  afterEach(() => {
    // @ts-expect-error test cleanup of a non-standard test property
    delete navigator.wakeLock
  })

  it('acquires a lock on mount and reports active', async () => {
    const { result } = renderHook(() => useWakeLock())
    await act(async () => {
      await Promise.resolve()
    })
    expect(request).toHaveBeenCalledWith('screen')
    expect(result.current.active).toBe(true)
  })

  it('releases the lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock())
    await act(async () => {
      await Promise.resolve()
    })
    unmount()
    await act(async () => {
      await Promise.resolve()
    })
    expect(release).toHaveBeenCalled()
  })

  it('degrades silently when wakeLock is unsupported', async () => {
    // @ts-expect-error test cleanup of a non-standard test property
    delete navigator.wakeLock
    const { result } = renderHook(() => useWakeLock())
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.active).toBe(false)
  })
})

describe('useDocumentVisibility', () => {
  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  it('reflects document.visibilityState and updates on change', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    const { result } = renderHook(() => useDocumentVisibility())
    expect(result.current).toBe('visible')

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe('hidden')
  })
})
