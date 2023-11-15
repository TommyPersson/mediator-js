import { IMediator, NullMediator } from "@tommypersson/mediator-core"
import { createContext, useContext } from "react"

export const MediatorContext = createContext<IMediator>(NullMediator)

export function useMediator(): IMediator {
  return useContext(MediatorContext)
}
