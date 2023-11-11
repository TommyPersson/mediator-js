export enum RequestStates {
  Pending = "pending",
  InProgress = "in_progress",
  Successful = "successful",
  Failed = "failed",
}

export class RequestState {
  private constructor(
    private readonly _value: RequestStates,
  ) {
  }

  static from(state: RequestStates): RequestState {
    return new RequestState(state)
  }

  static pending(): RequestState {
    return RequestState.from(RequestStates.Pending)
  }

  static inProgress(): RequestState {
    return RequestState.from(RequestStates.InProgress)
  }

  static successful(): RequestState {
    return RequestState.from(RequestStates.Successful)
  }

  static failed(): RequestState {
    return RequestState.from(RequestStates.Failed)
  }

  get value(): RequestStates {
    return this._value
  }

  isPending() {
    return this._value === RequestStates.Pending
  }

  isInProgress() {
    return this._value === RequestStates.InProgress
  }

  isSuccessful() {
    return this._value === RequestStates.Successful
  }

  isFailed() {
    return this._value === RequestStates.Failed
  }
}
