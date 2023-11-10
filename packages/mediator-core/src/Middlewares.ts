import { IRequestContext } from "./RequestContext"
import { AbstractRequest } from "./Requests"

export interface IMiddleware {
  priority: number

  handle<
    TRequest extends AbstractRequest<any, TResult>,
    TResult = any
  >(
    request: TRequest,
    context: IRequestContext,
    next: (request: TRequest, context: IRequestContext) => Promise<TResult>,
  ): Promise<TResult>
}
