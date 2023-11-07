import {ICommand} from "./ICommand";

export abstract class AbstractCommand implements ICommand {
  abstract invoke(args: any): Promise<any>
}
