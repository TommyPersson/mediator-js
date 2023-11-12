import { v4 as uuid } from "uuid"

const ResultType: unique symbol = Symbol("ResultType")

export abstract class AbstractRequest<TArgs, TResult> {

  constructor(
    readonly args: TArgs,
    readonly instanceId: string = uuid(),
  ) {
  }

  readonly [ResultType]: TResult = undefined!
}

export abstract class AbstractCommand<TArgs, TResult> extends AbstractRequest<TArgs, TResult> {
}

export abstract class AbstractQuery<TArgs, TResult> extends AbstractRequest<TArgs, TResult> {
}

export type ArgsOf<TRequest extends (AbstractRequest<any, any> | AbstractCommand<any, any> | AbstractQuery<any, any>)> = TRequest["args"]

export type ResultOf<TRequest extends (AbstractRequest<any, any> | AbstractCommand<any, any> | AbstractQuery<any, any>)> = TRequest[typeof ResultType]

export type ClassOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> = { new(args: TArgs): TRequest }
