import { GlobalMediatorRegistry, IMiddlewareProvider, IRequestHandlerProvider } from "./MediatorRegistry"
import { IRequestContext, RequestContext } from "./RequestContext"
import { AbstractRequest, RequestClass } from "./Requests"

export interface IMediator {
  send<
    TRequest extends AbstractRequest<any, TResult>,
    TResult
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TResult,
    TArgs
  >(requestType: { new(args: TArgs): TRequest }, args: TArgs): Promise<TResult>
}

export class Mediator implements IMediator {

  constructor(
    private readonly handlerProvider: IRequestHandlerProvider = GlobalMediatorRegistry,
    private readonly middlewareProvider: IMiddlewareProvider = GlobalMediatorRegistry,
    private readonly baseContext: IRequestContext = RequestContext.empty()
  ) {
  }

  send<
    TRequest extends AbstractRequest<any, TResult>,
    TResult,
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TResult,
    TArgs,
  >(requestType: { new(args: TArgs): TRequest }, args: TArgs): Promise<TResult>

  async send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TResult,
    TArgs,
  >(arg1: { new(args: TArgs): TRequest } | TRequest, arg2?: TArgs): Promise<TResult> {
    if (arguments.length === 1) {
      return this.handle1(arg1 as TRequest)
    }
    if (arguments.length === 2) {
      return this.handle2(arg1 as { new(args: TArgs): TRequest }, arg2 as TArgs)
    }

    throw new Error("Invalid arguments")
  }

  private async handle1<TArgs, TResult>(request: AbstractRequest<TArgs, TResult>): Promise<TResult> {
    const handler = this.handlerProvider.getHandlerFor((request as any).constructor)
    if (!handler) {
      throw new Error(`No handler found for '${(request as any).constructor}'`)
    }

    const middleware = [...this.middlewareProvider.middlewares].sort((a, b) => b.priority - a.priority)

    const handlerFn = (request: AbstractRequest<TArgs, TResult>, context: IRequestContext) => handler.handle(request, context)
    const chain = middleware.reduce(
      (acc, curr) => (request, context) => curr.handle(request, context, acc),
      handlerFn,
    )

    const requestContext = this.baseContext.clone()

    const result = chain(request, requestContext)

    return result
  }

  private async handle2<TRequest extends AbstractRequest<any, TResult>, TArgs, TResult>(
    requestType: RequestClass<TRequest>,
    args: TArgs,
  ): Promise<TResult> {
    const request = new requestType(args)

    return this.handle1(request)
  }
}
