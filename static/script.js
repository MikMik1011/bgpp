let currInterval;
let map, layerGroup;
let currQuery;
let allStations = {};

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

const createMarker = (coords, name = undefined, color = "blue") => {
  let marker = new L.marker(coords, { icon: coloredIcon(color) });
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

const fetchCityStations = (city) => {
  let url = `/api/stations/${city}/all`;
  $.ajax({
    url: url,
    type: "GET",
    success: (response) => {
      allStations[city] = response;
      console.log(allStations);
      fillNameSearch(city);
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

const fillNameSearch = (city) => {
  let stations = allStations[city];
  let names = stations.map((station) => {
    return `<option value="${station.uid}">${station.name} (${station.id})</option>`;
  });
  console.log(names);
  $("#name-input").html(names);
};

const getSearchMode = () => {
  return $("#searchMode").val();
};

const getCity = () => {
  return encodeURIComponent($("#city").val());
};

const onCityChange = () => {
  let city = getCity();
  changeBg(city);
  moveMapToCityCentre(city);
  if (!allStations[city]) fetchCityStations(city);
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
  $("#stationName").show();
  $("#lastUpdated").show();
  $("#updateInProgress").hide();
  toggleTable();

  layerGroup.clearLayers();
  console.log(response.coords);
  if (recenter) map.setView(response.coords, 13, { animation: true });

  markers = [];
  markers.push(createMarker(response.coords, "", "yellow"));

  const tableData = response.vehicles
    .map((value) => {
      markers.push(createMarker(value.coords, value.lineNumber));
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
  let group = L.featureGroup(markers).addTo(layerGroup);
  if (recenter) map.fitBounds(group.getBounds());
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

const submitHandlers = {
  name: submitByName,
  coords: submitByCoords,
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
  numberOfStations = 10
) => {
  // Calculate distances for all stations and store in an array of { station, distance } objects
  const stationsWithDistances = stationsArray.map((station) => {
    const distance = getDistanceFromCoords(
      userLocation.latitude,
      userLocation.longitude,
      ...station.coords
    );
    return { station, distance };
  });

  // Sort the stations based on the calculated distances
  stationsWithDistances.sort((a, b) => a.distance - b.distance);

  // Select the top numberOfStations stations (closest stations) and extract the station objects
  const closestStations = stationsWithDistances
    .slice(0, numberOfStations)
    .map((station) => {
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

const searchByGPS = async () => {
  const quantity = $("#quantity-input").val();
  const userLocation = await getUserLocation();
  const closestStations = await findClosestStations(
    userLocation,
    allStations[getCity()],
    quantity
  );
  layerGroup.clearLayers();
  cancelInterval();

  markers = [];
  markers.push(
    createMarker([userLocation.latitude, userLocation.longitude], "", "green")
  );
  let options = closestStations.map((station) => {
    markers.push(
      createMarker(station.station.coords, station.station.id, "yellow")
    );
    return `<option value="${station.station.uid}">${station.station.name} (${station.station.id}) | ${station.distance}m</option>`;
  });
  $("#coords-input").html(options).trigger("change");

  let group = new L.featureGroup(markers).addTo(layerGroup);
  map.fitBounds(group.getBounds());
};

$(document).ready(() => {
  $(window).on("blur", handleTabOut);
  $(window).on("focus", handleTabIn);

  initMap();
  $(".select2").select2({ width: "resolve" });

  $.ajax({
    url: "/api/cities",
    type: "GET",
    success: (response) => {
      let cities = Object.entries(response).map(([key, value]) => {
        return `<option value="${key}">${value}</option>`;
      });
      $("#city").html(cities);
      onCityChange();
      onSearchModeChange();
    },
    error: (error) => {
      console.error("Error sending request:", error);
      // Handle error here
    },
  });

  $("#myForm").submit((event) => {
    event.preventDefault(); // Prevent form from being submitted
    submitHandlers[getSearchMode()]();
  });
});
