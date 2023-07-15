const fastify = require("fastify")({
  logger: {
    logging: "info"
  },
});
const axios = require("axios");
const path = require("path");

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "static"),
  prefix: "/static/",
});

const base_url = "https://online.bgnaplata.rs/publicapi/v1";
const apikey = "1688dc355af72ef09287";
const id_uid_map = {};

async function populateMap() {
  console.log("Populating map started");
  const allStations = await getAllStations();
  console.log("Fetched all stations");

  for (const station of allStations.stations) {
    id_uid_map[station.station_id] = station.id;
  }

  console.log("Populating map finished");
}

async function doRequest(url) {
  const headers = {
    "X-Api-Authentication": apikey,
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (err) {
    return { error: "Error sending request", message: err.message };
  }
}

async function getStationById(id) {
  const url = `${base_url}/announcement/announcement.php?station_uid=${
    id_uid_map[id] || 0
  }`;
  return await doRequest(url);
}

async function getAllStations() {
  const url = `${base_url}/networkextended.php?action=get_cities_extended`;
  const response = await doRequest(url);
  return response;
}

fastify.get("/api/stations/:id", async (request, reply) => {
    const id = request.params.id;
    const response = await getStationById(id);
    reply.send(response);
})
fastify.get("/api/stations/all", async (request, reply) => {
    const response = await getAllStations();
    reply.send(response);
})
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
