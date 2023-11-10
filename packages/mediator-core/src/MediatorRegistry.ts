import {
  CommandHandlerFactory, IRequestHandler,
  QueryHandlerFactory,
} from "./RequestHandlers"
import { CommandClass, ICommand, IQuery, IRequest, QueryClass, RequestClass } from "./Requests"

export interface IMediatorRegistry extends IRequestHandlerProvider {
  readonly middlewares: readonly any[]
}

export interface IRequestHandlerProvider {
  getHandlerFor<
    TRequest extends IRequest<any, any>,
  >(requestClass: RequestClass<TRequest>): IRequestHandler<TRequest> | null
}

export class DefaultMediatorRegistry implements IMediatorRegistry {

  private readonly _handlerMappings: RequestHandlerMappings = new RequestHandlerMappings()

  get middlewares(): readonly any[] {
    return undefined!
  }

  getHandlerFor<TRequest extends IRequest<any, any>>(requestClass: RequestClass<TRequest>): IRequestHandler<TRequest> | null {
    return (this._handlerMappings.get(requestClass))?.() ?? null
  }

  register<
    TRequest extends IRequest<any, any>
  >(requestClass: RequestClass<any, any>, handler: () => IRequestHandler<TRequest>): void {
    this._handlerMappings.add(requestClass, handler)
  }

  reset() {
    this._handlerMappings.reset()
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

