const ResultType: unique symbol = Symbol("ResultType")

export abstract class Request<TArgs, TResult> {

  constructor(
    readonly args: TArgs
  ) {
  }

  readonly [ResultType]: TResult = undefined!
}

export abstract class Command<TArgs, TResult> extends Request<TArgs, TResult> {
}

export abstract class Query<TArgs, TResult> extends Request<TArgs, TResult> {
}

export type ArgsOf<
  TRequest extends Request<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = TArgs

export type ResultOf<
  TRequest extends Request<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = TResult

export type ClassOf<
  TRequest extends Request<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = { new(args: TArgs): TRequest }
