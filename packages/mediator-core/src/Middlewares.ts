import { IRequestContext } from "./RequestContext"
import { AbstractRequest, ResultOf } from "./Requests"

export interface IMiddleware {
  priority: number

  handle<
    TRequest extends AbstractRequest<any, TResult>,
    TResult = ResultOf<TRequest>
  >(
    request: TRequest,
    context: IRequestContext,
    next: (request: TRequest, context: IRequestContext) => Promise<TResult>,
  ): Promise<TResult>
}

