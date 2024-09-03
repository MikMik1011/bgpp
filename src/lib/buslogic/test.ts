import type { BusLogic } from "./api/BusLogicAPI"
import { BusLogicV1 } from "./api/BusLogicAPIV1"

const main = async () => {
    const api : BusLogic = new BusLogicV1("Novi Sad", "https://online.nsmart.rs", "4670f468049bbee2260");
    const stations = await api.getAllStations();
    console.log(stations);
}

main();