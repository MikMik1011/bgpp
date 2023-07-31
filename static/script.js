let currInterval;
let map, layerGroup;
let currStationUID;
let allStations = {};

const stationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -14],
  shadowSize: [41, 41],
});

const fetchCityStations = (city) => {
  let url = `/api/stations/${city}/all`;
  $.ajax({
    url: url,
    type: "GET",
    success: (response) => {
      allStations[city] = response;
      console.log(allStations);
    },
    error: (error) => {
      console.error("Error sending request:", error);
    },
  });
};

const moveMapToCityCentre = (city) => {
  const cityCentres = {
    bg: [44.81254796404323, 20.46145496621977],
    ns: [45.267136, 19.833549],
    nis: [43.3209, 21.8958],
  };

  console.log(`Moving map to ${city} centre`);
  if (!currInterval) map.setView(cityCentres[city], 13, { animation: true });
};

const onCityChange = () => {
  let city = encodeURIComponent($("#city").val());
  changeBg(city);
  moveMapToCityCentre(city);
  if (!allStations[city]) fetchCityStations(city);
};

const onSearchModeChange = () => {
  let searchMode = $("#searchMode").val();
  $("#searchMode option")
    .toArray()
    .map((option) => {
      let value = $(option).val();
      if (value === searchMode) $(`.${value}-search`).show();
      else $(`.${value}-search`).hide();
    });
};

const formatSeconds = (seconds) => {
  let minutes = Math.floor(seconds / 60);
  let secondsLeft = seconds % 60;
  if (secondsLeft < 10) secondsLeft = `0${secondsLeft}`;
  return `${minutes}:${secondsLeft}`;
};

const checkDataSaver = () => {
  return $("#dataSaver").is(":checked");
};

const handleTabOut = () => {
  if (!checkDataSaver()) return;
  console.log("tab out");
  clearInterval(currInterval);
};

const handleTabIn = () => {
  if (!checkDataSaver()) return;
  console.log("tab in");
  spawnInterval();
};

const updateArrivals = (response, recenter) => {
  let date = new Date();
  response.vehicles.reverse();

  let name = `${response.name} (${response.id})`;
  $("#stationName").html(name);
  $("#lastUpdated").html(
    `Poslednji put ažurirano: ${date.toLocaleTimeString()}`
  );
  $("#updateInProgress").hide();

  layerGroup.clearLayers();
  console.log(response.coords);
  if (recenter) map.setView(response.coords, 13, { animation: true });

  let marker = new L.marker(response.coords, { icon: stationIcon });
  marker.addTo(layerGroup);

  const tableData = response.vehicles
    .map((value) => {
      let marker = new L.marker(value.coords);
      marker.bindTooltip(value.lineNumber, {
        permanent: true,
        direction: "center",
        className: "my-labels",
      });
      marker.addTo(layerGroup);
      return `<tr>
                    <td>${value.lineNumber}</td>
                    <td>${formatSeconds(value.secondsLeft)}</td>
                    <td>${value.stationsBetween}</td>
                    <td>${value.stationName}</td>
                    <td>${value.garageNo}</td>
                </tr>`;
    })
    .join("");
  $("#tableBody").html(tableData);
};

const fetchArrivals = (city, query, recenter) => {
  let url = `/api/stations/${city}/search?${$.param(query)}`;
  $("#updateInProgress").show();
  $("#error").hide();

  $.ajax({
    url: url,
    type: "GET",
    success: (response) => {
      updateArrivals(response, recenter);
    },
    error: (error) => {
      console.error("Error sending request:", error);
      $("#updateInProgress").hide();
      $("#error").show();
    },
  });
};

const spawnInterval = () => {
  let id = encodeURIComponent($("#id-input").val().trim());
  if (!id) return;

  let city = encodeURIComponent($("#city").val());
  fetchArrivals(city, { id: id }, true);

  currInterval = clearInterval(currInterval);
  currInterval = setInterval(() => {
    fetchArrivals(city, { id: id }, false);
  }, 10 * 1000);
};

const initMap = () => {
  map = L.map("map", {
    center: [44.81254796404323, 20.46145496621977],
    zoom: 13,
  });
  layerGroup = L.layerGroup().addTo(map);

  L.control.layers(mapLayers).addTo(map);
  mapLayers.Transport.addTo(map);
};

$(document).ready(() => {
  $(window).on("blur", handleTabOut);
  $(window).on("focus", handleTabIn);

  initMap();

  $.ajax({
    url: "/api/cities",
    type: "GET",
    success: (response) => {
      let cities = Object.entries(response).map(([key, value]) => {
        return `<option value="${key}">${value}</option>`;
      });
      $("#city").html(cities);
      onCityChange();
    },
    error: (error) => {
      console.error("Error sending request:", error);
      // Handle error here
    },
  });

  $("#myForm").submit((event) => {
    event.preventDefault(); // Prevent form from being submitted
    spawnInterval();
  });
});
