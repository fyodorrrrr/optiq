import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(readFileSync(new URL('../src/api/connection.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText

function observer() {
  let now = 2_000_000
  let nextTimer = 0
  const timers = new Map()
  const api = {}
  runInNewContext(source, {
    exports: api,
    Date: { now: () => now },
    setTimeout: (callback, delay) => {
      const id = ++nextTimer
      timers.set(id, { callback, at: now + delay })
      return id
    },
    clearTimeout: id => timers.delete(id),
  })
  return {
    api,
    advance(milliseconds) {
      now += milliseconds
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.callback() }
      }
    },
  }
}

test('locks immediately while delaying the visible loader by 500 ms', () => {
  const { api, advance } = observer()
  let notifications = 0
  api.subscribeConnection(() => notifications++)
  const request = api.observeConnection()
  assert.equal(api.connectionPendingSnapshot(), true)
  assert.equal(notifications, 1)
  advance(499)
  assert.equal(api.connectionSnapshot(), false)
  advance(1)
  assert.equal(api.connectionSnapshot(), true)
  request.finish()
  assert.equal(api.connectionPendingSnapshot(), false)
  assert.equal(api.connectionSnapshot(), false)
})

test('response headers stop the loader but retain the lock until body completion', () => {
  const { api, advance } = observer()
  const request = api.observeConnection()
  advance(500)
  request.responded()
  assert.equal(api.connectionSnapshot(), false)
  assert.equal(api.connectionPendingSnapshot(), true)
  request.finish()
  assert.equal(api.connectionPendingSnapshot(), false)
})

test('all concurrent cold-start requests must settle before unlocking', () => {
  const { api } = observer()
  const first = api.observeConnection()
  const second = api.observeConnection()
  first.responded()
  first.finish()
  first.finish()
  assert.equal(api.connectionPendingSnapshot(), true)
  second.responded()
  second.finish()
  assert.equal(api.connectionPendingSnapshot(), false)
})

test('failed or aborted connections unlock and can retry without refresh', () => {
  const { api, advance } = observer()
  const failed = api.observeConnection()
  advance(500)
  failed.finish()
  assert.equal(api.connectionPendingSnapshot(), false)
  assert.equal(api.connectionSnapshot(), false)
  const retry = api.observeConnection()
  assert.equal(api.connectionPendingSnapshot(), true)
  advance(500)
  assert.equal(api.connectionSnapshot(), true)
  retry.responded()
  retry.finish()
  assert.equal(api.connectionPendingSnapshot(), false)
})

test('settling before the delay prevents a stale loader', () => {
  const { api, advance } = observer()
  api.observeConnection().finish()
  advance(500)
  assert.equal(api.connectionSnapshot(), false)
  assert.equal(api.connectionPendingSnapshot(), false)
})

test('warm processing stays interactive and a long-idle request locks again', () => {
  const { api, advance } = observer()
  const initial = api.observeConnection()
  initial.responded()
  initial.finish()
  const warm = api.observeConnection()
  assert.equal(api.connectionPendingSnapshot(), false)
  warm.finish()
  advance(14 * 60_000 + 1)
  const cold = api.observeConnection()
  assert.equal(api.connectionPendingSnapshot(), true)
  cold.finish()
})
