import type { IParser } from "$lib/server/providers/buslogic/parser/IParser"
import type { BusLogicRepo } from "$lib/server/providers/buslogic/repo/BusLogicRepo"
import type { Coords } from "$lib/shared/types"

export type BGPPCity = {
    city: string,
    center: Coords,
    repo: BusLogicRepo,
    parser: IParser
}