let currInterval;
let map, layerGroup;
let lastStationId = 0;

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

const cityCentres = {
  bg: [44.81254796404323, 20.46145496621977],
  ns: [45.267136, 19.833549],
  nis: [43.3209, 21.8958],
};

const moveMapToCityCentre = (city) => {
  console.log(`Moving map to ${city} centre`);
  if (!currInterval) map.setView(cityCentres[city], 13, { animation: true });
};

const formatSeconds = (seconds) => {
  let minutes = Math.floor(seconds / 60);
  let secondsLeft = seconds % 60;
  if (secondsLeft < 10) secondsLeft = `0${secondsLeft}`;
  return `${minutes}:${secondsLeft}`;
};

const spawnInterval = () => {
  let id = encodeURIComponent($("#idInput").val().trim());
  if (!id) return;

  let city = encodeURIComponent($("#city").val());
  updateDisplay(city, id, true);

  currInterval = clearInterval(currInterval);
  currInterval = setInterval(() => {
    updateDisplay(city, id, false);
  }, 10 * 1000);
};

const handleTabOut = () => {
  if (!$("#dataSaver").is(":checked")) return;
  console.log("tab out")
  clearInterval(currInterval);
};

const handleTabIn = () => {
  if (!$("#dataSaver").is(":checked")) return;
  console.log("tab in")
  spawnInterval();
};

const updateDisplay = (city, id, recenter) => {
  let url = `/api/stations/${city}/search?id=${id}`;
  $("#updateInProgress").show();
  $("#error").hide();

  $.ajax({
    url: url,
    type: "GET",
    success: function (response) {
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
    },
    error: function (error) {
      console.error("Error sending request:", error);
      $("#updateInProgress").hide();
      $("#error").show();
    },
  });
};

$(document).ready(function () {
  $(window).on("blur", handleTabOut);
  $(window).on("focus", handleTabIn);

  map = L.map("map", {
    center: [44.81254796404323, 20.46145496621977],
    zoom: 13,
  });
  layerGroup = L.layerGroup().addTo(map);

  L.control.layers(mapLayers).addTo(map);
  mapLayers.Transport.addTo(map);

  $.ajax({
    url: "/api/cities",
    type: "GET",
    success: function (response) {
      let cities = Object.entries(response).map(([key, value]) => {
        return `<option value="${key}">${value}</option>`;
      });
      $("#city").html(cities);
    },
    error: function (error) {
      console.error("Error sending request:", error);
      // Handle error here
    },
  });

  $("#myForm").submit(function (event) {
    event.preventDefault(); // Prevent form from being submitted
    spawnInterval();
  });
});
