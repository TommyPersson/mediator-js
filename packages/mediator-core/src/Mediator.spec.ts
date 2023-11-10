import { describe, expect, it } from "vitest"
import {
  AbstractCommand,
  AbstractCommandHandler,
  AbstractQuery,
  AbstractQueryHandler,
  IRequestContext,
  RequestContextKey,
} from "./index"
import { Mediator } from "./Mediator"
import { GlobalMediatorRegistry } from "./MediatorRegistry"

const SuffixKey = new RequestContextKey<string>("test-key")

describe("Mediator", async () => {
  class TestQuery extends AbstractQuery<{ greetee: string }, string> {
  }

  class TestQueryHandler extends AbstractQueryHandler<TestQuery> {
    async doHandle(query: TestQuery, context: IRequestContext): Promise<string> {
      return `Hello, ${query.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  class TestCommand extends AbstractCommand<{ greetee: string }, string> {
  }

  class TestCommandHandler extends AbstractCommandHandler<TestCommand> {
    async doHandle(command: TestCommand, context: IRequestContext): Promise<string> {
      return `Hello, ${command.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  const mediator = new Mediator()

  GlobalMediatorRegistry.register(TestQuery, () => new TestQueryHandler())
  GlobalMediatorRegistry.register(TestCommand, () => new TestCommandHandler())

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
})
