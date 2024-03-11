import { RequestContext } from "./RequestContext.js"
import { Request, ResultOf } from "./Requests.js"

export interface Middleware {
  priority: number

  handle<
    TRequest extends Request<any, TResult>,
    TResult = ResultOf<TRequest>
  >(
    request: TRequest,
    context: RequestContext,
    next: (request: TRequest, context: RequestContext) => Promise<TResult>,
  ): Promise<TResult>
}

