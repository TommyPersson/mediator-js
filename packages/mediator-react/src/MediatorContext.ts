import { IMediator, Mediator } from "@tommypersson/mediator-core"
import { createContext, useContext } from "react"

export const MediatorContext = createContext<IMediator>(new Mediator())

export const MediatorContextProvider = MediatorContext.Provider
export const MediatorContextConsumer = MediatorContext.Provider

export function useMediator(): IMediator {
  return useContext(MediatorContext)
}
