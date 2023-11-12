import { beforeEach, describe, expect, it } from "vitest"
import {
  AbstractCommand,
  AbstractQuery,
  AbstractRequest,
  ICommandHandler,
  IMiddleware,
  IQueryHandler,
  IRequestContext,
  RequestContextKey,
  ResultOf,
} from "./index"
import { Mediator } from "./Mediator"
import { MediatorRegistry } from "./MediatorRegistry"

const SuffixKey = new RequestContextKey<string>("SuffixKey")
const TestMiddleware1AppliedKey = new RequestContextKey<boolean>("TestMiddleware1AppliedKey")

describe("Mediator", async () => {

  let outputs: { [index: string]: any } = {}

  class TestQuery extends AbstractQuery<{ greetee: string }, string> {
  }

  class TestQueryHandler implements IQueryHandler<TestQuery> {
    async handle(query: TestQuery, context: IRequestContext): Promise<ResultOf<TestQuery>> {
      outputs["middleware-1-applied"] = context.get(TestMiddleware1AppliedKey)
      return `Hello, ${query.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  class TestCommand extends AbstractCommand<{ greetee: string }, string> {
  }

  class TestCommandHandler implements ICommandHandler<TestCommand> {
    async handle(command: TestCommand, context: IRequestContext): Promise<ResultOf<TestCommand>> {
      outputs["middleware-1-applied"] = context.get(TestMiddleware1AppliedKey)
      return `Hello, ${command.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  const mediator = new Mediator()

  MediatorRegistry.addHandler(TestQuery, () => new TestQueryHandler())
  MediatorRegistry.addHandler(TestCommand, () => new TestCommandHandler())

  beforeEach(() => {
    outputs = {}
    outputs["middleware-application-order"] = []
  })

  describe("Basics", async () => {
    it("Can handle instanced queries", async () => {
      expect(await (mediator.send(new TestQuery({ greetee: "World" }))))
        .toEqual("Hello, World!")
    })

    it("Can handle non-instanced queries", async () => {
      expect(await (mediator.send(TestQuery, { greetee: "World" })))
        .toEqual("Hello, World!")
    })

    it("Can handle instanced commands", async () => {
      expect(await (mediator.send(new TestCommand({ greetee: "World" }))))
        .toEqual("Hello, World!")
    })

    it("Can handle non-instanced commands", async () => {
      expect(await (mediator.send(TestCommand, { greetee: "World" })))
        .toEqual("Hello, World!")
    })
  })

  class TestMiddleware1 implements IMiddleware {
    priority: number = 1

    handle<TRequest extends AbstractRequest<any, TResult>, TResult = any>(
      request: TRequest,
      context: IRequestContext,
      next: (request: TRequest, context: IRequestContext) => Promise<TResult>
    ): Promise<TResult> {
      outputs["middleware-application-order"].push(this.priority)
      context.put(TestMiddleware1AppliedKey, true)
      return next(request, context)
    }
  }


  class TestMiddleware2 implements IMiddleware {
    priority: number = 2

    handle<
      TRequest extends AbstractRequest<any, TResult>,
      TResult = ResultOf<TRequest>
    >(
      request: TRequest,
      context: IRequestContext,
      next: (request: TRequest, context: IRequestContext) => Promise<TResult>
    ): Promise<TResult> {
      outputs["middleware-application-order"].push(this.priority)
      return next(request, context)
    }

  }

  class TestMiddleware3 implements IMiddleware {
    priority: number = 3

    handle<TRequest extends AbstractRequest<any, TResult>, TResult = any>(
      request: TRequest,
      context: IRequestContext,
      next: (request: TRequest, context: IRequestContext) => Promise<TResult>
    ): Promise<TResult> {
      outputs["middleware-application-order"].push(this.priority)
      return next(request, context)
    }
  }

  MediatorRegistry.addMiddleware(
    new TestMiddleware3(), // reverse ordering to test for priority sorting
    new TestMiddleware2(),
    new TestMiddleware1(),
  )

  describe("Middleware", async () => {
    it("Are applied before the handler", async () => {
      await (mediator.send(TestCommand, { greetee: "World" }))
      expect(outputs["middleware-1-applied"]).toBe(true)
    })

    it("Are applied in priority order the handler", async () => {
      await (mediator.send(TestCommand, { greetee: "World" }))
      expect(outputs["middleware-application-order"]).toEqual([1, 2, 3])
    })
  })
})
