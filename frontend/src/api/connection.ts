// Observe real API requests without polling or waking the server in the background.
const listeners = new Set<() => void>()
const waiting = new Set<symbol>()
const pendingConnections = new Set<symbol>()
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
export function connectionPendingSnapshot() { return pendingConnections.size > 0 }

export function observeConnection() {
  const id = Symbol()
  // A long-idle tab can encounter another cold start after Render sleeps.
  if (Date.now() - lastResponse > 14 * 60_000) {
    const wasPending = pendingConnections.size > 0
    pendingConnections.add(id)
    waiting.add(id)
    if (!wasPending) listeners.forEach(listener => listener())
    if (!delay && !connecting) delay = setTimeout(() => {
      delay = undefined
      if (waiting.size) publish(true)
    }, 500)
  }
  function finish() {
    const wasPending = pendingConnections.size > 0
    pendingConnections.delete(id)
    if (wasPending && !pendingConnections.size) listeners.forEach(listener => listener())
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
      clearTimeout(delay)
      delay = undefined
      publish(false)
    },
    finish,
  }
}
