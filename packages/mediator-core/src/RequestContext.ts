export class RequestContextKey<T> {
  constructor(readonly id: string) {
  }
}

export interface RequestContext {
  clone(): RequestContext

  get<T>(key: RequestContextKey<T>): T

  put<T>(key: RequestContextKey<T>, value: T): void

  has<T>(key: RequestContextKey<T>): boolean
}

export class DefaultRequestContext implements RequestContext {
  private readonly map: Map<string, any>

  private constructor(
    map?: Map<string, any>,
  ) {
    this.map = new Map<string, any>(map)
  }

  static empty(): RequestContext {
    return new DefaultRequestContext()
  }

  clone(): RequestContext {
    return new DefaultRequestContext(this.map)
  }

  get<T>(key: RequestContextKey<T>): T {
    return this.map.get(key.id) as T
  }

  has<T>(key: RequestContextKey<T>): boolean {
    return this.map.has(key.id)
  }

  put<T>(key: RequestContextKey<T>, value: T): void {
    this.map.set(key.id, value)
  }
}
