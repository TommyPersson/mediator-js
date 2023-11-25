import {
  IMiddlewareProvider,
  IRequestHandlerProvider,
  MediatorRegistry,
  NullMiddlewareProvider,
  NullRequestHandlerProvider
} from "./MediatorRegistry.js"
import { IRequestContext, RequestContext } from "./RequestContext.js"
import { AbstractRequest, ArgsOf, ClassOf, ResultOf } from "./Requests.js"

export interface IMediator {
  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(requestType: ClassOf<TRequest>, args: TArgs): Promise<TResult>
}

export interface MediatorConfig {
  readonly handlerProvider?: IRequestHandlerProvider
  readonly middlewareProvider?: IMiddlewareProvider
  readonly baseContext?: IRequestContext
}

export class Mediator implements IMediator {

  private readonly handlerProvider: IRequestHandlerProvider = MediatorRegistry
  private readonly middlewareProvider: IMiddlewareProvider = MediatorRegistry
  private readonly baseContext: IRequestContext = RequestContext.empty()

  constructor(config?: MediatorConfig) {
    this.handlerProvider = config?.handlerProvider ?? MediatorRegistry
    this.middlewareProvider = config?.middlewareProvider ?? MediatorRegistry
    this.baseContext = config?.baseContext ?? RequestContext.empty()
  }

  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(requestType: ClassOf<TRequest>, args: TArgs): Promise<TResult>

  async send<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TResult,
    TArgs,
  >(arg1: ClassOf<TRequest> | TRequest, arg2?: TArgs): Promise<TResult> {
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

    // TODO cache the chain by request type?

    const requestContext = this.baseContext.clone()

    const result = chain(request, requestContext)

    return result
  }

  private async handle2<TRequest extends AbstractRequest<TArgs, TResult>, TArgs, TResult>(
    requestType: ClassOf<TRequest>,
    args: TArgs,
  ): Promise<TResult> {
    const request = new requestType(args)

    return this.handle1(request)
  }
}

export const NullMediator = new Mediator({
  handlerProvider: NullRequestHandlerProvider,
  middlewareProvider: NullMiddlewareProvider,
})
