import { AbstractRequest, ArgsOf, ResultOf } from "@tommypersson/mediator-core";

export enum RequestStates {
  Pending = "pending",
  InProgress = "in_progress",
  Successful = "successful",
  Failed = "failed",
}

export abstract class RequestState<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  abstract readonly kind: RequestStates

  static pending<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(): RequestState<TRequest> {
    return new Pending()
  }

  static inProgress<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>): RequestState<TRequest> {
    return new InProgress(args)
  }

  static successful<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>, result: ResultOf<TRequest>): RequestState<TRequest> {
    return new Successful(args, result)
  }

  static failed<
    TRequest extends AbstractRequest<TArgs, TResult>,
    TArgs = ArgsOf<TRequest>,
    TResult = ResultOf<TRequest>,
  >(args: ArgsOf<TRequest>, error: Error): RequestState<any> {
    return new Failed(args, error)
  }

  isPending(): this is Pending<TRequest> {
    return this instanceof Pending
  }

  isInProgress(): this is InProgress<TRequest> {
    return this instanceof InProgress
  }

  isSuccessful(): this is Successful<TRequest> {
    return this instanceof Successful
  }

  isFailed(): this is Failed<TRequest> {
    return this instanceof Failed
  }
}

export class Pending<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends RequestState<TRequest, TArgs, TResult> {

  readonly kind = RequestStates.Pending
}

export class InProgress<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends RequestState<TRequest, TArgs, TResult> {

  readonly kind = RequestStates.InProgress

  constructor(readonly args: ArgsOf<TRequest>) {
    super();
  }
}

export class Successful<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends RequestState<TRequest, TArgs, TResult> {

  readonly kind = RequestStates.Successful

  constructor(
    readonly args: ArgsOf<TRequest>,
    readonly result: ResultOf<TRequest>
  ) {
    super();
  }
}

export class Failed<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends RequestState<TRequest, TArgs, TResult> {

  readonly kind = RequestStates.Failed

  constructor(
    readonly args: ArgsOf<TRequest>,
    readonly error: Error,
  ) {
    super();
  }
}
