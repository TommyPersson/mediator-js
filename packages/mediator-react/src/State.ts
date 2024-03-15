import { Request, ArgsOf, ResultOf } from "@tommypersson/mediator-core";

export namespace States {

  export enum Kind {
    Pending = "pending",
    InProgress = "in_progress",
    Successful = "successful",
    Failed = "failed",
  }

  export interface Pending<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  > {
    readonly kind: Kind.Pending
    readonly isInProgress: false
    readonly args: null
    readonly result: null
    readonly error: null
  }

  export interface InProgress<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  > {
    readonly kind: Kind.InProgress
    readonly isInProgress: true
    readonly args: TArgs
    readonly result: null
    readonly error: null
  }

  export interface Successful<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  > {
    readonly kind: Kind.Successful
    readonly isInProgress: false
    readonly args: TArgs
    readonly result: TResult
    readonly error: null
  }

  export interface Failed<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  > {
    readonly kind: Kind.Failed
    readonly isInProgress: false
    readonly args: TArgs
    readonly result: null
    readonly error: Error
  }

  export function makePending<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(): Pending<TRequest> {
    return { kind: Kind.Pending, isInProgress: false, args: null, result: null, error: null }
  }

  export function makeInProgress<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>): InProgress<TRequest> {
    return { kind: Kind.InProgress, isInProgress: true, args, result: null, error: null }
  }

  export function makeSuccessful<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>, result: ResultOf<TRequest>): Successful<TRequest> {
    return { kind: Kind.Successful, isInProgress: false, args, result, error: null }
  }

  export function makeFailed<
    TRequest extends Request<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>, error: Error): Failed<TRequest> {
    return { kind: Kind.Failed, isInProgress: false, args, result: null, error }
  }

}

export type State<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> = States.Pending<TRequest>
  | States.InProgress<TRequest>
  | States.Successful<TRequest>
  | States.Failed<TRequest>
