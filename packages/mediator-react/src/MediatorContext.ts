import { Mediator, NullMediator } from "@tommypersson/mediator-core"
import { createContext, useContext } from "react"

export const MediatorContext = createContext<Mediator>(NullMediator)

export function useMediator(): Mediator {
  return useContext(MediatorContext)
}
