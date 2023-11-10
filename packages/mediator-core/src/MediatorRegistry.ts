import { IMiddleware } from "./Middlewares"
import { IRequestHandler } from "./RequestHandlers"
import { AbstractRequest, RequestClass } from "./Requests"

export interface IMediatorRegistry extends IRequestHandlerProvider {
  readonly middlewares: readonly any[]
}

export interface IRequestHandlerProvider {
  getHandlerFor<
    TRequest extends AbstractRequest<any, any>,
  >(requestClass: RequestClass<TRequest>): IRequestHandler<TRequest> | null
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

  getHandlerFor<TRequest extends AbstractRequest<any, any>>(requestClass: RequestClass<TRequest>): IRequestHandler<TRequest> | null {
    return (this._handlerMappings.get(requestClass))?.() ?? null
  }

  registerHandler<
    TRequest extends AbstractRequest<any, any>
  >(requestClass: RequestClass<any, any>, handler: () => IRequestHandler<TRequest>): void {
    this._handlerMappings.add(requestClass, handler)
  }

  registerMiddleware(...middleware: IMiddleware[]) {
    this._middlewares.push(...middleware)
  }

  reset() {
    this._handlerMappings.reset()
    this._middlewares = []
  }
}

class RequestHandlerMappings {
  private mappings: { [requestType: string]: () => IRequestHandler<any> } = {}

  add(requestClass: RequestClass<any, any>, handlerFactory: () => IRequestHandler<any>): void {
    this.mappings[requestClass.name] = handlerFactory
  }

  get(requestClass: RequestClass<any, any>): (() => IRequestHandler<any>) | null {
    return this.mappings[requestClass.name] ?? null
  }

  reset() {
    this.mappings = {}
  }
}


export const GlobalMediatorRegistry = new DefaultMediatorRegistry()

