import { describe, expect, it } from "vitest"
import {
  AbstractCommand,
  AbstractQuery,
  ICommandHandler,
  IQueryHandler,
  IRequestContext,
  RequestContext,
  RequestContextKey,
} from "./index"

const SuffixKey = new RequestContextKey<string>("test-key")

describe("QueryHandlers", async () => {
  class TestQuery extends AbstractQuery<{ greetee: string }, string> {
  }

  class TestQueryHandler implements IQueryHandler<TestQuery> {
    async handle(query: TestQuery, context: IRequestContext): Promise<string> {
      return `Hello, ${query.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  it("Can handle queries", async () => {
    const context = RequestContext.empty()
    expect(await (new TestQueryHandler().handle(new TestQuery({ greetee: "World" }), context)))
      .toEqual("Hello, World!")
  })

  it("Can access the context", async () => {
    const context = RequestContext.empty()
    context.put(SuffixKey, " suffix")
    expect(await (new TestQueryHandler().handle(new TestQuery({ greetee: "World" }), context)))
      .toEqual("Hello, World! suffix")
  })
})

describe("CommandHandlers", async () => {
  class TestCommand extends AbstractCommand<{ greetee: string }, string> {
  }

  class TestCommandHandler implements ICommandHandler<TestCommand> {
    async handle(command: TestCommand, context: IRequestContext): Promise<string> {
      return `Hello, ${command.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  it("Can handle commands", async () => {
    const context = RequestContext.empty()
    expect(await (new TestCommandHandler().handle(new TestCommand({ greetee: "World" }), context)))
      .toEqual("Hello, World!")
  })

  it("Can access the context", async () => {
    const context = RequestContext.empty()
    context.put(SuffixKey, " suffix")
    expect(await (new TestCommandHandler().handle(new TestCommand({ greetee: "World" }), context)))
      .toEqual("Hello, World! suffix")
  })
})
