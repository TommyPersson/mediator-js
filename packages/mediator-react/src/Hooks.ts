import { AbstractCommand, AbstractQuery, AbstractRequest, ArgsOf, RequestClass } from "@tommypersson/mediator-core"
import { useCallback, useState, useEffect } from "react"
import { useMediator } from "./MediatorContext"
import { useDeepEqualMemo } from "./utils"

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

export interface RequestHookState<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"]
> {
  execute(args: TArgs): void

  state: RequestState
  error: Error | null
  result: TResult | null
}

export interface PreparedRequestHookState<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"]
> {
  execute(): void

  state: RequestState
  error: Error | null
  result: TResult | null
}

interface RequestOptions {
}

interface PreparedRequestOptions {
  immediate?: boolean
}

export function useRequest<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"],
>(
  requestClass: RequestClass<TRequest>,
  options?: RequestOptions
): RequestHookState<TRequest> {
  const mediator = useMediator()

  const [stateBag, setStateBag] = useState({
    state: RequestState.pending(),
    error: <Error | null>null,
    result: <TResult | null>null,
  })

  const execute = useCallback(async (args: TArgs) => {
    setStateBag({
      state: RequestState.inProgress(),
      error: null,
      result: null,
    })

    try {
      const result: TResult = await mediator.send(requestClass, args)
      setStateBag({
        state: RequestState.successful(),
        error: null,
        result: result,
      })
    } catch (e) {
      let error: Error
      if (e instanceof Error) {
        error = e
      } else {
        error = new Error(`Error during mediator request: ${e}`)
      }

      setStateBag({
        state: RequestState.failed(),
        error: error,
        result: null,
      })
    }
  }, [requestClass, mediator, setStateBag])

  return {
    execute,
    ...stateBag
  }
}

export function useQuery<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = TQuery["__resultType"],
>(
  queryClass: { new(args: TArgs): TQuery },
  options?: RequestOptions,
): RequestHookState<TQuery> {
  return useRequest(queryClass, options)
}

export function useCommand<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"],
>(
  commandClass: { new(args: TArgs): TCommand },
  options?: PreparedRequestOptions,
): RequestHookState<TCommand> {
  return useRequest(commandClass, options)
}

export function usePreparedRequest<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = TRequest["__resultType"],
>(
  requestClass: RequestClass<TRequest>,
  args: TArgs,
  options?: PreparedRequestOptions,
): PreparedRequestHookState<TRequest> {
  const original = useRequest(requestClass)

  const memoizedArgs = useDeepEqualMemo(() => args, [args])

  const execute = useCallback(() => {
    original.execute(memoizedArgs)
  }, [original.execute, memoizedArgs])

  useEffect(() => {
    if (options?.immediate) {
      execute()
    }
  }, [execute, options?.immediate])

  return {
    ...original,
    execute
  }
}

export function usePreparedQuery<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = TQuery["__resultType"],
>(
  queryClass: { new(args: TArgs): TQuery },
  args: TArgs,
  options?: PreparedRequestOptions,
): PreparedRequestHookState<TQuery> {
  return usePreparedRequest(queryClass, args, options)
}

export function usePreparedCommand<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"],
>(
  commandClass: { new(args: TArgs): TCommand },
  args: TArgs,
  options?: PreparedRequestOptions,
): PreparedRequestHookState<TCommand> {
  return usePreparedRequest(commandClass, args, options)
}
