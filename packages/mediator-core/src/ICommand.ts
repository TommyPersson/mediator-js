export interface ICommand {
  invoke(args: any): Promise<any>
}
