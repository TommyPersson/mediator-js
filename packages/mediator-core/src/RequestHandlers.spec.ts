import { describe, expect, it } from "vitest"
import {
  Command,
  Query,
  CommandHandler,
  QueryHandler,
  RequestContext,
  DefaultRequestContext,
  RequestContextKey,
} from "./index"

const SuffixKey = new RequestContextKey<string>("test-key")

describe("QueryHandlers", async () => {
  class TestQuery extends Query<{ greetee: string }, string> {
  }

  class TestQueryHandler implements QueryHandler<TestQuery> {
    async handle(query: TestQuery, context: RequestContext): Promise<string> {
      return `Hello, ${query.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  it("Can handle queries", async () => {
    const context = DefaultRequestContext.empty()
    expect(await (new TestQueryHandler().handle(new TestQuery({ greetee: "World" }), context)))
      .toEqual("Hello, World!")
  })

  it("Can access the context", async () => {
    const context = DefaultRequestContext.empty()
    context.put(SuffixKey, " suffix")
    expect(await (new TestQueryHandler().handle(new TestQuery({ greetee: "World" }), context)))
      .toEqual("Hello, World! suffix")
  })
})

describe("CommandHandlers", async () => {
  class TestCommand extends Command<{ greetee: string }, string> {
  }

  class TestCommandHandler implements CommandHandler<TestCommand> {
    async handle(command: TestCommand, context: RequestContext): Promise<string> {
      return `Hello, ${command.args.greetee}!${context.get(SuffixKey) ?? ""}`
    }
  }

  it("Can handle commands", async () => {
    const context = DefaultRequestContext.empty()
    expect(await (new TestCommandHandler().handle(new TestCommand({ greetee: "World" }), context)))
      .toEqual("Hello, World!")
  })

  it("Can access the context", async () => {
    const context = DefaultRequestContext.empty()
    context.put(SuffixKey, " suffix")
    expect(await (new TestCommandHandler().handle(new TestCommand({ greetee: "World" }), context)))
      .toEqual("Hello, World! suffix")
  })
})
