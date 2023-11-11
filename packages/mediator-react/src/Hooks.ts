import { AbstractCommand, AbstractQuery, AbstractRequest, ArgsOf, RequestClass } from "@tommypersson/mediator-core"
import { useCallback, useState, useEffect } from "react"
import { useMediator } from "./MediatorContext"
import { RequestState } from "./RequestState"
import { useDeepEqualMemo } from "./utils"


export interface RequestHook<
  TRequest extends AbstractRequest<TArgs, TValue>,
  TArgs = ArgsOf<TRequest>,
  TValue = TRequest["__resultType"]
> {
  execute(args: TArgs): void

  state: RequestState
  error: Error | null
  value: TValue | null
}

export type QueryHook<
  TQuery extends AbstractQuery<TArgs, TValue>,
  TArgs = ArgsOf<TQuery>,
  TValue = TQuery["__resultType"]
> = RequestHook<TQuery, TArgs, TValue>

export type CommandHook<
  TCommand extends AbstractCommand<TArgs, TValue>,
  TArgs = ArgsOf<TCommand>,
  TValue = TCommand["__resultType"]
> = RequestHook<TCommand, TArgs, TValue>

export interface PreparedRequestHook<
  TRequest extends AbstractRequest<TArgs, TValue>,
  TArgs = ArgsOf<TRequest>,
  TValue = TRequest["__resultType"]
> {
  execute(): void

  state: RequestState
  error: Error | null
  value: TValue | null
}

export type PreparedQueryHook<
  TQuery extends AbstractQuery<TArgs, TValue>,
  TArgs = ArgsOf<TQuery>,
  TValue = TQuery["__resultType"]
> = PreparedRequestHook<TQuery, TArgs, TValue>

export type PreparedCommandHook<
  TCommand extends AbstractCommand<TArgs, TValue>,
  TArgs = ArgsOf<TCommand>,
  TValue = TCommand["__resultType"]
> = PreparedRequestHook<TCommand, TArgs, TValue>

interface RequestOptions {
}

interface PreparedRequestOptions {
  immediate?: boolean
}

export function useRequest<
  TRequest extends AbstractRequest<TArgs, TValue>,
  TArgs = ArgsOf<TRequest>,
  TValue = TRequest["__resultType"],
>(
  requestClass: RequestClass<TRequest>,
  options?: RequestOptions
): RequestHook<TRequest> {
  const mediator = useMediator()

  const [stateBag, setStateBag] = useState({
    state: RequestState.pending(),
    error: <Error | null>null,
    value: <TValue | null>null,
  })

  const execute = useCallback(async (args: TArgs) => {
    setStateBag({
      state: RequestState.inProgress(),
      error: null,
      value: null,
    })

    try {
      const value: TValue = await mediator.send(requestClass, args)
      setStateBag({
        state: RequestState.successful(),
        error: null,
        value: value,
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
        value: null,
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
): RequestHook<TQuery> {
  return useRequest(queryClass, options)
}

export function useCommand<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = TCommand["__resultType"],
>(
  commandClass: { new(args: TArgs): TCommand },
  options?: PreparedRequestOptions,
): RequestHook<TCommand> {
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
): PreparedRequestHook<TRequest> {
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
): PreparedRequestHook<TQuery> {
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
): PreparedRequestHook<TCommand> {
  return usePreparedRequest(commandClass, args, options)
}
