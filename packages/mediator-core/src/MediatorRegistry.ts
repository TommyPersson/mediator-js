import { Middleware } from "./Middlewares.js"
import { RequestHandler } from "./RequestHandlers.js"
import { Request, ClassOf } from "./Requests.js"

export interface MediatorRegistry extends RequestHandlerProvider, MiddlewareProvider {
}

export interface RequestHandlerProvider {
  getHandlerFor<
    TRequest extends Request<any, any>,
  >(requestClass: ClassOf<TRequest>): RequestHandler<TRequest> | null
}

export interface MiddlewareProvider {
  readonly middlewares: readonly Middleware[]
}

export class DefaultMediatorRegistry implements MediatorRegistry, MiddlewareProvider {

  private readonly _handlerMappings: RequestHandlerMappings = new RequestHandlerMappings()
  private _middlewares: Middleware[] = []

  get middlewares(): readonly Middleware[] {
    return this._middlewares
  }

  getHandlerFor<TRequest extends Request<any, any>>(
    requestClass: ClassOf<TRequest>
  ): RequestHandler<TRequest> | null {
    return (this._handlerMappings.get(requestClass))?.() ?? null
  }

  addHandler<
    TRequest extends Request<any, any>
  >(requestClass: ClassOf<TRequest>, handler: () => RequestHandler<TRequest>): void {
    this._handlerMappings.add(requestClass, handler)
  }

  addMiddleware(...middleware: Middleware[]) {
    this._middlewares.push(...middleware)
  }

  reset() {
    this._handlerMappings.reset()
    this._middlewares = []
  }
}

class RequestHandlerMappings {
  private mappings: { [requestType: string]: () => RequestHandler<any> } = {}

  add(requestClass: ClassOf<any>, handlerFactory: () => RequestHandler<any>): void {
    this.mappings[requestClass.name] = handlerFactory
  }

  get(requestClass: ClassOf<any>): (() => RequestHandler<any>) | null {
    return this.mappings[requestClass.name] ?? null
  }

  reset() {
    this.mappings = {}
  }
}

export const NullRequestHandlerProvider: RequestHandlerProvider = {
  getHandlerFor<TRequest extends Request<any, any>>(requestClass: ClassOf<TRequest>): RequestHandler<TRequest> | null {
    return null
  }
}

export const NullMiddlewareProvider: MiddlewareProvider = {
  middlewares: []
}

export const GlobalMediatorRegistry = new DefaultMediatorRegistry()

