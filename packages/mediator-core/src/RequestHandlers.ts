import { RequestContext } from "./RequestContext.js"
import { Command, Query, Request, ArgsOf, ResultOf } from "./Requests.js"

export interface RequestHandler<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  handle(request: TRequest, context: RequestContext): Promise<TResult>
}

export interface CommandHandler<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> extends RequestHandler<TCommand, TArgs, TResult> {
  handle(command: TCommand, context: RequestContext): Promise<TResult>
}

export interface QueryHandler<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> extends RequestHandler<TQuery, TArgs, TResult> {
  handle(query: TQuery, context: RequestContext): Promise<TResult>
}


