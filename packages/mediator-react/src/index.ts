
import { helloWorld, AbstractCommand } from "@tommypersson/mediator-core"

export function helloWorld2() {
    helloWorld()
}

export class TestCommand extends AbstractCommand {
  async invoke(args: any): Promise<any> {
    // no real change
    console.log(args)
    return {}
  }
}
