import type { IParser } from "$lib/bgpp/parser/IParser"
import type { BusLogicRepo } from "$lib/buslogic/repo/BusLogicRepo"
import type { Coords } from "$lib/shared/types"

export type BGPPCity = {
    city: string,
    center: Coords,
    repo: BusLogicRepo,
    parser: IParser
}