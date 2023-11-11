import { useState } from "react"
import { dequal } from "dequal"

export class Deferred<T> extends Promise<T> {
  private _resolve!: (value: T) => void
  private _reject!: (error: Error) => void

  constructor(executor?: any) {
    let _resolve!: (value: T) => void
    let _reject!: (error: Error) => void

    let executor2 = executor ?? ((resolve: (value: T) => void, reject: (error: Error) => void) => {
      _resolve = resolve
      _reject = reject
    })

    super(executor2)

    this._resolve = _resolve
    this._reject = _reject
  }

  resolve(value: T) {
    this._resolve(value)
  }

  reject(error: Error) {
    this._reject(error)
  }
}


export function useDeepEqualMemo<T>(fn: () => T, deps: any[]) {
  const [state, setState] = useState(fn())
  const [oldDeps, setOldDeps] = useState(deps)

  if (!dequal(oldDeps, deps)) {
    setOldDeps(deps)
    setState(fn())
  }

  return state
}
