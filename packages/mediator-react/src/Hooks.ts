import { AbstractCommand, AbstractQuery, AbstractRequest, ArgsOf, ClassOf, ResultOf } from "@tommypersson/mediator-core"
import { useCallback, useEffect, useState } from "react"
import { useMediator } from "./MediatorContext"
import { makeFailed, makeInProgress, makePending, makeSuccessful, State } from "./State"
import { useDeepEqualMemo } from "./utils"

export type CallbackOf<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> = (args: TArgs, options?: ExecuteOptions<TRequest>) => void

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

export interface RequestOptions<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
> extends ExecuteOptions<TRequest, TArgs, TResult> {
}

export type QueryOptions<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = RequestOptions<TQuery, TArgs, TResult>

export type CommandOptions<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = RequestOptions<TCommand, TArgs, TResult>

interface PreparedRequestOptions<
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
> extends RequestOptions<TRequest> {
  readonly immediate?: boolean
}

export type PreparedQueryOptions<
  TQuery extends AbstractQuery<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
> = PreparedRequestOptions<TQuery, TArgs, TResult>

export type PreparedCommandOptions<
  TCommand extends AbstractCommand<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
> = PreparedRequestOptions<TCommand, TArgs, TResult>

export interface ExecuteOptions<
  TRequest extends AbstractRequest<TArgs, TResult>,
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
  options?: RequestOptions<TRequest, TArgs, TResult>
): RequestHook<TRequest> {
  const mediator = useMediator()

  const requestOptions = useDeepEqualMemo(() => options, [options])
  const [state, setState] = useState<State<TRequest>>(makePending())

  const execute = useCallback(async (args: TArgs, executeOptions?: ExecuteOptions<TRequest>) => {

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
    }
  }, [requestClass, mediator, setState, requestOptions])

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
  options?: QueryOptions<TQuery, TArgs, TResult>,
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
  TRequest extends AbstractRequest<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>,
>(
  requestClass: ClassOf<TRequest>,
  args: ArgsOf<TRequest>,
  options?: PreparedRequestOptions<TRequest, TArgs, TResult>,
): PreparedRequestHook<TRequest> {
  const original = useRequest(requestClass, options)

  const memoizedArgs = useDeepEqualMemo(() => args, [args])

  const execute = useCallback((executeOptions?: ExecuteOptions<TRequest>) => {
    original.execute(memoizedArgs, executeOptions)
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
  options?: PreparedQueryOptions<TQuery, TArgs, TResult>,
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
