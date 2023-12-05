let toNotify = {};

const addToNotify = (city, station, vehicle, stationsAway) => {
  if (!toNotify[city]) {
    toNotify[city] = {};
  }

  if (!toNotify[city][station]) {
    toNotify[city][station] = {};
  }

  if (!toNotify[city][station][vehicle]) {
    toNotify[city][station][vehicle] = stationsAway;
  }
};

const isInNotify = (city, station, vehicle) => {
  if (!toNotify[city]) {
    return false;
  }

  if (!toNotify[city][station]) {
    return false;
  }

  return toNotify[city][station][vehicle] !== undefined;
};

const removeFromNotify = (city, station, vehicle) => {
  if (!toNotify[city]) {
    return;
  }

  if (!toNotify[city][station]) {
    return;
  }

  delete toNotify[city][station][vehicle];
};

const notify = async () => {
  for (const city of Object.keys(toNotify)) {
    for (const station of Object.keys(toNotify[city])) {
      let url = `/api/stations/${city}/search?uid=${station}`;
      let arrivals = await doAsyncRequest(url, "GET");

      for (const vehicle of arrivals.vehicles) {
        let currNotify = toNotify[city][station][vehicle.garageNo];
        if (!currNotify || vehicle.stationsBetween > currNotify) continue;

        const message = `Vozilo ${vehicle.garageNo} na liniji ${vehicle.lineNumber} je udaljen ${vehicle.stationsBetween} stanica od vas!`;
        pushNotification(message);
        notifyBtnTgl(
          station,
          vehicle.garageNo,
          document.getElementById(
            `notifyBtn-${city}-${station}-${vehicle.garageNo}`
          )
        );
        removeFromNotify(city, station, vehicle.garageNo);
      }
    }
  }
};

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    debugLog("vojko ve ne moze");
    alert("This browser does not support desktop notification");
    return false;
  }

  let permission = await Notification.requestPermission();
  return permission === "granted";
};

const pushNotification = (message) => {
  debugLog("pushing notification", message);
  if (Notification.permission === "granted")
    new Notification("BG++", { body: message });
};

setInterval(notify, 10000);
