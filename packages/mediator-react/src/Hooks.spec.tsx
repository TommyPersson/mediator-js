import {
  AbstractCommand,
  ICommandHandler,
  MediatorRegistry,
  IRequestContext,
  Mediator,
} from "@tommypersson/mediator-core"
import { useCallback } from "react"
import * as React from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { usePreparedRequest, useRequest } from "./Hooks"
import { MediatorContext } from "./MediatorContext"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RequestStates } from "./RequestState"
import { Deferred } from "./utils"

let latch = new Deferred<void>()

class TestCommand extends AbstractCommand<{ input: number }, number> {
}

class TestCommandHandler implements ICommandHandler<TestCommand> {
  async handle(command: TestCommand, context: IRequestContext): Promise<number> {
    await latch
    return command.args.input + 1
  }
}

MediatorRegistry.addHandler(TestCommand, () => new TestCommandHandler())

describe("useRequest", async () => {

  beforeEach(() => {
    latch = new Deferred<void>()
    return () => {
      latch.resolve()
      cleanup()
    }
  })

  function TestComponent() {
    const request = useRequest(TestCommand)
    const onClick = useCallback(() => request.execute({ input: 1 }), [request.execute])

    return (
      <div>
        <span>state: {request.state.value}</span>
        <span>result: {request.value ?? "null"}</span>
        <span>error: {request.error?.message ?? "null"}</span>
        <button onClick={onClick}>button</button>
      </div>
    )
  }

  function TestApp() {
    return (
      <MediatorContext.Provider value={new Mediator()}>
        <TestComponent/>
      </MediatorContext.Provider>
    )
  }

  it("Is Pending initially", async () => {
    render(<TestApp/>)

    await waitFor(async () => {
      expect(screen.getByText(`state: ${RequestStates.Pending}`)).toBeDefined()
      expect(screen.getByText("result: null")).toBeDefined()
      expect(screen.getByText("error: null")).toBeDefined()
    })
  })

  it("Is InProgress during execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${RequestStates.InProgress}`)).toBeDefined()
      expect(screen.getByText("result: null")).toBeDefined()
      expect(screen.getByText("error: null")).toBeDefined()
    })
  })

  it("Is Successful after execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.resolve()

    await waitFor(async () => {
      expect(screen.getByText(`state: ${RequestStates.Successful}`)).toBeDefined()
      expect(screen.getByText("result: 2")).toBeDefined()
      expect(screen.getByText("error: null")).toBeDefined()
    })
  })

  it("Is Failed after failed execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.reject(new Error("mistake"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${RequestStates.Failed}`)).toBeDefined()
      expect(screen.getByText("result: null")).toBeDefined()
      expect(screen.getByText("error: mistake")).toBeDefined()
    })
  })

  it("Wraps any non-Error thrown", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.reject("NotError" as any)

    await waitFor(async () => {
      expect(screen.getByText(`state: ${RequestStates.Failed}`)).toBeDefined()
      expect(screen.getByText("result: null")).toBeDefined()
      expect(screen.getByText("error: Error during mediator request: NotError")).toBeDefined()
    })
  })
})

describe("usePreparedRequest", async () => {

  describe("immediate = false", async () => {

    beforeEach(() => {
      latch = new Deferred<void>()
      return () => {
        latch.resolve()
        cleanup()
      }
    })

    function TestComponent() {
      const request = usePreparedRequest(TestCommand, { input: 1 })

      return (
        <div>
          <span>state: {request.state.value}</span>
          <span>result: {request.value ?? "null"}</span>
          <span>error: {request.error?.message ?? "null"}</span>
          <button onClick={request.execute}>button</button>
        </div>
      )
    }

    function TestApp() {
      return (
        <MediatorContext.Provider value={new Mediator()}>
          <TestComponent/>
        </MediatorContext.Provider>
      )
    }

    it("Is Pending initially", async () => {
      render(<TestApp/>)

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Pending}`)).toBeDefined()
        expect(screen.getByText("result: null")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })
    })

    it("Is InProgress during execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.InProgress}`)).toBeDefined()
        expect(screen.getByText("result: null")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })
    })

    it("Is Successful after execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })
    })

    it("Is Failed after failed execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      latch.reject(new Error("mistake"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Failed}`)).toBeDefined()
        expect(screen.getByText("result: null")).toBeDefined()
        expect(screen.getByText("error: mistake")).toBeDefined()
      })
    })
  })

  describe("immediate = true", async () => {

    beforeEach(() => {
      latch = new Deferred<void>()
      return () => {
        latch.resolve()
        cleanup()
      }
    })

    function TestComponent(props: { input: number }) {
      const request = usePreparedRequest(TestCommand, { input: props.input }, { immediate: true })

      return (
        <div>
          <span>state: {request.state.value}</span>
          <span>result: {request.value ?? "null"}</span>
          <span>error: {request.error?.message ?? "null"}</span>
        </div>
      )
    }

    function TestApp(props: { input: number }) {
      return (
        <MediatorContext.Provider value={new Mediator()}>
          <TestComponent input={props.input}/>
        </MediatorContext.Provider>
      )
    }

    it("Is InProgress initially", async () => {
      render(<TestApp input={1}/>)

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.InProgress}`)).toBeDefined()
        expect(screen.getByText("result: null")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })
    })

    it("Is Successful after execution", async () => {
      render(<TestApp input={1}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })
    })

    it("Is Failed after failed execution", async () => {
      render(<TestApp input={1}/>)

      latch.reject(new Error("mistake"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Failed}`)).toBeDefined()
        expect(screen.getByText("result: null")).toBeDefined()
        expect(screen.getByText("error: mistake")).toBeDefined()
      })
    })

    it("Is re-executed on args changes", async () => {
      const { rerender } = render(<TestApp input={1}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })

      latch = new Deferred<void>()

      rerender(<TestApp input={2}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${RequestStates.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 3")).toBeDefined()
        expect(screen.getByText("error: null")).toBeDefined()
      })

      latch.resolve()
    })
  })
})
