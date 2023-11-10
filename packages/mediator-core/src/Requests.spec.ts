import { describe, it, expect } from "vitest"
import { AbstractCommand, AbstractQuery, AbstractRequest } from "./index"


describe('Requests', () => {
  class TestRequest extends AbstractRequest<any, any> {
  }

  it("Have a unique instanceId", () => {
    expect(new TestRequest({}).instanceId).toHaveLength("8a205161-a309-4ede-82de-6c9df61c47ae".length)
  })
});

describe('Queries', () => {
  class TestQuery extends AbstractQuery<any, any> {
  }

  it("Have a unique instanceId", () => {
    expect(new TestQuery({}).instanceId).toHaveLength("8a205161-a309-4ede-82de-6c9df61c47ae".length)
    Object.getPrototypeOf(new TestQuery(""))

  })
});


describe('Commands', () => {
  class TestCommand extends AbstractCommand<any, any> {
  }

  it("Have a unique instanceId", () => {
    expect(new TestCommand({}).instanceId).toHaveLength("8a205161-a309-4ede-82de-6c9df61c47ae".length)
  })
});

