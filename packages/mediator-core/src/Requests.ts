const ResultType: unique symbol = Symbol("ResultType")

export abstract class AbstractRequest<TArgs, TResult> {

  constructor(
    readonly args: TArgs
  ) {
  }

  readonly [ResultType]: TResult = undefined!
}

export abstract class AbstractCommand<TArgs, TResult> extends AbstractRequest<TArgs, TResult> {
}

export abstract class AbstractQuery<TArgs, TResult> extends AbstractRequest<TArgs, TResult> {
}

export type ArgsOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = TArgs

export type ResultOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = TResult

export type ClassOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = TRequest["args"],
  TResult = TRequest[typeof ResultType],
> = { new(args: TArgs): TRequest }
