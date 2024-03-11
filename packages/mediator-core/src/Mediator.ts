import {
  MiddlewareProvider,
  RequestHandlerProvider,
  GlobalMediatorRegistry,
  NullMiddlewareProvider,
  NullRequestHandlerProvider
} from "./MediatorRegistry.js"
import { RequestContext, DefaultRequestContext } from "./RequestContext.js"
import { Request, ArgsOf, ClassOf, ResultOf } from "./Requests.js"

export interface Mediator {
  send<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(requestType: ClassOf<TRequest>, args: ArgsOf<TRequest>): Promise<TResult>
}

export interface MediatorConfig {
  readonly handlerProvider?: RequestHandlerProvider
  readonly middlewareProvider?: MiddlewareProvider
  readonly baseContext?: RequestContext
}

export class DefaultMediator implements Mediator {

  private readonly handlerProvider: RequestHandlerProvider = GlobalMediatorRegistry
  private readonly middlewareProvider: MiddlewareProvider = GlobalMediatorRegistry
  private readonly baseContext: RequestContext = DefaultRequestContext.empty()

  constructor(config?: MediatorConfig) {
    this.handlerProvider = config?.handlerProvider ?? GlobalMediatorRegistry
    this.middlewareProvider = config?.middlewareProvider ?? GlobalMediatorRegistry
    this.baseContext = config?.baseContext ?? DefaultRequestContext.empty()
  }

  send<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(request: TRequest): Promise<TResult>

  send<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(requestType: ClassOf<TRequest>, args: ArgsOf<TRequest>): Promise<TResult>

  async send<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>
  >(arg1: ClassOf<TRequest> | TRequest, arg2?: ArgsOf<TRequest>): Promise<TResult> {
    if (!arg2) {
      return this.handle1(arg1 as TRequest)
    }
    if (arg2) {
      return this.handle2(arg1 as { new(args: TArgs): TRequest }, arg2 as TArgs)
    }

    throw new Error("Invalid arguments")
  }

  private async handle1<TArgs, TResult>(request: Request<TArgs, TResult>): Promise<TResult> {
    const handler = this.handlerProvider.getHandlerFor((request as any).constructor)
    if (!handler) {
      throw new Error(`No handler found for '${(request as any).constructor}'`)
    }

    const middleware = [...this.middlewareProvider.middlewares].sort((a, b) => b.priority - a.priority)

    const handlerFn = (request: Request<TArgs, TResult>, context: RequestContext) => handler.handle(request, context)
    const chain = middleware.reduce(
      (acc, curr) => (request, context) => curr.handle(request, context, acc),
      handlerFn,
    )

    // TODO cache the chain by request type?

    const requestContext = this.baseContext.clone()

    const result = chain(request, requestContext)

    return result
  }

  private async handle2<TRequest extends Request<TArgs, TResult>, TArgs, TResult>(
    requestType: ClassOf<TRequest>,
    args: TArgs,
  ): Promise<TResult> {
    const request = new requestType(args)

    return this.handle1(request)
  }
}

export const NullMediator = new DefaultMediator({
  handlerProvider: NullRequestHandlerProvider,
  middlewareProvider: NullMiddlewareProvider,
})
