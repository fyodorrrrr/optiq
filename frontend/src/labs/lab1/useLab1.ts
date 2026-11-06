import { resizeError } from './resizeLimits'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getSample, loadImage, runExperiment, sampleFile } from './api'
import type { ExperimentResult, Frame, Operation, Sample } from './api'

export interface Fields {
  x: string; y: string; width: string; height: string
  color: string; intensity: string; interpolation: string; keepRatio: boolean
}

const initialFields: Fields = { x: '0', y: '0', width: '320', height: '240', color: '#ff00aa', intensity: '200', interpolation: 'linear', keepRatio: true }

export default function useLab1() {
  const [source, setSource] = useState<{ file: File; frame: Frame; name: string } | null>(null)
  const [operation, setOperation] = useState<Operation>('inspect')
  const [settings, setSettings] = useState<Partial<Record<Operation, Fields>>>({})
  const [pixelSelections, setPixelSelections] = useState<Partial<Record<Operation, boolean>>>({})
  const fields = settings[operation] ?? initialFields
  const [resultIsPrevious, setResultIsPrevious] = useState(false)
  const [output, setOutput] = useState<ExperimentResult | null>(null)
  const [rotationTurns, setRotationTurns] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const active = useRef<AbortController | null>(null)

  const begin = useCallback((clearOutput = false) => {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    if (clearOutput) {
      setOutput(null)
      setResultIsPrevious(false)
    }
    return controller
  }, [])

  const acceptSource = useCallback((frame: Frame, file: File, name: string) => {
    setSource({ frame, file, name })
    setPixelSelections({})
    const defaults = { ...initialFields, width: String(Math.max(1, Math.floor(frame.width / 2))), height: String(Math.max(1, Math.floor(frame.height / 2))) }
    setSettings(Object.fromEntries(['inspect', 'edit', 'grayscale', 'crop', 'resize', 'rotate'].map(key => [key, { ...defaults }])))
    setResultIsPrevious(false)
    setRotationTurns(0)
  }, [])

  const loadSample = useCallback(async (kind: Sample) => {
    const controller = begin(true)
    try {
      const frame = await getSample(kind, controller.signal)
      if (!controller.signal.aborted) acceptSource(frame, sampleFile(frame), kind === 'mascot' ? 'Optiq mascot · sample' : `${kind === 'color' ? 'Color' : 'Grayscale'} study · sample`)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The sample could not load.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }, [begin, acceptSource])

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    getSample('mascot', controller.signal).then(frame => {
      if (!controller.signal.aborted) acceptSource(frame, sampleFile(frame), 'Optiq mascot · sample')
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The sample could not load.')
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false)
    })
    return () => active.current?.abort()
  }, [acceptSource])

  async function upload(file: File) {
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG or JPEG no larger than 5 MiB.')
      return
    }
    const controller = begin(true)
    try {
      const frame = await loadImage(file, controller.signal)
      if (!controller.signal.aborted) acceptSource(frame, file, file.name)
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The image could not load.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  function reset() {
    const wasBusy = busy
    active.current?.abort()
    setBusy(false)
    setOutput(null)
    setError('')
    setNotice(wasBusy ? 'Processing cancelled. Choose settings and run again when ready.' : '')
    setResultIsPrevious(false)
    setRotationTurns(0)
  }

  function invalidateResult() {
    active.current?.abort()
    setBusy(false)
    setError('')
    setNotice('')
    setResultIsPrevious(true)
  }

  function select(next: Operation) {
    if (next === operation) return
    reset()
    setNotice('')
    setOperation(next)
  }

  function change(key: keyof Fields, value: string | boolean) {
    invalidateResult()
    if ((operation === 'inspect' || operation === 'edit') && (key === 'x' || key === 'y')) {
      setPixelSelections(all => ({ ...all, [operation]: true }))
    }
    setSettings(all => {
      const previous = all[operation] ?? initialFields
      const next = { ...previous, [key]: value }
      if (source && operation === 'resize' && previous.keepRatio && (key === 'width' || key === 'height') && value !== '') {
        const ratio = source.frame.width / source.frame.height
        if (key === 'width') next.height = String(Math.max(1, Math.round(Number(value) / ratio)))
        else next.width = String(Math.max(1, Math.round(Number(value) * ratio)))
      }
      if (source && key === 'keepRatio' && value === true) {
        next.height = String(Math.max(1, Math.round(Number(previous.width) * source.frame.height / source.frame.width)))
      }
      return { ...all, [operation]: next }
    })
  }

  function pick(x: number, y: number) {
    invalidateResult()
    setPixelSelections(all => ({ ...all, [operation]: true }))
    setSettings(all => ({ ...all, [operation]: { ...(all[operation] ?? initialFields), x: String(x), y: String(y) } }))
  }

  async function run() {
    if (!source || busy) return
    const controller = begin()
    try {
      const settings: Record<string, unknown> = { operation }
      function number(key: 'x' | 'y' | 'width' | 'height' | 'intensity') {
        if (fields[key].trim() === '' || !Number.isInteger(Number(fields[key]))) throw new Error('Use whole numbers for coordinates, dimensions, and intensity.')
        return Number(fields[key])
      }
      if (operation === 'inspect' || operation === 'edit' || operation === 'crop') Object.assign(settings, { x: number('x'), y: number('y') })
      if (operation === 'crop' || operation === 'resize') Object.assign(settings, { width: number('width'), height: number('height') })
      if (operation === 'resize') {
        const error = resizeError(Number(settings.width), Number(settings.height))
        if (error) throw new Error(error)
        settings.interpolation = fields.interpolation
      }
      if (operation === 'rotate') settings.quarter_turns = (rotationTurns + 1) % 4
      if (operation === 'edit') {
        if (source.frame.channels === 1) settings.intensity = number('intensity')
        else settings.color = [1, 3, 5].map(offset => parseInt(fields.color.slice(offset, offset + 2), 16))
      }
      const response = await runExperiment(source.file, settings, controller.signal)
      if (!controller.signal.aborted) {
        setOutput(response)
        if (response.pixel) setPixelSelections(all => ({ ...all, [operation]: true }))
        setResultIsPrevious(false)
        if (operation === 'rotate') setRotationTurns(Number(response.parameters.quarter_turns))
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Processing failed. Try again.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return { notice, source, operation, fields, output, rotationTurns, resultIsPrevious, pixelSelected: pixelSelections[operation] ?? false, busy, error, loadSample, upload, select, change, pick, run, reset }
}
