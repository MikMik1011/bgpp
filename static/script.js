$(document).ready(function () {
  $("#myForm").submit(function (event) {
    event.preventDefault(); // Prevent form from being submitted

    var id = encodeURIComponent($("#idInput").val());

    var url = "/api/stations/" + id;

    $.ajax({
      url: url,
      type: "GET",
      success: function (response) {
        console.log("Request sent successfully");
        console.log(response);
        const tableData = response
          .map((value) => {
            if (value.just_coordinates != "1")
                return `<tr>
                     <td>${value.line_number}</td>
                     <td>${Math.floor(value.seconds_left / 60)}:${value.seconds_left % 60}</td>
                     <td>${value.stations_between}</td>
                  </tr>`;
          })
          .join("");
        const tableBody = document.querySelector("#tableBody");
        tableBody.innerHTML = tableData;
      },
      error: function (error) {
        console.error("Error sending request:", error);
        // Handle error here
      },
    });
  });
});
