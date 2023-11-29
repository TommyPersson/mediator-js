import { AbstractCommand, AbstractQuery, AbstractRequest, ArgsOf, ClassOf, ResultOf } from "@tommypersson/mediator-core"
import { useCallback, useEffect, useState } from "react"
import { useMediator } from "./MediatorContext"
import { makeFailed, makeInProgress, makePending, makeSuccessful, State } from "./State"
import { useDeepEqualMemo } from "./utils"

export type CallbackOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> = (args: TArgs) => void

/**
 * The result of {@link useRequest}.
 */
export interface RequestHook<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  readonly execute: CallbackOf<TRequest>
  readonly reset: () => void

  readonly state: State<TRequest>
}

/**
 * The result of {@link useQuery}.
 */
export type QueryHook<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = RequestHook<TQuery, TArgs, TResult>

/**
 * The result of {@link useCommand}.
 */
export type CommandHook<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = RequestHook<TCommand, TArgs, TResult>

/**
 * The result of {@link usePreparedRequest}.
 */
export interface PreparedRequestHook<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  readonly execute: () => void
  readonly reset: () => void

  readonly state: State<TRequest>
  readonly preparedArgs: TArgs
}

/**
 * The result of {@link usePreparedQuery}.
 */
export type PreparedQueryHook<
  TQuery extends AbstractQuery<TArgs, TValue>,
  TArgs = ArgsOf<TQuery>,
  TValue = ResultOf<TQuery>
> = PreparedRequestHook<TQuery, TArgs, TValue>

/**
 * The result of {@link usePreparedCommand}.
 */
export type PreparedCommandHook<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
> = PreparedRequestHook<TCommand, TArgs, TResult>

export interface RequestOptions {
}

export type QueryOptions = RequestOptions

export type CommandOptions = RequestOptions

interface PreparedRequestOptions {
  immediate?: boolean
}

export type PreparedQueryOptions = RequestOptions

export type PreparedCommandOptions = RequestOptions

/**
 * This hook takes a {@link AbstractRequest} and returns a {@link RequestHook}.
 *
 * Needs to be used inside a {@link MediatorContext.Provider}.
 */
export function useRequest<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(
  requestClass: ClassOf<TRequest>,
  options?: RequestOptions
): RequestHook<TRequest> {
  const mediator = useMediator()

  const [state, setState] = useState<State<TRequest>>(makePending())

  const execute = useCallback(async (args: TArgs) => {
    setState(makeInProgress(args))

    try {
      const result: TResult = await mediator.send(requestClass, args)
      setState(makeSuccessful(args, result))
    } catch (e) {
      let error: Error
      if (e instanceof Error) {
        error = e
      } else {
        error = new Error(`Error during mediator request: ${e}`, { cause: e })
      }

      setState(makeFailed(args, error))
    }
  }, [requestClass, mediator, setState])

  const reset = useCallback(() => {
    setState(makePending())
  }, [setState])

  return {
    execute,
    reset,
    state
  }
}

/**
 * Query alias for {@link useRequest}.
 */
export function useQuery<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>,
>(
  queryClass: ClassOf<TQuery>,
  options?: QueryOptions,
): QueryHook<TQuery> {
  return useRequest(queryClass, options)
}

/**
 * Query alias for {@link useRequest}.
 */
export function useCommand<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
>(
  commandClass: ClassOf<TCommand>,
  options?: CommandOptions,
): CommandHook<TCommand> {
  return useRequest(commandClass, options)
}

/**
 * Similar to {@link useRequest}, but instead of providing the request arguments in the
 * {@link RequestHook.execute}-function, this version takes the given arguments and
 * provides a no-argument execute function instead.
 *
 * If {@link PreparedRequestOptions.immediate} is `true`, then the request begins executing immediately and whenever
 * `args` changes. Deep equality is used to determine if `args` has changed between renders.
 */
export function usePreparedRequest<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(
  requestClass: ClassOf<TRequest>,
  args: ArgsOf<TRequest>,
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
    preparedArgs: args,
    execute
  }
}

/**
 * Query alias for {@link usePreparedRequest}.
 */
export function usePreparedQuery<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>,
>(
  queryClass: ClassOf<TQuery>,
  args: ArgsOf<TQuery>,
  options?: PreparedQueryOptions,
): PreparedQueryHook<TQuery> {
  return usePreparedRequest(queryClass, args, options)
}

/**
 * Command alias for {@link usePreparedRequest}.
 */
export function usePreparedCommand<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
>(
  commandClass: ClassOf<TCommand>,
  args: ArgsOf<TCommand>,
  options?: PreparedCommandOptions,
): PreparedCommandHook<TCommand> {
  return usePreparedRequest(commandClass, args, options)
}
