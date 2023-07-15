const fastify = require("fastify")({
  logger: {
    logging: "info",
  },
});
const axios = require("axios");
const path = require("path");

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "static"),
  prefix: "/static/",
});

const apikeys = require("./apikeys.json");
const id_uid_map = {};

async function populateMap() {
  console.log("Populating map started");
  for (const city of Object.keys(apikeys)) {
    const allStations = await getAllStations(city);
    console.log(`Fetched all stations in ${city}`);
    id_uid_map[city] = {};
    for (const station of allStations.stations) {
      id_uid_map[city][station.station_id] = station.id;
    }
  }

  console.log("Populating map finished");
}

async function doRequest(url, apikey) {
  const headers = {
    "X-Api-Authentication": apikey,
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (err) {
    console.error(err);
    return { error: "Error sending request", message: err.message };
  }
}

async function getStationById(city, id) {
  const url = `${
    apikeys[city].url
  }/publicapi/v1/announcement/announcement.php?station_uid=${
    id_uid_map[city][id] || 0
  }`;
  return await doRequest(url, apikeys[city].key);
}

async function getAllStations(city) {
  const url = `${apikeys[city].url}/publicapi/v1/networkextended.php?action=get_cities_extended`;
  const response = await doRequest(url, apikeys[city].key);
  return response;
}

fastify.get("/api/stations/:city/:id", async (request, reply) => {
  const id = request.params.id;
  const city = request.params.city;
  const response = await getStationById(city, id);
  reply.send(response);
});
fastify.get("/api/stations/:city/all", async (request, reply) => {
  const city = request.params.city;
  const response = await getAllStations(city);
  reply.send(response);
});
fastify.get("/", (request, reply) => reply.sendFile("index.html"));

(async () => {
  await populateMap();
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
