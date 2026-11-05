// Observe real API requests without polling or waking the server in the background.
const listeners = new Set<() => void>()
const waiting = new Set<symbol>()
let lastResponse = 0
let connecting = false
let delay: ReturnType<typeof setTimeout> | undefined

function publish(value: boolean) {
  if (connecting === value) return
  connecting = value
  listeners.forEach(listener => listener())
}

export function subscribeConnection(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function connectionSnapshot() { return connecting }

export function observeConnection() {
  const id = Symbol()
  // A long-idle tab can encounter another cold start after Render sleeps.
  if (Date.now() - lastResponse > 14 * 60_000) {
    waiting.add(id)
    if (!delay && !connecting) delay = setTimeout(() => {
      delay = undefined
      if (waiting.size) publish(true)
    }, 500)
  }
  function finish() {
    waiting.delete(id)
    if (!waiting.size) {
      clearTimeout(delay)
      delay = undefined
      publish(false)
    }
  }
  return {
    responded() {
      lastResponse = Date.now()
      waiting.clear()
      finish()
    },
    finish,
  }
}
