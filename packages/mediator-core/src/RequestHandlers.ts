import { IRequestContext } from "./RequestContext.js"
import { AbstractCommand, AbstractQuery, AbstractRequest, ArgsOf, ResultOf } from "./Requests.js"

export interface IRequestHandler<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  handle(request: TRequest, context: IRequestContext): Promise<TResult>
}

export interface ICommandHandler<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> extends IRequestHandler<TCommand, TArgs, TResult> {
  handle(command: TCommand, context: IRequestContext): Promise<TResult>
}

export interface IQueryHandler<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> extends IRequestHandler<TQuery, TArgs, TResult> {
  handle(query: TQuery, context: IRequestContext): Promise<TResult>
}


