import { ArgsOf, Command, Query, Request, ResultOf } from "@tommypersson/mediator-core";
import { CommandHook, QueryHook, RequestHook } from "./Hooks";
import { States } from "./State";

export function stubPendingRequest<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
>(result?: TResult): RequestHook<TRequest, TArgs, TResult> {
  return {
    execute: () => {
    },
    executeAsync: async () => {
      return result!
    },
    reset: () => {
    },
    state: States.makePending()
  }
}

export const stubPendingCommand: <
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
>() => CommandHook<TCommand, TArgs, TResult> = stubPendingRequest

export const stubPendingQuery: <
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
>() => QueryHook<TQuery, TArgs, TResult> = stubPendingRequest

export function stubInProgressRequest<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
>(args: TArgs, result?: TResult): RequestHook<TRequest, TArgs, TResult> {
  return {
    execute: () => {
    },
    executeAsync: async () => {
      return result!
    },
    reset: () => {
    },
    state: States.makeInProgress(args)
  }
}

export const stubInProgressCommand: <
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
>(args: TArgs) => CommandHook<TCommand, TArgs, TResult> = stubInProgressRequest

export const stubInProgressQuery: <
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
>(args: TArgs) => QueryHook<TQuery, TArgs, TResult> = stubInProgressRequest

export function stubSuccessfulRequest<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
>(args: TArgs, result: TResult): RequestHook<TRequest, TArgs, TResult> {
  return {
    execute: () => {
    },
    executeAsync: async () => {
      return result
    },
    reset: () => {
    },
    state: States.makeSuccessful(args, result)
  }
}

export const stubSuccessfulCommand: <
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
>(args: TArgs, result: TResult) => CommandHook<TCommand, TArgs, TResult> = stubInProgressRequest

export const stubSuccessfulQuery: <
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
>(args: TArgs, result: TResult) => QueryHook<TQuery, TArgs, TResult> = stubInProgressRequest

export function stubFailedRequest<
  TRequest extends Request<TArgs, TResult>,
  TArgs = ArgsOf<TRequest>,
  TResult = ResultOf<TRequest>
>(args: TArgs, error: Error): RequestHook<TRequest, TArgs, TResult> {
  return {
    execute: () => {
    },
    executeAsync: async () => {
      throw error
    },
    reset: () => {
    },
    state: States.makeFailed(args, error)
  }
}

export const stubFailedCommand: <
  TCommand extends Command<TArgs, TResult>,
  TArgs = ArgsOf<TCommand>,
  TResult = ResultOf<TCommand>
>(args: TArgs, error: Error) => CommandHook<TCommand, TArgs, TResult> = stubFailedRequest

export const stubFailedQuery: <
  TQuery extends Query<TArgs, TResult>,
  TArgs = ArgsOf<TQuery>,
  TResult = ResultOf<TQuery>
>(args: TArgs, error: Error) => QueryHook<TQuery, TArgs, TResult> = stubFailedRequest
