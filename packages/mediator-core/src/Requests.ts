import { v4 as uuid } from "uuid"

export interface IRequest<TArgs, TResult> {
  readonly args: TArgs
  readonly instanceId: string

  readonly __resultType: TResult
}

export abstract class AbstractRequest<TArgs, TResult>
  implements IRequest<TArgs, TResult> {

  constructor(
    readonly args: TArgs,
    readonly instanceId: string = uuid(),
  ) {
  }

  readonly __resultType: TResult = undefined!
}

export interface ICommand<TArgs, TResult>
  extends IRequest<TArgs, TResult> {
  readonly __resultType: TResult
}

export abstract class AbstractCommand<TArgs, TResult>
  implements ICommand<TArgs, TResult> {
  constructor(
    readonly args: TArgs,
    readonly instanceId: string = uuid(),
  ) {
  }

  readonly __resultType: TResult = undefined!
  private _nominal!: void
}

export interface IQuery<TArgs, TResult>
  extends IRequest<TArgs, TResult> {
  readonly __resultType: TResult
}

export abstract class AbstractQuery<TArgs, TResult>
  extends AbstractRequest<TArgs, TResult>
  implements IQuery<TArgs, TResult> {
  readonly __resultType: TResult = undefined!
  constructor(
    readonly args: TArgs,
    readonly instanceId: string = uuid(),
  ) {
    super(args, instanceId)
  }
  private _nominal!: void
}

export type ArgsOf<TRequest extends IRequest<any, any> | ICommand<any, any> | IQuery<any, any>> = TRequest["args"]

export type RequestClass<
  TRequest extends IRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"]
> = { new(args: TArgs): TRequest }

export type CommandClass<TArgs, TResult> = { new(args: TArgs): ICommand<TArgs, TResult> }

export type QueryClass<TArgs, TResult> = { new(args: TArgs): IQuery<TArgs, TResult> }
