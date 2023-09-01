let map;
let pos = { lat: 0, lng: 0 };
let track = true;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: false,
        mapId: "f04e5dc5fb08862b",
    });

    let userHasMovedMap = false;
    let touchTimer = null;

    google.maps.event.addListener(map, 'drag', function() {
        userHasMovedMap = true;
        track = false;
    });

    google.maps.event.addListener(map, 'touchstart', function() {
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function() {
            userHasMovedMap = false;
            track = true;
        }, 5000);
    });

    const recenterButton = document.getElementById('recenter-button');

    recenterButton.addEventListener('click', function() {
        if (navigator.geolocation) {
            if (userHasMovedMap) {
                map.panTo(pos);
                map.setZoom(17, {animate: true});
                userHasMovedMap = false;
                track = true;
            }
        } else {
            handleLocationError(false, map.getCenter());
        }
    });

    let userMarker = new google.maps.Marker({
        map: map,
        icon: {
            url: 'smallcar.png',
            anchor: new google.maps.Point(25.5, 25.5)
        }
    });

    function updateUserPosition(position) {
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
                    userMarker.setPosition(nearestRoadLocation);
                    if (track) {
                        map.panTo(nearestRoadLocation);
                    }
                }
            });
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            updateUserPosition(position);
            map.panTo(pos);
            navigator.geolocation.watchPosition(updateUserPosition, function() {
                handleLocationError(true, map.getCenter());
            }, {
                enableHighAccuracy: true,
                maximumAge: 500,
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

let watchId;
let currentStep = 0;

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
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    directionsService.route({
                        origin: pos,
                        destination: results[0].geometry.location,
                        travelMode: 'DRIVING'
                    }, function(response, status) {
                        if (status === 'OK') {
                            directionsRenderer.setDirections(response);

                            // Get the current step
                            const route = response.routes[0];
                            const step = route.legs[0].steps[currentStep];

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
                                }
                            }
                        } else {
                            window.alert('Directions request failed due to ' + status);
                        }
                    });
                }, function() {
                    handleLocationError(true, map.getCenter());
                });
            } else {
                handleLocationError(false, map.getCenter());
            }
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
});