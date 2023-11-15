import { IMiddleware } from "./Middlewares"
import { IRequestHandler } from "./RequestHandlers"
import { AbstractRequest, ClassOf } from "./Requests"

export interface IMediatorRegistry extends IRequestHandlerProvider, IMiddlewareProvider {
}

export interface IRequestHandlerProvider {
  getHandlerFor<
    TRequest extends AbstractRequest<any, any>,
  >(requestClass: ClassOf<TRequest>): IRequestHandler<TRequest> | null
}

export interface IMiddlewareProvider {
  readonly middlewares: readonly IMiddleware[]
}

export class DefaultMediatorRegistry implements IMediatorRegistry, IMiddlewareProvider {

  private readonly _handlerMappings: RequestHandlerMappings = new RequestHandlerMappings()
  private _middlewares: IMiddleware[] = []

  get middlewares(): readonly IMiddleware[] {
    return this._middlewares
  }

  getHandlerFor<TRequest extends AbstractRequest<any, any>>(
    requestClass: ClassOf<TRequest>
  ): IRequestHandler<TRequest> | null {
    return (this._handlerMappings.get(requestClass))?.() ?? null
  }

  addHandler<
    TRequest extends AbstractRequest<any, any>
  >(requestClass: ClassOf<TRequest>, handler: () => IRequestHandler<TRequest>): void {
    this._handlerMappings.add(requestClass, handler)
  }

  addMiddleware(...middleware: IMiddleware[]) {
    this._middlewares.push(...middleware)
  }

  reset() {
    this._handlerMappings.reset()
    this._middlewares = []
  }
}

class RequestHandlerMappings {
  private mappings: { [requestType: string]: () => IRequestHandler<any> } = {}

  add(requestClass: ClassOf<any>, handlerFactory: () => IRequestHandler<any>): void {
    this.mappings[requestClass.name] = handlerFactory
  }

  get(requestClass: ClassOf<any>): (() => IRequestHandler<any>) | null {
    return this.mappings[requestClass.name] ?? null
  }

  reset() {
    this.mappings = {}
  }
}

export const NullRequestHandlerProvider: IRequestHandlerProvider = {
  getHandlerFor<TRequest extends AbstractRequest<any, any>>(requestClass: ClassOf<TRequest>): IRequestHandler<TRequest> | null {
    return null
  }
}

export const NullMiddlewareProvider: IMiddlewareProvider = {
  middlewares: []
}

export const MediatorRegistry = new DefaultMediatorRegistry()

