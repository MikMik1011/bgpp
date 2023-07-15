var interval;
var map, layerGroup;
let lastStationId = 0;

const updateDisplay = (city, id, recenter) => {
  var url = `/api/stations/${city}/${id}`;
  $("#stationName").append(`<i>azuriranje u toku...</i> <br>`);

  $.ajax({
    url: url,
    type: "GET",
    success: function (response) {
      var date = new Date();
      response.vehicles.reverse();

      $("#stationName")
        .html(`<b>${response.name.toLowerCase()} (${response.id.toLowerCase()})</b> <br>
                <i> azurirano: ${date
                  .toLocaleTimeString()
                  .toLowerCase()} </i> <br>`);

      layerGroup.clearLayers();
      console.log(response.coords)
      if (recenter)
        map.setView(
          response.coords,
          13,
          { animation: true }
        );

      const tableData = response.vehicles
        .map((value) => {

          let marker = new L.marker(value.coords);
          marker.bindTooltip(value.lineNumber.toLowerCase(), {
            permanent: true,
            direction: "center",
            className: "my-labels",
          });
          marker.addTo(layerGroup);
          return `<tr>
                        <td>${value.lineNumber.toLowerCase()}</td>
                        <td>${Math.floor(value.secondsLeft / 60)}:${
            value.secondsLeft % 60
          }</td>
                        <td>${value.stationsBetween}</td>
                        <td>${value.stationName.toLowerCase()}</td>
                        <td>${value.garageNo.toLowerCase()}</td>
                    </tr>`;
        })
        .join("");
      $("#tableBody").html(tableData);
    },
    error: function (error) {
      console.error("Error sending request:", error);
      // Handle error here
    },
  });
};

$(document).ready(function () {
  map = L.map("map", {
    center: [44.81254796404323, 20.46145496621977],
    zoom: 13,
  });
  layerGroup = L.layerGroup().addTo(map);

  
  L.control.layers(mapLayers).addTo(map);
  mapLayers.Transport.addTo(map);

  $("#myForm").submit(function (event) {
    event.preventDefault(); // Prevent form from being submitted

    var id = $("#idInput").val();
    var city = $("#city").val();
    updateDisplay(city, id, true);

    clearInterval(interval);
    interval = setInterval(() => {
      updateDisplay(city, id, false);
    }, 10 * 1000);
  });
});
