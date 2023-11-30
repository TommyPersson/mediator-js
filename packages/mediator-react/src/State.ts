import { AbstractRequest, ArgsOf, ResultOf } from "@tommypersson/mediator-core";

export enum StateKind {
  Pending = "pending",
  InProgress = "in_progress",
  Successful = "successful",
  Failed = "failed",
}

export interface Pending<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  readonly kind: StateKind.Pending
  readonly isInProgress: false
  readonly args: null
  readonly result: null
  readonly error: null
}

export interface InProgress<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  readonly kind: StateKind.InProgress
  readonly isInProgress: true
  readonly args: TArgs
  readonly result: null
  readonly error: null
}

export interface Successful<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  readonly kind: StateKind.Successful
  readonly isInProgress: false
  readonly args: TArgs
  readonly result: TResult
  readonly error: null
}

export interface Failed<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  readonly kind: StateKind.Failed
  readonly isInProgress: false
  readonly args: TArgs
  readonly result: null
  readonly error: Error
}

export type State<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> = Pending<TRequest> | InProgress<TRequest> | Successful<TRequest> | Failed<TRequest>

export function makePending<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(): Pending<TRequest> {
  return { kind: StateKind.Pending, isInProgress: false, args: null, result: null, error: null }
}

export function makeInProgress<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(args: ArgsOf<TRequest>): InProgress<TRequest> {
  return { kind: StateKind.InProgress, isInProgress: true, args, result: null, error: null }
}

export function makeSuccessful<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(args: ArgsOf<TRequest>, result: ResultOf<TRequest>): Successful<TRequest> {
  return { kind: StateKind.Successful, isInProgress: false, args, result, error: null }
}

export function makeFailed<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(args: ArgsOf<TRequest>, error: Error): Failed<TRequest> {
  return { kind: StateKind.Failed, isInProgress: false, args, result: null, error }
}
