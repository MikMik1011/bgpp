let currInterval;
let map, layerGroup;
let currQuery;
let allStations = {};

const DEBUG = false;

const coloredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -14],
    shadowSize: [41, 41],
  });
};

const debugLog = (...message) => {
  if (DEBUG) console.log(message);
}

const createMarker = (
  coords,
  name = undefined,
  color = "blue",
  popupText = undefined
) => {
  let marker = new L.marker(coords, { icon: coloredIcon(color) });
  if (popupText)
    marker.bindPopup(popupText, { autoClose: false, closeOnClick: false });
  if (name)
    marker.bindTooltip(name, {
      permanent: true,
      direction: "center",
      className: "my-labels",
    });
  return marker;
};

const addMarker = (coords, name = undefined, color = "blue") => {
  createMarker(coords, name, color).addTo(layerGroup);
};

const doAsyncRequest = async (url, type, data, errorHandler) => {
  if (!url) throw new Error("No url provided");
  try {
    return await $.ajax({
      url: url,
      type: type || "GET",
      data: data || {},
    });
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
      return;
    }

    console.error("Error sending request:", error);
  }
};

const fetchCityStations = async (city) => {
  let response = await doAsyncRequest(`/api/stations/${city}/all`);
  allStations[city] = response;
  debugLog(allStations);
  fillNameSearch(city);
};

const moveMapToCityCentre = (city) => {
  const cityCentres = {
    bg: [44.81254796404323, 20.46145496621977],
    ns: [45.267136, 19.833549],
    nis: [43.3209, 21.8958],
  };

  debugLog(`Moving map to ${city} centre`);
  if (!currInterval) map.setView(cityCentres[city], 13, { animation: true });
};

const fillNameSearch = (city) => {
  let stations = allStations[city];
  let names = stations.map((station) => {
    return `<option value="${station.uid}">${station.name} (${station.id})</option>`;
  });
  debugLog(names);
  $("#name-input").html(names);
};

const getSearchMode = () => {
  return $("#searchMode").val();
};

const getCity = () => {
  return encodeURIComponent($("#city").val());
};

const onCityChange = async () => {
  let city = getCity();
  changeBg(city);
  moveMapToCityCentre(city);
  if (!allStations[city]) await fetchCityStations(city);
  else fillNameSearch(city);
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

const checkLineSorting = () => {
  return $("#sort-lines").is(":checked");
};

const handleTabOut = () => {
  if (!checkDataSaver()) return;
  debugLog("tab out");
  clearInterval(currInterval);
};

const handleTabIn = () => {
  if (!checkDataSaver()) return;
  debugLog("tab in");
  spawnInterval();
};

const notifyBtnTgl = (station, vehicle, btn) => {
  if(!requestNotificationPermission()) return;
  let city = getCity();
  if (isInNotify(city, station, vehicle)) {
    removeFromNotify(city, station, vehicle);
    btn.innerHTML = '<i class="fa-regular fa-bell"></i>';
    return;
  }

  addToNotify(city, station, vehicle, 2);
  btn.innerHTML = '<i class="fa-regular fa-bell-slash"></i>';
};

const getNotifyButton = (station, vehicle) => {
  let city = getCity();
  if (isInNotify(city, station, vehicle)) {
    return `<button class="btn btn-danger" id="notifyBtn-${city}-${station}-${vehicle}" onclick="notifyBtnTgl('${station}', '${vehicle}', this)"><i class="fa-regular fa-bell-slash"></i></button>`;
  }
  return `<button class="btn btn-success"  id="notifyBtn-${city}-${station}-${vehicle}" onclick="notifyBtnTgl('${station}', '${vehicle}', this)"><i class="fa-regular fa-bell"></i></button>`;
};
const updateArrivals = (response, recenter) => {
  let date = new Date();

  let name = `${response.name} (${response.id})`;
  $("#stationName").html(`Stanica: ${name}`);
  $("#lastUpdated").html(
    `Poslednji put ažurirano: ${date.toLocaleTimeString()}`
  );
  $("#stationName").show();
  $("#lastUpdated").show();
  $("#updateInProgress").hide();
  toggleTable();

  layerGroup.clearLayers();
  debugLog(response.coords);
  if (recenter) map.setView(response.coords, 13, { animation: true });

  markers = [];
  markers.push(createMarker(response.coords, "", "yellow", name));

  if (checkLineSorting() && response.vehicles.length > 0) {
    response.vehicles.sort((a, b) => {
      return a.lineNumber != b.lineNumber && a.lineName !== b.lineName
        ? a.lineNumber - b.lineNumber
        : a.secondsLeft - b.secondsLeft;
    });
  } else response.vehicles.reverse();

  const tableData = response.vehicles
    .map((value) => {
      markers.push(
        createMarker(value.coords, value.lineNumber, "blue", value.garageNo)
      );
      if (!value.stationName) value.stationName = "¯\\_(ツ)_/¯";
      return `<tr>
                    <td>${value.lineNumber}</td>
                    <td>${formatSeconds(value.secondsLeft)}</td>
                    <td>${value.stationsBetween}</td>
                    <td>${value.stationName}</td>
                    <td>${value.garageNo}</td>
                    <td>${getNotifyButton(response.uid, value.garageNo)}</td>
                </tr>`;
    })
    .join("");
  $("#tableBody").html(tableData);
  let group = L.featureGroup(markers).addTo(layerGroup);
  if (recenter) map.fitBounds(group.getBounds());
};

const fetchArrivals = async (city, query, recenter) => {
  let url = `/api/stations/${city}/search?${$.param(query)}`;
  $("#updateInProgress").show();
  $("#error").hide();

  let response = await doAsyncRequest(url, "GET", undefined, (error) => {
    console.error("Error sending request:", error);
    $("#updateInProgress").hide();
    $("#error").html(
      `Greška pri ažuriranju podataka: ${error.responseJSON.message}`
    );
    $("#error").show();
  });
  updateArrivals(response, recenter);
};

const spawnInterval = (query = undefined) => {
  if (!query) query = currQuery;
  if (!query) return;

  let city = getCity();
  fetchArrivals(city, query, true);

  currInterval = clearInterval(currInterval);
  currInterval = setInterval(() => {
    fetchArrivals(city, query, false);
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

const submitByID = () => {
  let id = encodeURIComponent($("#id-input").val().trim());
  currQuery = { id: id };
  spawnInterval(currQuery);
};

const submitByName = () => {
  let uid = encodeURIComponent($("#name-input").val().trim());
  currQuery = { uid: uid };
  spawnInterval(currQuery);
};

const submitByCoords = () => {
  let uid = encodeURIComponent($("#coords-input").val().trim());
  currQuery = { uid: uid };
  spawnInterval(currQuery);
};

const toggleTable = () => {
  const tabela = document.getElementsByTagName("table");
  if (!currQuery) {
    for (let i = 0; i < tabela.length; i++) {
      tabela[i].style.display = "none";
    }
  } else {
    for (let i = 0; i < tabela.length; i++) {
      tabela[i].style.display = "table";
    }
  }
};

const getUserLocation = async () => {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          resolve(userLocation);
        },
        (error) => {
          $("#error").html("Greška pri dobavljanju lokacije.");
          $("#error").show();
          reject(error.message);
        }
      );
    } else {
      reject("Geolocation is not available in this browser.");
    }
  });
};

const getDistanceFromCoords = (lat1, lon1, lat2, lon2) => {
  const earthRadiusInMeters = 6371000; // Earth's radius in meters
  const deltaLat = (lat2 - lat1) * (Math.PI / 180);
  const deltaLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusInMeters * c;
  return distance;
};

const findClosestStations = async (
  userLocation,
  stationsArray,
  maxDistance = 300
) => {
  const stationsWithDistances = stationsArray.map((station) => {
    const distance = getDistanceFromCoords(
      userLocation.latitude,
      userLocation.longitude,
      ...station.coords
    );
    return { station, distance };
  });

  let closestStations = stationsWithDistances.filter(
    (item) => item.distance <= maxDistance
  );
  closestStations.sort((a, b) => a.distance - b.distance);

  closestStations = closestStations.map((station) => {
    station.distance = Math.round(station.distance);
    return station;
  });

  return closestStations;
};

const cancelInterval = () => {
  currInterval = clearInterval(currInterval);
  currQuery = undefined;
  layerGroup.clearLayers();
  toggleTable();
  $("#stationName").hide();
  $("#lastUpdated").hide();
};

const searchByCoords = async (
  searchCoords,
  maxDistanceElemID,
  optionsElemID
) => {
  $("#updateInProgress").show();
  const stationsMaxDistance = $(maxDistanceElemID).val();
  const closestStations = await findClosestStations(
    searchCoords,
    allStations[getCity()],
    stationsMaxDistance
  );
  layerGroup.clearLayers();
  cancelInterval();

  markers = [];
  markers.push(
    createMarker([searchCoords.latitude, searchCoords.longitude], "", "green")
  );
  let options = closestStations.map((station) => {
    let marker = createMarker(
      station.station.coords,
      station.station.id,
      "yellow"
    );
    marker.on("click", () => {
      $(optionsElemID).val(station.station.uid).trigger("change");
    });
    markers.push(marker);

    return `<option value="${station.station.uid}">${station.station.name} (${station.station.id}) | ${station.distance}m</option>`;
  });
  $(optionsElemID).html(options).trigger("change");

  let group = new L.featureGroup(markers).addTo(layerGroup);
  map.fitBounds(group.getBounds());
  $("#updateInProgress").hide();
};

const searchByGPS = async () => {
  $("#error").hide();
  const userLocation = await getUserLocation();
  searchByCoords(userLocation, "#stationsMaxDistance-input", "#coords-input");
};

const submitHandlers = {
  id: submitByID,
  name: submitByName,
  coords: submitByCoords,
};

$(document).ready(async () => {
  $(window).on("blur", handleTabOut);
  $(window).on("focus", handleTabIn);

  initMap();
  $(".select2").select2({ width: "resolve" });

  let response = await doAsyncRequest("/api/cities");

  let cities = Object.entries(response).map(([key, value]) => {
    return `<option value="${key}">${value}</option>`;
  });
  $("#city").html(cities);
  onCityChange();
  onSearchModeChange();

  $("#myForm").submit((event) => {
    event.preventDefault(); // Prevent form from being submitted
    submitHandlers[getSearchMode()]();
  });
});
