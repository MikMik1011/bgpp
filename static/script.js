var interval;
var map, layerGroup;
let lastStationId = 0;

const updateDisplay = (id, recenter) => {
  var url = "/api/stations/" + id;
  $("#stationName").append(`<i>azuriranje u toku...</i> <br>`);
  
  $.ajax({
    url: url,
    type: "GET",
    success: function (response) {
      var date = new Date();
      response.reverse();

      $("#stationName")
        .html(`<b>${response[0].station_name.toLowerCase()}</b> <br>
                <i> azurirano: ${date
                  .toLocaleTimeString()
                  .toLowerCase()} </i> <br>`);

      layerGroup.clearLayers();
      if (recenter)
        map.setView(
          [response[0].stations_gpsx, response[0].stations_gpsy],
          12,
          { animation: true }
        );

      const tableData = response
        .map((value) => {
          if (value.just_coordinates === "1")
            return `<h4> nema buseva mrs peske!</h4>`;

          let marker = new L.marker([
            value.vehicles[0].lat,
            value.vehicles[0].lng,
          ]);
          marker.bindTooltip(value.line_number.toLowerCase(), {
            permanent: true,
            direction: "center",
            className: "my-labels",
          });
          marker.addTo(layerGroup);
          return `<tr>
                        <td>${value.line_number.toLowerCase()}</td>
                        <td>${Math.floor(value.seconds_left / 60)}:${
            value.seconds_left % 60
          }</td>
                        <td>${value.stations_between}</td>
                        <td>${value.vehicles[0].station_name.toLowerCase()}</td>
                        <td>${value.vehicles[0].garageNo.toLowerCase()}</td>
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
    zoom: 12,
  });
  layerGroup = L.layerGroup().addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  $("#myForm").submit(function (event) {
    event.preventDefault(); // Prevent form from being submitted

    var id = encodeURIComponent($("#idInput").val());
    updateDisplay(id, true);

    clearInterval(interval);
    interval = setInterval(() => {
      updateDisplay(id, false);
    }, 10 * 1000);
  });
});
