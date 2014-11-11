// Don't forget delete next line;
var RTAPP;

$(document).ready(function () {

  /**
   * Our main app - RTAPP
   * @return {object} important functions and variables
   */
  RTAPP = (function () {

    var $loading,
        $currTime,
        $currLoc,
        geoData = {};

    /**
     * Initializing of RTAPP
     */
    var _init = function () {

      $loading = $("#loading");
      $currTime = $("#currTime");
      $currLoc = $("#currLoc");

      RTAPP.clear();
      $loading.show(200);

      if (RTAPP.getLoc()) {
        $loading.animate({width: "+=25%"}, 200);
        if (RTAPP.getTime(geoData.latitude, geoData.longitude)) {
          $loading.animate({width: "+=25%"}, 200);
          setInterval(RTAPP.incTime, 1000);
          setInterval(_blickColon, 500);
        }
      }

      $loading.animate({width: "+=25%"}, 200);
      RTAPP.info("RTAPP is initialized.", "init");
    };

    /**
     * Clear all data
     */
    var _clear = function () {
      console.clear();

      $currTime.text("");
      $currLoc.text("");
      geoData = {};

      RTAPP.info("RTAPP is cleared.", "clear");
      $loading.animate({width: "25%"}, 200);
    };

    /**
     * Console messages
     * Analog for all:
     * * log
     * * info
     * * warn
     * * error
     * @param  {object} message content of message
     * @param  {string} block   type of block in out app
     */
    var _logMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("%s: %O", block, message);
    };

    var _infoMessage = function (message, block) {
      block = block || "RTAPP";
      console.info("%s: %O", block, message);
    };

    var _warnMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("%s: %c%O", block, "color: yellow;", message);
    };

    var _errorMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("%s: %c%O", block, "color: red;", message);
    };

    /**
     * Get location by IP
     * if IP is empty then find yourself IP
     * @param  {string} ip "xxx.xxx.xxx.xxx"
     * @return {boolean}    Has city?
     */
    var _getLocation = function (ip) {

      ip = ip || "";

      $.ajax({
        type: "GET",
        url: "http://freegeoip.net/json/",
        dataType: "json",
        async: false,
        success: function (data) {
          geoData = data;
          try {
            geoData.city = geoData.city || geoData.region_name || "";
            RTAPP.info(geoData.city, "geoData");
          } catch (err) {
            RTAPP.error(err, "geoIP");
            geoData.city = undefined;
          }
        }
      });

      return RTAPP.setCity(geoData.city);

    };

    /**
     * Get time by params
     * @param  {string} latitude  
     * @param  {string} longitude 
     * @return {boolean}           Has time?
     */
    var _getTime = function (latitude, longitude) {

      latitude = geoData.latitude || "";
      longitude = geoData.longitude || "";

      var jsonTime = {};

      $.ajax({
        type: "GET",
        url: "/src/php/geotime.php",
        data: {
          "latitude": latitude,
          "longitude": longitude
        },
        async: false,
        success: function (data) {
          try {
            jsonTime = JSON.parse(data) || {ok: 0};
            if (jsonTime.ok) {
              RTAPP.info(jsonTime.time, "geoTime");
            } else {
              try {
                RTAPP.error(jsonTime.error, "geoTime");
              } catch (err) {
                RTAPP.error(err, "geoTime");
              }
              jsonTime.time = undefined;
            }
          } catch (err) {
            jsonTime.time = undefined;
            RTAPP.error(err, "geoTime");
          }
        }
      });

      return RTAPP.setTime(jsonTime.time);
    };

    /**
     * Setting time
     * @param {string} time Time in current location
     */
    var _setTime = function (time) {
      if (time) {
        geoData.time = time;
        $currTime.text(geoData.time);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Setting city to variables
     * @param {string} city 
     */
    var _setCity = function (city) {
      if (city) {
        geoData.city = city;
        $currLoc.text(city);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Increasing current time
     */
    var _increaseCurrentTime = function () {
      var tmpTime = geoData.time.split(":");
      var h = parseInt(tmpTime[0]);
      var m = parseInt(tmpTime[1]);
      var s = parseInt(tmpTime[2]);

      s++;
      if (s > 59) {
        s = 0;
        m++;
        if (m > 59) {
          m = 0;
          h++;
          if (h > 23) {
            h = 0;
          }
        }
      }

      s = ((s < 10) ? "0" : "") + s;
      m = ((m < 10) ? "0" : "") + m;
      h = ((h < 10) ? "0" : "") + h;
      RTAPP.setTime(h + ":" + m + ":" + s);

      delete h;
      delete m;
      delete s;

    };

    /**
     * Blink color (':') each 0.5 second
     */
    var _blickColon = function () {
      var tmpTime = geoData.time;

      if (tmpTime.indexOf(":") > 0) {
        tmpTime = tmpTime.replace(":", " ");
      } else {
        tmpTime = tmpTime.replace(" ", ":");
      }

      delete tmpTime;
    }

    return {
      init: _init,
      clear: _clear,
      log: _logMessage,
      info: _infoMessage,
      warn: _warnMessage,
      error: _errorMessage,
      getLoc: _getLocation,
      getTime: _getTime,
      setTime: _setTime,
      setCity: _setCity,
      incTime: _increaseCurrentTime,
    }
  }());

  RTAPP.init();
});
