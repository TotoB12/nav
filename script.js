let map;
let pos = { lat: 0, lng: 0 };
let prevPos = null;
let prevPrevPos = null;
let lastUpdatedPos = null;
let lastUserMoveTime = null;
let nearestRoadLocation = { lat: 0, lng: 0 };
let lastNearestRoadLocation = { lat: 0, lng: 0 };
let watchId;
let currentStep = 0;
let route = null;
let close = true;
let etaIntervalId;
let routeETA;
let arrivalTime;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: false,
        mapId: "f04e5dc5fb08862b",
    });

    let userHasMovedMap = false;
    let track = true;

    google.maps.event.addListener(map, 'drag', function() {
        userHasMovedMap = true;
        track = false;
        lastUserMoveTime = Date.now();
    });

    function recenter() {
        if (navigator.geolocation) {
                map.panTo(pos);
                map.setZoom(17, {animate: true});
                userHasMovedMap = false;
                track = true;
        } else {
            handleLocationError(false, map.getCenter());
        }
    }

    const recenterButton = document.getElementById('recenter-button');

    recenterButton.addEventListener('click', function() {
        recenter();
    });

    let userMarker = new google.maps.Marker({
        map: map,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            // scaledSize: new google.maps.Size(4, 4),
            scale: 5,
            strokeColor: "#cc0000",
            // stokeFill: "#FF0000",
            // strokeWeight: 2,
            // anchor: new google.maps.Point(2, 2),
        }
    });

    function calculateBearing(startLat, startLng, endLat, endLng){
          startLat = toRadians(startLat);
          startLng = toRadians(startLng);
          endLat = toRadians(endLat);
          endLng = toRadians(endLng);
      
          let dLng = endLng - startLng;
      
          let dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
      
          if (Math.abs(dLng) > Math.PI){
              if (dLng > 0.0) dLng = -(2.0 * Math.PI - dLng);
              else dLng = (2.0 * Math.PI + dLng);
          }
      
          return (toDegrees(Math.atan2(dLng, dPhi)) + 360.0) % 360.0;
      }
      
      function toRadians(degrees){
          return degrees * Math.PI / 180.0;
      }
      
      function toDegrees(radians){
          return radians * 180.0 / Math.PI;
      }

    function updateUserPosition(position) {
        prevPrevPos = prevPos;
        prevPos = pos;
        pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
    
        // fetch('https://roads.googleapis.com/v1/nearestRoads?points=' + pos.lat + ',' + pos.lng + '&key=AIzaSyDOXyN5QuyRDuPhPGmAIWsFyTdBhTu0ufM')
        //     .then(response => response.json())
        //     .then(data => {
        //         if (data.snappedPoints) {
        //             lastNearestRoadLocation = nearestRoadLocation;
        //             nearestRoadLocation = {
        //                 lat: data.snappedPoints[0].location.latitude,
        //                 lng: data.snappedPoints[0].location.longitude
        //             };
        //             userMarker.setPosition(nearestRoadLocation);
        //             if (track) {
        //                 map.panTo(nearestRoadLocation);
        //             }
        //         }
        //     });
        userMarker.setPosition(pos);
        if (track) {
            map.panTo(pos);
        }

        if (prevPos) {
          
            let distance = (google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPos), new google.maps.LatLng(pos)) + google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPrevPos), new google.maps.LatLng(prevPos))) * 0.000621371;
            // console.log(`Distance: ${distance}`)
    
            let speed = distance * 1800;
            // console.log(`Speed: ${speed}`)
    
            document.getElementById('speedometer').textContent = speed.toFixed(0) + ' mph';
              
    
        }

        if (!lastUpdatedPos || google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(lastUpdatedPos), new google.maps.LatLng(pos)) > 10) {
            // let bearing = google.maps.geometry.spherical.computeHeading(prevPos, pos);
            let bearing = calculateBearing(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
            // let bearing = calculateBearing(lastNearestRoadLocation.lat, lastNearestRoadLocation.lng, nearestRoadLocation.lat, nearestRoadLocation.lng);
            console.log(bearing);
            userMarker.setIcon({
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                // url: "smallcar.png",
                // scaledSize: new google.maps.Size(4, 4),
                scale: 5,
                strokeColor: "#cc0000",
                // strokeWeight: 2,
                rotation: bearing,
                // anchor: new google.maps.Point(2, 2),
            });

            lastUpdatedPos = pos;
        }

        if (route && userHasMovedMap && Date.now() - lastUserMoveTime > 5000) {
            recenter();
        }
    
        if (route && pos) {
            const distanceToNextStep = google.maps.geometry.spherical.computeDistanceBetween(pos, route.legs[0].steps[currentStep].start_location)
            document.getElementById('directionsPanel').innerHTML = route.legs[0].steps[currentStep].instructions + " " + distanceToNextStep.toFixed(0) + "m";
            // document.getElementById('eta').innerHTML = route.legs[0].duration.text;
            // console.log(route.legs[0].steps[currentStep].instructions);
            // console.log(route.legs[0].steps[currentStep].duration.text)
            // console.log(route.legs[0].duration.text)
      
            if (distanceToNextStep < 12) {
                close = true;
            }

            // if (distanceToNextStep < 100) {
            //   speak((route.legs[0].steps[currentStep].instructions).replace(/<\/?[^>]+(>|$)/g, ""));
            // }

            if (distanceToNextStep > 17 && close) {
                currentStep++;
                close = false;

                speak((route.legs[0].steps[currentStep].instructions).replace(/<\/?[^>]+(>|$)/g, ""));
      
                if (currentStep < route.legs[0].steps.length) {
                    document.getElementById('directionsPanel').innerHTML = route.legs[0].steps[currentStep].instructions;
                } else {
                    endRoute();
                }
            }
        } else {
          // document.getElementById('time').innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' });
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            updateUserPosition(position);
            map.panTo(pos);
            navigator.geolocation.watchPosition(updateUserPosition, function() {
                handleLocationError(true, map.getCenter());
            }, {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            });
        }, function() {
            handleLocationError(true, map.getCenter());
        });
    } else {
        handleLocationError(false, map.getCenter());
    }
}

function speak(text) {
    // var msg = new SpeechSynthesisUtterance();
    // var voices = window.speechSynthesis.getVoices();
    // msg.voice = voices[10]; // Note: some voices don't support altering params
    // msg.voiceURI = 'native';
    // msg.volume = 1; // 0 to 1
    // msg.rate = 1; // 0.1 to 10
    // msg.pitch = 2; //0 to 2
    // msg.text = text;
    // msg.lang = 'en-US';
    // window.speechSynthesis.speak(msg);
    console.log("At least I tried.");
    var msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
}

function makeMarker(position, icon, title) {
    new google.maps.Marker({
        position: position,
        map: map,
        icon: icon,
        title: title
    });
}

function endRoute() {
    document.getElementById('time').style.transform = "none"; 
    document.getElementById('time').style.right = "10px";
    document.getElementById('time').style.left = "auto";
    document.getElementById('directionsPanel').innerHTML = 'You have arrived at your destination.';  
    clearInterval(etaIntervalId);
    document.getElementById('eta').innerHTML = '';
    route = null;
    close = true;
    currentStep = 0;
    
    document.getElementById('directionsPanel').style.display = 'none';
    document.getElementById('eta').style.display = 'none';
}

document.getElementById('time').innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' });

setInterval(function() {document.getElementById('time').innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' });}, 60000);

function handleLocationError(browserHasGeolocation) {
    alert(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}

const buttons = document.querySelectorAll('button');

buttons.forEach(function(button) {
    button.addEventListener('touchstart', function() {
        this.style.backgroundColor = '#e0e0e0';
    });

    button.addEventListener('touchend', function() {
        this.style.backgroundColor = '#f5f5f5';
    });
});

window.addEventListener('load', setMapHeight);
window.addEventListener('resize', setMapHeight);

function setMapHeight() {
    const formHeight = document.getElementById('address-form').offsetHeight;
    document.getElementById('map').style.height = (window.innerHeight - formHeight) + 'px';
}

document.getElementById('address-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const address = document.getElementById('address-input').value;

    const geocoder = new google.maps.Geocoder();
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

    directionsRenderer.setOptions({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#007fff'
        }
    });

    directionsRenderer.setMap(map);

    geocoder.geocode({'address': address}, function(results, status) {
        if (status === 'OK') {
            if (navigator.geolocation) {
                directionsService.route({
                    origin: pos,
                    destination: results[0].geometry.location,
                    travelMode: 'DRIVING'
                }, function(response, status) {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(response);
                    
                        route = response.routes[0];
                        console.log(response)
                        // makeMarker(leg.start_location, "https://maps.google.com/mapfiles/kml/paddle/grn-circle.png", "Start");
                        makeMarker(route.legs[0].end_location, "https://img.icons8.com/color/48/map-pin.png");
                      
                        document.getElementById('address-input').value = route.legs[0].end_address;
                        document.getElementById('directionsPanel').innerHTML = route.legs[0].steps[currentStep].instructions + " " + google.maps.geometry.spherical.computeDistanceBetween(pos, route.legs[0].steps[currentStep].start_location).toFixed(0) + "m";
                        arrivalTime = route.legs[0].duration.value;
                        document.getElementById('time').style.transform = "translateX(-50%)"; 
                        document.getElementById('time').style.right = "auto";
                        document.getElementById('time').style.left = "50%";
                        document.getElementById('eta').innerHTML = route.legs[0].duration.text;
                        userHasMovedMap = false;
                        track = true;

                                                
                        setTimeout(function() {
                          setTimeout(function() {
                              map.setZoom(17, {animate: true});
                          }, 1500);
                          map.panTo(pos);
                        }, 1500);

                        document.getElementById('directionsPanel').style.display = 'block';
                        console.log((route.legs[0].steps[currentStep].instructions).replace(/<\/?[^>]+(>|$)/g, ""));
                        // speak((route.legs[0].steps[currentStep].instructions).replace(/<\/?[^>]+(>|$)/g, ""));
                        // var msg = new SpeechSynthesisUtterance("At least I tried.");
                        // window.speechSynthesis.speak(msg);
                        document.getElementById('eta').style.display = 'block';

                        function updateETA() {
                            if (route && pos) {
                                    directionsService.route({
                                        origin: pos,
                                        destination: results[0].geometry.location,
                                        travelMode: 'DRIVING'
                                    }, function(response, status) {
                                        if (status === 'OK') {
                                            routeETA = response.routes[0];
                                            console.log(routeETA.legs[0].duration.text);
                                            document.getElementById('eta').innerHTML = routeETA.legs[0].duration.text;
                                        }
                                    });
                            }
                        }

                        etaIntervalId = setInterval(updateETA, 60000);
  
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            } else {
                handleLocationError(false, map.getCenter());
            }
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
});

if (window.navigator.standalone && window.matchMedia("(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)").matches) {
    document.addEventListener("DOMContentLoaded", function () {
        const navbar = document.querySelector("#address-form");
        navbar.style.paddingBottom = "25px";
    });
}
