let map;
let pos = { lat: 0, lng: 0 };
let prevPos = null;
let prevPrevPos = null;
let lastUpdatedPos = null;
let lastUserMoveTime = null;
let watchId;
let currentStep = 0;
let route = null;
let distanceToNextStep = 0;
let placeId;

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

    // setInterval(function() {}, 1000);

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

    function updateUserPosition(position) {
        prevPrevPos = prevPos;
        prevPos = pos;
        pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
    
        fetch('https://roads.googleapis.com/v1/nearestRoads?points=' + pos.lat + ',' + pos.lng + '&key=AIzaSyDOXyN5QuyRDuPhPGmAIWsFyTdBhTu0ufM')
            .then(response => response.json())
            .then(data => {
                if (data.snappedPoints) {
                    var nearestRoadLocation = {
                        lat: data.snappedPoints[0].location.latitude,
                        lng: data.snappedPoints[0].location.longitude
                    };
                    placeId = data.snappedPoints[0].placeId;
                    userMarker.setPosition(nearestRoadLocation);
                    if (track) {
                        map.panTo(nearestRoadLocation);
                    }
                }
            });

        if (prevPos) {
          
            let distance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPos), new google.maps.LatLng(pos)) + google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPrevPos), new google.maps.LatLng(prevPos));

            // console.log(`Distance: ${distance}`)
            distance = distance * 0.000621371;
    
            let speed = distance * 1800;
            // console.log(`Speed: ${speed}`)
    
            document.getElementById('speedometer').textContent = speed.toFixed(0) + ' mph';
              
    
        }

        if (!lastUpdatedPos || google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(lastUpdatedPos), new google.maps.LatLng(pos)) > 10) {
            let bearing = google.maps.geometry.spherical.computeHeading(prevPos, pos);
            console.log(bearing)
            userMarker.setIcon({
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
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
            distanceToNextStep = google.maps.geometry.spherical.computeDistanceBetween(pos, route.legs[0].steps[currentStep].end_location)
            document.getElementById('directionsPanel').innerHTML = route.legs[0].steps[currentStep].instructions + distanceToNextStep.toFixed(0) + "m";
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

function handleLocationError(browserHasGeolocation, pos) {
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

                        document.getElementById('directionsPanel').style.display = 'block';
  
                        // Get the current step
                        route = response.routes[0];
                        const step = route.legs[0].steps[currentStep];
                        console.log(route.legs[0].steps[currentStep].instructions);
  
                        // Calculate the distance between the user's location and the end point of the current step
                        const distance = google.maps.geometry.spherical.computeDistanceBetween(
                            new google.maps.LatLng(pos),
                            step.end_location
                        );
  
                        // If the user is close enough to the end point of the current step, move to the next step
                        if (distance < 50) {
                            currentStep++;
  
                            if (currentStep < route.legs[0].steps.length) {
                                document.getElementById('directionsPanel').innerHTML = route.legs[0].steps[currentStep].instructions;
                            } else {
                                document.getElementById('directionsPanel').innerHTML = 'You have arrived at your destination.';
                                route = null;

                                document.getElementById('directionsPanel').style.display = 'none';
                            }
                        }
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
