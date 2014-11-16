var RTAPP;

$(document).ready(function () {

  /**
   * Our main app - RTAPP
   * @return {Object} important functions and variables
   */
  RTAPP = (function () {

    /** 
     * DOM Objects
     * @type {Object}
     */
    var $body,
        $loading,
        $day,
        $night,
        $currTime,
        $currLoc,
        $currWeather,
        $sun,
        $moon,
        $search,
        $searchInput,
        $searchBtn,
        $vleuger,
        $answer,
        $clouds;

    /**
     * Other variabels
     * @type {Mixin}
     */
    var _geoData = {},
        _cacheSpeech = [],
        _incInterval,
        _incClouds,
        _availableSpeech = {
          can: false,
        },
        speech,
        _loading = {
          sum: 0,
          count: 4,
        },
        _availableBrowserSpeech,
        _weatherInterval,
        _nextSecond = true,
        _stop = true,
        _debug = false,
        _googleAPIKey = "AIzaSyDIffw8pbKUFH9dv2VGC30WLsjpY1lrAdo",
        _weatherAPIKey = "ee072e7e3641f40d939047490464803b",
        _forecastAPIKey = "f48afb37d55582c0dfdacca52b6b9b39",
        _windowWidth = $(window).outerWidth();

    /**
     * CONSTS
     */
    var BEAUFORT_SCALE = [ 
          {
            speed: 0.3,
            phrase: "Calm",
            full_phase: "There is no wind behind window. ",
          }, {
            speed: 1.5,
            phrase: "Light air",
            full_phase: "The light breeze makes you feel freshly.",
          }, {
            speed: 3.3,
            phrase: "Light breeze",
            full_phase: "Look at your vane. It's revolving because of wind.",
          }, {
            speed: 5.4,
            phrase: "Gentle breeze",
            full_phase: "The leafs are whispering in your ear.",
          }, {
            speed: 7.9,
            phrase: "Moderate breeze",
            full_phase: "The dust is rising up, protect your noses.",
          }, {
            speed: 10.7,
            phrase: "Fresh breeze",
            full_phase: "Stretch your arm: don't you feel the wind?",
          }, {
            speed: 13.8,
            phrase: "Strong breeze",
            full_phase: "You might hear that the trees are creaking.",
          }, {
            speed: 17.1,
            phrase: "High wind",
            full_phase: "Strong wind: the trees are swaying.",
          }, {
            speed: 20.7,
            phrase: "Gale",
            full_phase: "Very strong wind: do not try to go against wind.",
          }, {
            speed: 24.4,
            phrase: "Strong gale",
            full_phase: "Storm warning: do not go out to sea it might be dangerous!",
          }, {
            speed: 28.4,
            phrase: "Storm",
            full_phase: "Strong storm: look at the sky, there are flying trees!",
          }, {
            speed: 32.6,
            phrase: "Violent storm",
            full_phase: "Very strong storm: a lot of distractions beside your place.",
          }, {
            speed: 1000,
            phrase: "Hurricane force",
            full_phase: "Hurricane: this is the end my lonely friend...",
          },
        ],
        TEMP = [
          {
            from: -100,
            to: -25,
            phrase: "Ooh! It's freaking cold outside! Keep your balls warm!",
          },
          {
            from: -25,
            to: -20,
            phrase: "The icicle in your red nose like a bell.",
          },
          {
            from: -20,
            to: -15,
            phrase: "Where are your skates? ",
          },
          {
            from: -15,
            to: -10,
            phrase: "Take out the sled, we are going to ride.",
          },
          {
            from: -10,
            to: -5,
            phrase: "It's cold. Do not forget wear a hat on your head.",
          },
          {
            from: -5,
            to: 0,
            phrase: "The scarf helps you to prevent your cough.",
          },
          {
            from: 0,
            to: 10,
            phrase: "Water turned to ice.",
          },
          {
            from: 10,
            to: 20,
            phrase: "There is an exhalation from your breathing.",
          },
          {
            from: 20,
            to: 30,
            phrase: "Go walking or bicycling.",
          },
          {
            from: 30,
            to: 40,
            phrase: "Go to the river or the sea and lay on the sun.",
          }, 
          {
            from: 40,
            to: 1000,
            phrase: "Turn on your fan and enjoy.",
          },
        ],
        RND_PHRASE = [
          {
            phrase: "Have a nice day!",
          },
          {
            phrase: "How are you?",
          },
          {
            phrase: "With best wishes, Chrome!",
          },
          {
            phrase: "Hey! Chin up!",
          }, 
          {
            phrase: ""
          }
        ];

    /**
     * Initializing of RTAPP
     * TODO:: save configuration
     */
    var _init = function () {

      $body = $("body");
      $loading = $("#loading");

      Object.observe(_loading, function (changes) {
        changes.forEach(function (change) {
          if (change.object.sum == change.object.count) {
            setTimeout(function () {
              RTAPP.info("RTAPP is initialized.", "init");
              $loading.animate({
                "height": "6px",
              }, 500);
            }, 1000);
          }
        });
      });

      $currLoc = $("#currLoc");
      $currTime = $("#currTime");
      $currWeather = $("#currWeather");
      $sun = $("#sun");
      $moon = $("#moon");
      $vleuger = $("#vleuger");
      $answer = $("#answer");
      $day = $("#day");
      $night = $("#night");
      $clouds = $("#clouds");


      RTAPP.clear();
      ++_loading.sum;

      if (navigator.geolocation) {
        var options = {
          timeout: 100000,
        };

        navigator.geolocation.getCurrentPosition(
          RTAPP.getLocation, 
          _errorPosition, 
          options
          );
      } else {
        RTAPP.error("Geolocation is not supported by this browser.", "initGeo");
        return;
      }
      _incInterval = setInterval(_increaseTime, 500);


      Object.observe(_availableSpeech, function (changes) {
        changes.forEach(function (change) {
          if (!change.oldValue && _cacheSpeech.length > 0) {
            _speech(_cacheSpeech[0]);
          }
          // console.log(change);
        });
      });
      // _availableSpeech.can = true;

      Object.observe(_cacheSpeech, function (changes) {
        changes.forEach(function (change) {
          // console.log(change, _cacheSpeech);
          if (change.type == "add" && change.name == "0") {
            _availableSpeech.can = true;
          }
        });
      });
      _availableBrowserSpeech = ('speechSynthesis' in window);

      RTAPP.speak("Hallo! You are welcomed by Real Time App.");

      _weatherInterval = setInterval(_setWeather, 1800000);

      $search = $("#search");
      $searchInput = $search.find("input");
      $searchBtn = $search.find("button[type=submit]");

      RTAPP.addListener();

      $search.focus();

      ++_loading.sum;

      if (typeof(Storage) !== "undefined") {
        // _availableSpeech.can = false;
        if (localStorage.tour == "0" || !localStorage.tour) {
          $('#RTAppTour').joyride({
            autoStart : true,
            modal: true,
            expose: true,
            postRideCallback: function (index, tip, abort) {
              localStorage.tour = "1";
            },
          });
        }
      } else {
          RTAPP.log("Sorry! No Web Storage support..", "locStrg");
      }

    };

    /**
     * Clear all data
     */
    var _clear = function () {
      // console.clear();

      RTAPP.stop();

      $loading.animate({
        "height": "100%",
      }, 500);

      _loading.sum = 0;

      $currTime.text("00:00:00");
      $currLoc.text("Location");
      _geoData = {};

      $sun.text("");
      $moon.text("");

      _cacheSpeech = [];

      RTAPP.info("RTAPP is cleared.", "clear");
    };

    /**
     * Console messages
     * Analog for all:
     * * log
     * * info
     * * warn
     * * error
     * @param  {Object} message content of message
     * @param  {String} block   type of block in out app
     */
    var _logMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("LOG | %s: %O", block, message);
    };

    var _infoMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("INFO | %s: %O", block, message);
    };

    var _warnMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("WARNING | %s: %c%O", block, "color: yellow;", message);
    };

    var _errorMessage = function (message, block) {
      block = block || "RTAPP";
      console.log("ERROR | %s: %c%O", block, "color: red;", message);
    };

    /**
     * Inizialize all listeners
     */
    var _addListener = function () {

      $('[data-toggle="tooltip"]').tooltip();

      $search.on("submit", _searchHandler);

      $search.on("reset", function (event) {
        RTAPP.init();
      });

      $vleuger.hover(function () {
        $("#pole").popover({
          content: "<div><strong>Speed:</strong> <span class='speed'>" + 
            _geoData.speed + "</span> mps</div>" + 
            "<div><strong>Direction:</strong> <span class='deg_speed'>" +
            _geoData.deg_speed.abbr + "</span></div>",
          title: "Wind",
          html: true,
          placement: "top",
          trigger: "hover",
        });
      }, function () {
        $("#pole").popover("destroy");
      });

      $vleuger.on("click", function () {
        RTAPP.speak("Current speed of wind is " + _geoData.speed + 
          " meters per second. " + 
          BEAUFORT_SCALE[_geoData.speed_beaufort].full_phase + 
          " Current direction of wind is " + 
          _geoData.deg_speed.full);
      });

      $currTime.on("click", function (event) {
        RTAPP.speak("It is " + $(this).text().substr(0, 5) + " now in " + 
          _geoData.city + ". " + _getRandomPhrase());
      });

      $currLoc.on("click", function (event) {
        RTAPP.speak("Current city is " + _geoData.city + 
          ". It is a beautiful city, is not it?");
      });

      $("#mute").hover(function () {
        if (_availableBrowserSpeech) {
          $(this).find(".glyphicon").toggleClass("glyphicon-volume-up glyphicon-volume-off");
        }
      }, function () {
        if (_availableBrowserSpeech) {
          $(this).find(".glyphicon").toggleClass("glyphicon-volume-up glyphicon-volume-off");
        }
      });

      $currWeather.on("click", function () {
        RTAPP.speak("Current temperature in " + _geoData.city + 
          " is " + _geoData.temp + " degrees Celsius. " + 
          TEMP[_geoData.temp_phrase].phrase);
      });

      var _skyObjects = function (event) {
        RTAPP.speak("Today sunrise is in " + _geoData.sunrise + 
            "and sunset is in " + _geoData.sunset + ".");
      };

      $sun.on("click", _skyObjects);
      $moon.on("click", _skyObjects);
      $sun.hover(function () {
        $(this).popover({
          content: "<div><strong>Sunset:</strong> <span class='sunset'>" + 
            _geoData.sunset + "</span></div>" + 
            "<div><strong>Sunrise:</strong> <span class='sunrise'>" +
            _geoData.sunrise + "</span></div>",
          title: "Sun",
          html: true,
          placement: "left",
          trigger: "hover",
        });
      }, function () {
        $(this).popover("destroy");
      });
      $moon.hover(function () {
        $(this).popover({
          content: "<div><strong>Sunset:</strong> <span class='sunset'>" + 
            _geoData.sunset + "</span></div>" + 
            "<div><strong>Sunrise:</strong> <span class='sunrise'>" +
            _geoData.sunrise + "</span></div>",
          title: "Moon",
          html: true,
          placement: "left",
          trigger: "hover",
        });
      }, function () {
        $(this).popover("destroy");
      });

    };

    /**
     * Handler for search input
     * @param  {Object} event [search event]
     */
    var _searchHandler = function (event) {
      event.preventDefault();
      var value = $searchInput.val();
      if (value == "") {
        $searchInput.focus();
      } else {
        RTAPP.getLocationN(value);
      }
    };

    /**
     * get location by browser navigator
     * @param  {Object} position coordinates and timestamp
     */
    var _getLocationByNavigator = function (position) {

      position = position || {};

      RTAPP.log(position, "navCoord");
      _geoData.latitude = position.coords.latitude;
      _geoData.longitude = position.coords.longitude;
      _geoData.timestamp = position.timestamp;


      var stopGeo = false;

      $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + 
          _geoData.latitude + "," + _geoData.longitude + 
          "&components=locality&language=en&sensor=false",
        success: function (data) {
          RTAPP.log(data, "GooGeo");
          $.each(data['results'], function (i, val) {
            $.each(val['address_components'], function (i, val) {
              if (val['types'][0] == "locality" && !stopGeo) {
                RTAPP.setCity(val['long_name']);
                _geoData.city = val['long_name'];
                stopGeo = true;
                ++_loading.sum;
                RTAPP.setTimezone();
              }
            });
          });
        },
        error: function () {
          RTAPP.error("Google GEO by Navigator");
        }
      });

    };

    /**
     * Find coordinates by name via Google Geolocation
     * @param  {String} name 
     */
    var _getLocationByName = function (name) {
      name = name || _geoData.city;

      var stopGeo = false;

      $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://maps.googleapis.com/maps/api/geocode/json" + 
          "?address=" + name + "&components=locality&language=en&sensor=false",
        success: function (data) {
          RTAPP.log(data, "getData");
          if (data['status'] == "OK") {
            $.each(data['results'], function (i, val) {
              var tmpCity;
              $.each(val['address_components'], function (i, val) {
                if (val['types'][0] == "locality" && !stopGeo) {
                  tmpCity = val['long_name'];
                  stopGeo = true;
                }
              });
              tmpCity = tmpCity || name;
              RTAPP.setCity(tmpCity);
              if (i == 0) {
                _geoData.latitude = val['geometry']['location']['lat'];
                _geoData.longitude = val['geometry']['location']['lng'];
                // _geoData.city = name;
                // RTAPP.info(_geoData, "updData");
              }
            });
            RTAPP.setTimezone();
          } else if (data['status'] == "ZERO_RESULTS") {
            RTAPP.warn("No available results for query: '" + name + "'.", 
              "getData");
          }
        },
        error: function () {
          RTAPP.error("Google GEO by Name.");
        }
      });
    };

    /**
     * Error of navigator.geolocation
     * @param  {Object} error 
     */
    var _errorPosition = function (error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          RTAPP.warn("User denied the request for Geolocation.", "errPos");
          break;
        case error.POSITION_UNAVAILABLE:
          RTAPP.warn("Location information is unavailable.", "errPos");
          break;
        case error.TIMEOUT:
          RTAPP.warn("The request to get user location timed out.", "errPos");
          break;
        case error.UNKNOWN_ERROR:
          RTAPP.warn("An unknown error occurred.", "errPos");
          break;
      }
    };

    /**
     * Set timezone to variables
     */
    var _setTimezone = function () {

      $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://maps.googleapis.com/maps/api/timezone/json" + 
          "?location=" + _geoData.latitude + "," + _geoData.longitude + 
          "&timestamp=" + Math.floor(_geoData.timestamp / 1000) + 
          "&key=" + _googleAPIKey,
        success: function (data) {
          try {
            if (data.status == "OK") {
              _geoData.rawOffset = data.rawOffset;
              RTAPP.start();
              setTimeout(function () {
                RTAPP.setWeather();
              }, 1000);
              ++_loading.sum;
            }
          } catch (err) {
            RTAPP.error(data, "gooTZ");
            RTAPP.error(err, "errTZ");
          }
        },
      });

    };

    /**
     * Get weather from Yahoo
     */
    var _setWeather = function () {

      var yahooCallback = function (data) {
        try {
          if (!data.query.results) {
            RTAPP.speak("Sorry! No weather data available for this query. " +
              "Try other.");
          } else {
            var currTemp = _f2c(data.query.results.channel.item.condition.temp);
            currTemp = currTemp.toFixed(1);
            $currWeather.html(currTemp + " &deg;C");
            _geoData.temp = currTemp;
            var sunset = data.query.results.channel.astronomy.sunset.split(/[\s:]/);
            $(".sunset").text(sunset);
            if (sunset[2] == "pm") sunset[0] = parseInt(sunset[0]) + 12;
            _geoData.sunset = sunset[0] + ":" + sunset[1];
            var sunrise = data.query.results.channel.astronomy.sunrise.split(/[\s:]/);
            $(".sunrise").text(sunrise);
            if (sunrise[2] == "pm") sunrise[0] = parseInt(sunrise[0]) + 12;
            _geoData.sunrise = sunrise[0] + ":" + sunrise[1];
            _setWind(data.query.results.channel.wind);
            _analyzeWeather();
          }
        } catch (err) {
          RTAPP.error("Something goes wrong!", "yaWea");
        }
      };

      if (!_stop) {

        $.ajax({
          type: "GET",
          dataType: "json",
          url: encodeURI("https://query.yahooapis.com/v1/public/yql?q=" + 
            "select * from weather.forecast where woeid in " + 
            "(select woeid from geo.places(1) where text='" + 
              _geoData.city + "')&format=json"),
          success: yahooCallback,
        });
      }

    };

    /**
     * Analyze new weather
     */
    var _analyzeWeather = function () {

      var tmpTemp = _geoData.temp;

      var N = 0;
      TEMP.forEach(function (item, i, arr) {
        if (item.from <= tmpTemp && item.to > tmpTemp) {
          N = i;
        }
      });

      _geoData.temp_phrase = N;

      RTAPP.speak("Current temperature in " + _geoData.city + 
        " is " + _geoData.temp + " degrees Celsius. " + 
        TEMP[_geoData.temp_phrase].phrase);

      $clouds.html("");

      count = Math.floor((Math.random() * 10) + 3);
      for (var i = 1; i < count; i++) {
        _createCloud();
      }

      _incClouds = setInterval(function () {
        sp = _geoData.speed * 1.5 + (Math.floor((Math.random() * 2) + 1));
        $clouds.find("img").animate({
          left: "+=" + sp +"px",
        }, 100);
        $clouds.find("img").each(function (ind, el) {
          if ( _windowWidth <= parseFloat($(el).css("left").replace("px")) ) {
            $(el).remove();
          }
          if ( _windowWidth <= (parseFloat($(el).css("left").replace("px")) + 
            $(el).outerWidth() )  && !$(el).hasClass("to-remove") ) {
            _createCloud($(el).src, -parseFloat($(el).width()), 
              parseFloat($(el).css("top")));
            $(el).addClass("to-remove");
          }
        });
      }, 100);


    };

    /**
     * Create cloud by parameters
     * @param  {String} src [description]
     * @param  {Float} x   [description]
     * @param  {Float} y   [description]
     */
    var _createCloud = function (src, x, y) {
      rnd = Math.floor(Math.random() * _windowWidth);
      x = x || Math.floor((Math.random() * rnd) + 1);
      y = y || Math.floor((Math.random() * 50) + 5 );
      src =  src || 
        "./src/images/cloud-" + Math.floor(Math.random() * 3) + ".png";
      var id = Math.floor(Math.random() * 10000);
      // console.log(src, x, y);
      $img = $("<img src='" + src + "' id='cloud" + id + "'>").css({
        top: y + "px",
        left: x + "px",
      });
      $clouds.append($img);

    };

    /**
     * Change angle of vlueger
     * @param {Float} speed 
     */
    var _setWind = function (wind) {
      var speed = _mph2mps(wind.speed) || 0;

      _geoData.speed = speed.toFixed(1);

      var phi = Math.PI * wind.direction / 180;
      var dphi = Math.PI / 8;

      var Nphi = Math.floor(phi / dphi);

      _geoData.deg_speed = {};
      switch (Nphi) {
        case 0:
        case 15:
          _geoData.deg_speed.abbr = "E";
          _geoData.deg_speed.full = "east";
          break;
        case 1:
        case 2:
          _geoData.deg_speed.abbr = "NE";
          _geoData.deg_speed.full = "northeast";
          break;
        case 3:
        case 4:
          _geoData.deg_speed.abbr = "N";
          _geoData.deg_speed.full = "north";
          break;
        case 5:
        case 6:
          _geoData.deg_speed.abbr = "NW";
          _geoData.deg_speed.full = "northwest";
          break;
        case 7:
        case 8:
          _geoData.deg_speed.abbr = "W";
          _geoData.deg_speed.full = "west";
          break;
        case 9:
        case 10:
          _geoData.deg_speed.abbr = "SW";
          _geoData.deg_speed.full = "southwest";
          break;
        case 11:
        case 12:
          _geoData.deg_speed.abbr = "S";
          _geoData.deg_speed.full = "south";
          break;
        case 13:
        case 14:
          _geoData.deg_speed.abbr = "SE";
          _geoData.deg_speed.full = "east";
          break;
      }

      $(".speed").text(_geoData.speed);
      $(".deg_speed").text(_geoData.deg_speed.abbr);

      var i = 0;
      while (BEAUFORT_SCALE[i].speed < speed) {
        i++;
      }
      // RTAPP.info("Now wind: " + speed + " mps. " + 
      //   BEAUFORT_SCALE[i]['phrase'], "setWind");

      _geoData.speed_beaufort = i;

      // $vleuger.css("background", 
        // "url(./src/images/vleuger"+i+".png) no-repeat");
      $vleuger.html("").append("<img src='./src/images/vleuger" + i + 
        ".png' alt=''>");
      // Angel for vleuger
      //  var phi = 270 - (i * 90 / 12);

    };

    /**
     * [_getRandomPhrase description]
     * @return {String} [description]
     */
    var _getRandomPhrase = function () {
      var random = Math.floor((Math.random() * RND_PHRASE.length) + 1) - 1;
      return RND_PHRASE[random].phrase;
    }

    /**
     * Increasing current time
     * TODO:: change it
     */
    var _increaseTime = function () {

      if (!_stop) {
        var tmp = new Date();
        var dateUTC = new Date(
          tmp.getUTCFullYear(), 
          tmp.getUTCMonth(), 
          tmp.getUTCDate(), 
          tmp.getUTCHours(), 
          tmp.getUTCMinutes(), 
          tmp.getUTCSeconds(),
          tmp.getUTCMilliseconds()
          );
        var utc = dateUTC.getTime();
        var dateTZ = new Date(utc + _geoData.rawOffset * 1000);

        RTAPP.setTime(dateTZ.format("isoTime"));
        var cd = parseInt(dateTZ.format("HH")) * 3600 + 
          parseInt(dateTZ.format("MM")) * 60 + 
          parseInt(dateTZ.format("ss"));

        RTAPP.setCoord(cd);

        if (!(cd % 1800) && _nextSecond) {
          RTAPP.speak("It is " + dateTZ.format("HH:MM") + " now.");
          RTAPP.log(cd, "incTime");
          _nextSecond = false;
        } else if (!(cd % 1800)) {
          _nextSecond = true;
        }

        var tod = Math.floor(parseInt(dateTZ.format("HH")) / 3);
        // $currTime.removeClass().addClass('tod-' + tod);
      }

    };

    /**
     * Setting time
     * @param {String} time Time in current location
     */
    var _setTime = function (time) {
      if (time) {
        _geoData.time = time;
        $currTime.text(_geoData.time);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Setting city to variables
     * @param {String} city 
     */
    var _setCity = function (city) {
      if (city) {
        _geoData.city = city;
        $currLoc.text(_geoData.city);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Set coordinates of all sky objects as current time
     * @param {Int} t seconds from start of this day
     */
    var _setCoordinateToObject = function (t) {

      var T = 86400; //86400

      var tmp = -2 * Math.PI * (t + (T / 4)) / T;
      var x = 30 * Math.cos(tmp) + 50;
      var y = 80 * Math.sin(tmp);

      var day,
      night;
      night = Math.abs(tmp / Math.PI + 1.5);
      day = 1 - night;
      $day.css("opacity", day);
      $night.css("opacity", night);

      $sun.animate({
        left:   x + "%",
        bottom: y + "%",
      }, {
        duration: 20,
        queue: true,
      });

      $moon.animate({
        left:   (-x + 100) + "%",
        bottom: -y + "%",
      }, {
        duration: 20,
        queue: true,
      });

    };

    /**
     * Stop application
     */
    var _stop = function () {
      if (!_stop) {
        _stop = true;
        $body.toggleClass("start stop");
      }
    };

    /**
     * Start appliaction
     */
    var _start = function () {
      if (_stop) {
        _stop = false;
        $body.toggleClass("start stop");
        setTimeout(function () {
          RTAPP.speak("It is " + $currTime.text().substr(0, 5) + " now.");
        }, 600);
      }
    };

    var _speakText = function (text) {
      text = text || "";

      text.split(". ").forEach(function (item, i) {
        _cacheSpeech.push(item);
      });
    };

    var _speech = function (text) {
      text = text || "";

      if (_availableBrowserSpeech && _availableSpeech.can) {
        _availableSpeech.can = false;
        speech = new SpeechSynthesisUtterance();
        speech.voiceURI = 'native';
        speech.volume = 1;
        speech.rate = 0.1;
        speech.pitch = 2;
        speech.text = text;
        speech.lang = 'en-US';
        speech.onend = function (e) {
          setTimeout(function () {
            _cacheSpeech.shift();
            if (_cacheSpeech.length > 0) {
              _availableSpeech.can = true;
            }
          }, 200);
        }
        speechSynthesis.speak(speech);
      }
    };

    var _f2c = function (f) {
      f  = f || 32;
      return ((f - 32) / 1.8);
    }

    var _mph2mps = function (mph) {
      return (mph * 0.44704);
    };

    return {
      init:         _init,
      clear:        _clear,
      stop:         _stop,
      start:        _start,
      log:          _logMessage,
      info:         _infoMessage,
      warn:         _warnMessage,
      error:        _errorMessage,
      addListener:  _addListener,
      getLocation:  _getLocationByNavigator,
      getLocationN: _getLocationByName,
      setTimezone:  _setTimezone,
      setWeather:   _setWeather,
      setCoord:     _setCoordinateToObject,
      setTime:      _setTime,
      setCity:      _setCity,
      speak:        _speakText,
    }
  }());

  RTAPP.init();
});
