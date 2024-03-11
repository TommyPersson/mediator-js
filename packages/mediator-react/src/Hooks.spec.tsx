import {
  ArgsOf,
  Command,
  CommandHandler, DefaultMediator,
  GlobalMediatorRegistry,
  RequestContext,
  ResultOf,
} from "@tommypersson/mediator-core"
import * as React from "react"
import { useCallback } from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { usePreparedRequest, useRequest } from "./Hooks"
import { MediatorContext } from "./MediatorContext"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StateKind } from "./State"
import { Deferred } from "./utils"

let latch = new Deferred<void>()

class TestCommand extends Command<{ input: number }, number> {
}

class TestCommandHandler implements CommandHandler<TestCommand> {
  async handle(command: TestCommand, context: RequestContext): Promise<number> {
    await latch
    return command.args.input + 1
  }
}

GlobalMediatorRegistry.addHandler(TestCommand, () => new TestCommandHandler())

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

    const preInProgress = useCallback((args: ArgsOf<TestCommand>): void => { logs.push(`preInProgress0: ${args.input}`) }, [])
    const postInProgress = useCallback((args: ArgsOf<TestCommand>): void => { logs.push(`postInProgress0: ${args.input}`) }, [])
    const preSuccess = useCallback((result: ResultOf<TestCommand>, args: ArgsOf<TestCommand>): void => { logs.push(`preSuccess0: ${args.input} ${result}`) }, [])
    const postSuccess = useCallback((result: ResultOf<TestCommand>, args: ArgsOf<TestCommand>): void => { logs.push(`postSuccess0: ${args.input} ${result}`) }, [])
    const preFailure = useCallback((error: Error, args: ArgsOf<TestCommand>): void => { logs.push(`preFailure0: ${args.input} ${error.message}`) }, [])
    const postFailure = useCallback((error: Error, args: ArgsOf<TestCommand>): void => { logs.push(`postFailure0: ${args.input} ${error.message}`) }, [])

    const request = useRequest(TestCommand, {
      preInProgress: preInProgress,
      postInProgress: postInProgress,
      preSuccess: preSuccess,
      postSuccess: postSuccess,
      preFailure: preFailure,
      postFailure: postFailure,
    })

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
      <MediatorContext.Provider value={new DefaultMediator()}>
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
    }, { timeout: 1 })

    await userEvent.click(screen.getByText("reset"))

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
    }, { timeout: 1 })
  })

  it("Calls life-cycle callbacks (success)", async () => {
    render(<TestApp/>)

    await userEvent.click(screen.getByText("button"))

    latch.resolve()

    await waitFor(async () => {
      expect(screen.getByText(`state: ${StateKind.Successful}`)).toBeDefined()
    })

    expect(logs).toStrictEqual([
      "preInProgress0: 1",
      "preInProgress: 1",
      "postInProgress: 1",
      "postInProgress0: 1",
      "preSuccess0: 1 2",
      "preSuccess: 1 2",
      "postSuccess: 1 2",
      "postSuccess0: 1 2",
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
      "preInProgress0: 1",
      "preInProgress: 1",
      "postInProgress: 1",
      "postInProgress0: 1",
      "preFailure0: 1 mistake",
      "preFailure: 1 mistake",
      "postFailure: 1 mistake",
      "postFailure0: 1 mistake",
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
        <MediatorContext.Provider value={new DefaultMediator()}>
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
      }, { timeout: 1 })

      await userEvent.click(screen.getByText("reset"))

      await waitFor(async () => {
         expect(screen.getByText(`state: ${StateKind.Pending}`)).toBeDefined()
      }, { timeout: 1 })
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
        <MediatorContext.Provider value={new DefaultMediator()}>
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
