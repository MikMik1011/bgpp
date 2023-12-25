const fastify = require("fastify")({
  logger: true,
});
const axios = require("axios");
const path = require("path");

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "static"),
  prefix: "/static/",
});
fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: "*",
  allowedHeaders: "*",
});

const apikeys = require("./apikeys.json");

let id_uid_map = {};
let allStations = {};

const getKeyByValue = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};
function transformAllStationsResponse(response) {
  let newResp = new Array();
  response.stations.map((value) => {
    let station = new Object();
    station.name = value.name;
    station.uid = value.id;
    station.id = value.station_id;
    station.coords = [value.coordinates.latitude, value.coordinates.longitude];
    newResp.push(station);
  });
  return newResp;
}

function transformStationResponse(response, city) {
  let newResp = new Object();
  newResp.city = city;
  newResp.name = response[0].station_name;
  newResp.uid = response[0].station_uid;
  newResp.id =
    getKeyByValue(id_uid_map[city], response[0].station_uid.toString()) || "0";
  newResp.coords = [];
  newResp.vehicles = new Array();

  if (response[0].just_coordinates == "1") {
    newResp.coords = [response[0].gpsx, response[0].gpsy];
    return newResp;
  }

  newResp.coords = [response[0].stations_gpsx, response[0].stations_gpsy];

  response.map((value) => {
    let vehicle = new Object();
    vehicle.lineNumber = value.line_number;
    vehicle.lineName = value.line_title;
    vehicle.secondsLeft = value.seconds_left;
    vehicle.stationsBetween = value.stations_between;
    vehicle.stationName = value.vehicles[0].station_name;
    vehicle.garageNo = value.vehicles[0].garageNo;
    vehicle.coords = [value.vehicles[0].lat, value.vehicles[0].lng];
    newResp.vehicles.push(vehicle);
  });

  return newResp;
}

async function populateMap(force = false) {
  for (const city of Object.keys(apikeys)) {
    if (!force && id_uid_map[city]) {
      continue;
    }

    try {
      const stations = await getAllStations(city);

      id_uid_map[city] = {};

      for (const station of stations) {
        id_uid_map[city][station.id.toString()] = station.uid.toString();
      }
      console.log(`Populating map finished for ${city}`);
    } catch (err) {
      console.log(`Populating map failed for ${city}`);
      console.error(err);
    }
  }
}

async function doRequest(url, apikey) {
  const headers = {
    "X-Api-Authentication": apikey,
  };

  const response = await axios.get(url, { headers, timeout: 5000 });
  if (response.status != 200)
    throw new Error(`Request failed with status code ${response.status}`);

  return response.data;
}

async function getStationInfo(city, query) {
  const baseUrl = `${apikeys[city].url}/publicapi/v1/announcement/announcement.php?action=get_announcement_data&station_uid=`;
  if(city == "bg") throw new Error("BusLogic drastically changed and obfuscated their API. I will try to decode it, but it will take some time.");
  if (query.uid) var url = baseUrl + query.uid;
  else if (query.id) {
    if (!id_uid_map[city])
      throw new Error(`Map for ${city} is not populated yet`);
    let id = id_uid_map[city][query.id.toString()];
    if (!id) throw new Error("Invalid station ID");

    var url = baseUrl + id_uid_map[city][query.id.toString()];
  } else throw new Error("Invalid query");

  let resp = await doRequest(url, apikeys[city].key);
  if (resp[0].success === false)
    throw new Error(`Endpoint returned error (perhaps invalid ID?)`);
  return transformStationResponse(resp, city);
}

async function getAllStations(city) {
  const url = `${apikeys[city].url}/publicapi/v1/networkextended.php?action=get_cities_extended`;
  if (!allStations[city]) {
    const response = await doRequest(url, apikeys[city].key);
    allStations[city] = transformAllStationsResponse(response);
  }
  return allStations[city];
}

async function getAvaliableCities() {
  populateMap();
  let cities = new Object();
  for (id of Object.keys(allStations)) cities[id] = apikeys[id].name;
  return cities;
}

fastify.get("/api/stations/:city/search", async (request, reply) => {
  const city = request.params.city;
  try {
    const response = await getStationInfo(city, request.query);
    reply.send(response);
  } catch (err) {
    console.error(err);
    reply.send(err);
  }
});
fastify.get("/api/stations/:city/all", async (request, reply) => {
  const city = request.params.city;
  try {
    const response = await getAllStations(city);
    reply.send(response);
  } catch (err) {
    console.error(err);
    reply.send(err);
  }
});
fastify.get("/api/cities", async (request, reply) => {
  try {
    const response = await getAvaliableCities();
    reply.send(response);
  } catch (err) {
    console.error(err);
    reply.send(err);
  }
});
fastify.get("/", (request, reply) => reply.sendFile("index.html"));

(async () => {
  try {
    await populateMap(true);
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
