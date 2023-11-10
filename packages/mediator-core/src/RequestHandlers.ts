import { IRequestContext } from "./RequestContext"
import { IRequest, ArgsOf, IQuery, ICommand, AbstractCommand, AbstractQuery } from "./Requests"

export interface IRequestHandler<
  TRequest extends IRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"]
> {
  handle(request: TRequest, context: IRequestContext): Promise<TResult>
}

export interface ICommandHandler<
  TCommand extends ICommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"]
> extends IRequestHandler<TCommand, TArgs, TResult> {
  handle(command: TCommand, context: IRequestContext): Promise<TResult>
}

export interface IQueryHandler<
  TQuery extends IQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = TQuery["__resultType"]
> extends IRequestHandler<TQuery, TArgs, TResult> {
  handle(query: TQuery, context: IRequestContext): Promise<TResult>
}

export abstract class AbstractRequestHandler<
  TRequest extends IRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"]
> implements IRequestHandler<TRequest, TArgs, TResult> {
  handle(request: TRequest, context: IRequestContext): Promise<TResult> {
    return this.doHandle(request, context)
  }

  abstract doHandle(request: TRequest, context: IRequestContext): Promise<TResult>
}

export abstract class AbstractCommandHandler<
  TCommand extends ICommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"]
> extends AbstractRequestHandler<TCommand, TArgs, TResult>
  implements ICommandHandler<TCommand, TArgs, TResult> {
  abstract doHandle(command: TCommand, context: IRequestContext): Promise<TResult>

  private _nominal!: void
}

export abstract class AbstractQueryHandler<
  TQuery extends IQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = TQuery["__resultType"]
> extends AbstractRequestHandler<TQuery, TArgs, TResult>
  implements IQueryHandler<TQuery, TArgs, TResult> {
  abstract doHandle(query: TQuery, context: IRequestContext): Promise<TResult>

  private _nominal!: void
}

export type CommandHandlerFactory<
  TCommand extends ICommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"]
> = () => ICommandHandler<TCommand>


export type QueryHandlerFactory<
  TQuery extends IQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = TQuery["__resultType"]
> = () => IQueryHandler<TQuery>


