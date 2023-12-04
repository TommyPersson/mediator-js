import {
  AbstractCommand, ArgsOf,
  ICommandHandler,
  IRequestContext,
  Mediator,
  MediatorRegistry, ResultOf,
} from "@tommypersson/mediator-core"
import * as React from "react"
import { useCallback } from "react"
import { beforeEach, describe, expect, it, Test } from "vitest"
import { usePreparedRequest, useRequest } from "./Hooks"
import { MediatorContext } from "./MediatorContext"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateKind } from "./State"
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

  let logs: string[] = []

  beforeEach(() => {
    logs = []
    latch = new Deferred<void>()
    return () => {
      latch.resolve()
      cleanup()
    }
  })

  function TestComponent() {
    const request = useRequest(TestCommand)
    const handleClick = useCallback(() => {
      request.execute(
        { input: 1 },
        {
          preInProgress: (args: ArgsOf<TestCommand>): void => { logs.push(`preInProgress: ${args.input}`) },
          postInProgress: (args: ArgsOf<TestCommand>): void => { logs.push(`postInProgress: ${args.input}`) },
          preSuccess: (result: ResultOf<TestCommand>, args: ArgsOf<TestCommand>): void => { logs.push(`preSuccess: ${args.input} ${result}`) },
          postSuccess: (result: ResultOf<TestCommand>, args: ArgsOf<TestCommand>): void => { logs.push(`postSuccess: ${args.input} ${result}`) },
          preFailure: (error: Error, args: ArgsOf<TestCommand>): void => { logs.push(`preFailure: ${args.input} ${error.message}`) },
          postFailure: (error: Error, args: ArgsOf<TestCommand>): void => { logs.push(`postFailure: ${args.input} ${error.message}`) },
        }
      )
    }, [request.execute])

    const state = request.state;

    const content = state.kind === StateKind.Pending ? (
      <></>
    ) : state.kind === StateKind.InProgress ? (
      <>
        <span>input: {state.args.input}</span>
      </>
    ) : state.kind === StateKind.Successful ? (
      <>
        <span>input: {state.args.input}</span>
        <span>result: {state.result}</span>
      </>
    )  : state.kind === StateKind.Failed ? (
      <>
        <span>input: {state.args.input}</span>
        <span>error: {state.error.message}</span>
      </>
    ) : null

    return (
      <div>
        <span>state: {state.kind}</span>
        {content}
        <button onClick={handleClick}>button</button>
        <button onClick={request.reset}>reset</button>
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
      expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
    })
  })

  it("Is InProgress during execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.InProgress}`)).toBeDefined()
    })
  })

  it("Is Successful after execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.resolve()

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
      expect(screen.getByText("result: 2")).toBeDefined()
    })
  })

  it("Is Failed after failed execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.reject(new Error("mistake"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Failed}`)).toBeDefined()
      expect(screen.getByText("error: mistake")).toBeDefined()
    })
  })

  it("Wraps any non-Error thrown", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.reject("NotError" as any)

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Failed}`)).toBeDefined()
      expect(screen.getByText("error: Error during mediator request: NotError")).toBeDefined()
    })
  })

  it("Can be reset after execution", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.resolve()

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
      expect(screen.getByText("result: 2")).toBeDefined()
    })

    await userEvent.click(screen.getByText("reset"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
    })
  })

  it("Calls life-cycle callbacks (success)", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.resolve()

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
    })

    expect(logs).toStrictEqual([
      "preInProgress: 1",
      "postInProgress: 1",
      "preSuccess: 1 2",
      "postSuccess: 1 2",
    ])
  })

  it("Calls life-cycle callbacks (failure)", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.reject(new Error("mistake"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Failed}`)).toBeDefined()
    })

    expect(logs).toStrictEqual([
      "preInProgress: 1",
      "postInProgress: 1",
      "preFailure: 1 mistake",
      "postFailure: 1 mistake",
    ])
  })
})

describe("usePreparedRequest", async () => {

  function TestComponent(props: { immediate: boolean, input: number }) {
    const request = usePreparedRequest(TestCommand, { input: props.input }, { immediate: props.immediate })

    const state = request.state;

    const content = state.kind === StateKind.Pending ? (
      <>
        <span>input: {request.preparedArgs.input}</span>
      </>
    ) : state.kind === StateKind.InProgress ? (
      <>
        <span>input: {request.preparedArgs.input}</span>
      </>
    ) : state.kind === StateKind.Successful ? (
      <>
        <span>input: {request.preparedArgs.input}</span>
        <span>result: {state.result}</span>
      </>
    )  : state.kind === StateKind.Failed ? (
      <>
        <span>input: {state.args.input}</span>
        <span>error: {state.error.message}</span>
      </>
    ) : null

    return (
      <div>
        <span>state: {state.kind}</span>
        {content}
        <button onClick={request.execute}>button</button>
        <button onClick={request.reset}>reset</button>
      </div>
    )
  }

  describe("immediate = false", async () => {

    beforeEach(() => {
      latch = new Deferred<void>()
      return () => {
        latch.resolve()
        cleanup()
      }
    })

    function TestApp() {
      return (
        <MediatorContext.Provider value={new Mediator()}>
          <TestComponent input={1} immediate={false} />
        </MediatorContext.Provider>
      )
    }

    it("Is Pending initially", async () => {
      render(<TestApp/>)

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
      })
    })

    it("Is InProgress during execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.InProgress}`)).toBeDefined()
      })
    })

    it("Is Successful after execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
      })
    })

    it("Is Failed after failed execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      latch.reject(new Error("mistake"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Failed}`)).toBeDefined()
        expect(screen.getByText("error: mistake")).toBeDefined()
      })
    })

    it("Can be reset after execution", async () => {
      render(<TestApp/>)

      await userEvent.click(screen.getByText("button"))

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
      })

      await userEvent.click(screen.getByText("reset"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
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

    function TestApp(props: { input: number }) {
      return (
        <MediatorContext.Provider value={new Mediator()}>
          <TestComponent input={props.input} immediate={true} />
        </MediatorContext.Provider>
      )
    }

    it("Is InProgress initially", async () => {
      render(<TestApp input={1}/>)

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.InProgress}`)).toBeDefined()
        expect(screen.getByText("input: 1")).toBeDefined()
      })
    })

    it("Is Successful after execution", async () => {
      render(<TestApp input={1}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
      })
    })

    it("Is Failed after failed execution", async () => {
      render(<TestApp input={1}/>)

      latch.reject(new Error("mistake"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Failed}`)).toBeDefined()
        expect(screen.getByText("error: mistake")).toBeDefined()
      })
    })

    it("Can be reset after execution", async () => {
      render(<TestApp input={1}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
      })

      await userEvent.click(screen.getByText("reset"))

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
      })
    })

    it("Is re-executed on args changes", async () => {
      const { rerender } = render(<TestApp input={1}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 2")).toBeDefined()
      })

      latch = new Deferred<void>()

      rerender(<TestApp input={2}/>)

      latch.resolve()

      await waitFor(async () => {
        expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
        expect(screen.getByText("result: 3")).toBeDefined()
      })

      latch.resolve()
    })
  })
})
