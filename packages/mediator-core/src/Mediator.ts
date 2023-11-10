import { GlobalMediatorRegistry, IRequestHandlerProvider } from "./MediatorRegistry"
import { RequestContext } from "./RequestContext"
import { AbstractQuery, AbstractRequest, IRequest, RequestClass } from "./Requests"

export interface IMediator {
  send<
    TCommand extends IRequest<any, TResult>,
    TResult
  >(request: TCommand): Promise<TResult>

  send<
    TCommand extends IRequest<TArgs, TResult>,
    TResult,
    TArgs
  >(requestType: { new(args: TArgs): TCommand }, args: TArgs): Promise<TResult>
}

export class Mediator implements IMediator {

  constructor(
    private readonly handlerProvider: IRequestHandlerProvider = GlobalMediatorRegistry
  ) {
  }

  send<
    TCommand extends IRequest<any, TResult>,
    TResult
  >(request: TCommand): Promise<TResult>

  send<
    TCommand extends IRequest<TArgs, TResult>,
    TResult,
    TArgs
  >(requestType: { new(args: TArgs): TCommand }, args: TArgs): Promise<TResult>

  async send<
    TQuery extends AbstractQuery<TArgs, TResult>,
    TResult,
    TArgs
  >(arg1: { new(args: TArgs): TQuery } | TQuery, arg2?: TArgs): Promise<TResult> {
    if (arguments.length === 1) {
      return this.handle1(arg1 as TQuery)
    }
    if (arguments.length === 2) {
      return this.handle2(arg1 as { new(args: TArgs): TQuery }, arg2 as TArgs)
    }

    throw new Error("Invalid arguments")
  }

  private async handle1<TArgs, TResult>(request: AbstractRequest<TArgs, TResult>): Promise<TResult> {
    const handler = this.handlerProvider.getHandlerFor((request as any).constructor)
    if (!handler) {
      throw new Error(`No handler found for '${(request as any).constructor}'`)
    }

    const requestContext = RequestContext.empty()
    const result = handler?.handle(request, requestContext)
    return result
  }

  private async handle2<TRequest extends AbstractRequest<any, TResult>, TArgs, TResult>(
    requestType: RequestClass<TRequest>,
    args: TArgs
  ): Promise<TResult> {
    const request = new requestType(args)

    return this.handle1(request)
  }
}
