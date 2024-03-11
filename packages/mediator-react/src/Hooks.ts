import { Command, Query, Request, ArgsOf, ClassOf, ResultOf } from "@tommypersson/mediator-core"
import { useCallback, useEffect, useState } from "react"
import { useMediator } from "./MediatorContext"
import { makeFailed, makeInProgress, makePending, makeSuccessful, State } from "./State"
import { useDeepEqualMemo } from "./utils"

export type CallbackOf<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> = (args: TArgs, options?: ExecuteOptions<TRequest>) => void

export type AsyncCallbackOf<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> = (args: TArgs, options?: ExecuteOptions<TRequest>) => Promise<TResult>

/**
 * The result of {@link useRequest}.
 */
export interface RequestHook<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  readonly execute: CallbackOf<TRequest>
  readonly executeAsync: AsyncCallbackOf<TRequest>
  readonly reset: () => void

  readonly state: State<TRequest>
}

/**
 * The result of {@link useQuery}.
 */
export type QueryHook<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = RequestHook<TQuery, TArgs, TResult>

/**
 * The result of {@link useCommand}.
 */
export type CommandHook<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = RequestHook<TCommand, TArgs, TResult>

/**
 * The result of {@link usePreparedRequest}.
 */
export interface PreparedRequestHook<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> {
  readonly execute: (options?: ExecuteOptions<TRequest>) => void
  readonly executeAsync: (options?: ExecuteOptions<TRequest>) => Promise<TResult>
  readonly reset: () => void

  readonly state: State<TRequest>
  readonly preparedArgs: TArgs
}

/**
 * The result of {@link usePreparedQuery}.
 */
export type PreparedQueryHook<
  TQuery extends Query<TArgs, TValue>,
  TArgs = ArgsOf<TQuery>,
  TValue = ResultOf<TQuery>
> = PreparedRequestHook<TQuery, TArgs, TValue>

/**
 * The result of {@link usePreparedCommand}.
 */
export type PreparedCommandHook<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
> = PreparedRequestHook<TCommand, TArgs, TResult>

export interface RequestOptions<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends ExecuteOptions<TRequest, TArgs, TResult> {
}

export type QueryOptions<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = RequestOptions<TQuery, TArgs, TResult>

export type CommandOptions<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = RequestOptions<TCommand, TArgs, TResult>

interface PreparedRequestOptions<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> extends RequestOptions<TRequest> {
  readonly immediate?: boolean
}

export type PreparedQueryOptions<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = PreparedRequestOptions<TQuery, TArgs, TResult>

export type PreparedCommandOptions<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = PreparedRequestOptions<TCommand, TArgs, TResult>

export interface ExecuteOptions<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> {
  preInProgress?: (args: TArgs) => Promise<void> | void
  postInProgress?: (args: TArgs) => Promise<void> | void
  preSuccess?: (result: TResult, args: TArgs) => Promise<void> | void
  postSuccess?: (result: TResult, args: TArgs) => Promise<void> | void
  preFailure?: (error: Error, args: TArgs) => Promise<void> | void
  postFailure?: (error: Error, args: TArgs) => Promise<void> | void
}

/**
 * This hook takes a {@link Request} and returns a {@link RequestHook}.
 *
 * Needs to be used inside a {@link MediatorContext.Provider}.
 */
export function useRequest<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(
  requestClass: ClassOf<TRequest>,
  options?: RequestOptions<TRequest, TArgs, TResult>
): RequestHook<TRequest> {
  const mediator = useMediator()

  const requestOptions = useDeepEqualMemo(() => options, [options])
  const [state, setState] = useState<State<TRequest>>(makePending())

  const executeAsync = useCallback(async (args: TArgs, executeOptions?: ExecuteOptions<TRequest>): Promise<TResult> => {

    await runLifeCycleHook(requestOptions?.preInProgress, args)
    await runLifeCycleHook(executeOptions?.preInProgress, args)
    setState(makeInProgress(args))
    await runLifeCycleHook(executeOptions?.postInProgress, args)
    await runLifeCycleHook(requestOptions?.postInProgress, args)

    try {
      const result: TResult = await mediator.send(requestClass, args)

      await runLifeCycleHook(requestOptions?.preSuccess, result, args)
      await runLifeCycleHook(executeOptions?.preSuccess, result, args)
      setState(makeSuccessful(args, result))
      await runLifeCycleHook(executeOptions?.postSuccess, result, args)
      await runLifeCycleHook(requestOptions?.postSuccess, result, args)

      return result
    } catch (e) {
      let error: Error
      if (e instanceof Error) {
        error = e
      } else {
        error = new Error(`Error during mediator request: ${e}`, { cause: e })
      }

      await runLifeCycleHook(requestOptions?.preFailure, error, args)
      await runLifeCycleHook(executeOptions?.preFailure, error, args)
      setState(makeFailed(args, error))
      await runLifeCycleHook(executeOptions?.postFailure, error, args)
      await runLifeCycleHook(requestOptions?.postFailure, error, args)

      throw e
    }
  }, [requestClass, mediator, setState, requestOptions])

  const execute = useCallback((args: TArgs, executeOptions?: ExecuteOptions<TRequest>) => {
      executeAsync(args, executeOptions).catch(() => null)
  }, [executeAsync])

  const reset = useCallback(() => {
    setState(makePending())
  }, [setState])

  return {
    execute,
    executeAsync,
    reset,
    state
  }
}

/**
 * Query alias for {@link useRequest}.
 */
export function useQuery<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>,
>(
  queryClass: ClassOf<TQuery>,
  options?: QueryOptions<TQuery, TArgs, TResult>,
): QueryHook<TQuery> {
  return useRequest(queryClass, options)
}

/**
 * Query alias for {@link useRequest}.
 */
export function useCommand<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
>(
  commandClass: ClassOf<TCommand>,
  options?: CommandOptions<TCommand, TArgs, TResult>,
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
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(
  requestClass: ClassOf<TRequest>,
  args: ArgsOf<TRequest>,
  options?: PreparedRequestOptions<TRequest, TArgs, TResult>,
): PreparedRequestHook<TRequest> {
  const original = useRequest(requestClass, options)

  const memoizedArgs = useDeepEqualMemo(() => args, [args])

  const executeAsync = useCallback(async (executeOptions?: ExecuteOptions<TRequest>): Promise<TResult> => {
    return original.executeAsync(memoizedArgs, executeOptions)
  }, [original.executeAsync, memoizedArgs])

  const execute = useCallback((executeOptions?: ExecuteOptions<TRequest>): void => {
    executeAsync(executeOptions).catch(() => null)
  }, [executeAsync])

  useEffect(() => {
    if (options?.immediate) {
      execute()
    }
  }, [execute, options?.immediate])

  return {
    ...original,
    preparedArgs: args,
    execute,
    executeAsync
  }
}

/**
 * Query alias for {@link usePreparedRequest}.
 */
export function usePreparedQuery<
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>,
>(
  queryClass: ClassOf<TQuery>,
  args: ArgsOf<TQuery>,
  options?: PreparedQueryOptions<TQuery, TArgs, TResult>,
): PreparedQueryHook<TQuery> {
  return usePreparedRequest(queryClass, args, options)
}

/**
 * Command alias for {@link usePreparedRequest}.
 */
export function usePreparedCommand<
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>,
>(
  commandClass: ClassOf<TCommand>,
  args: ArgsOf<TCommand>,
  options?: PreparedCommandOptions<TCommand, TArgs, TResult>,
): PreparedCommandHook<TCommand> {
  return usePreparedRequest(commandClass, args, options)
}

async function runLifeCycleHook<TFunction extends (...args: any[]) => Promise<void> | void>(fn: TFunction | null | undefined, ...params: Parameters<TFunction>): Promise<void> {
  if (fn) {
    const result = fn(...params)
    if (result instanceof Promise) {
      await result
    }
  }
}
