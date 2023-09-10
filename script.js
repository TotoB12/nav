let map;
let pos = { lat: 0, lng: 0 };
let track = true;
let prevPos = null;
let prevPrevPos = null;
let lastUpdatedPos = null;
const svg_color = '#9E0000';
let svg = `<svg width="66" height="66" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden"><g transform="translate(-2719 -874)"><path d="M2752 876.383C2759.63 876.413 2765.83 882.172 2765.86 889.246L2765.88 895.115 2765.87 895.151 2765.66 896.499 2766.16 896.607C2767.29 896.977 2768.63 898.118 2768.18 899.48L2765.32 899.023 2765.09 901.059C2764.92 903.109 2764.83 905.231 2764.84 907.405 2764.86 911.754 2765.26 915.898 2765.97 919.668L2765.98 919.704 2766.02 930.609 2766.02 930.657 2766.02 930.657 2765.96 931.37C2765.26 935.12 2759.4 938.025 2752.25 937.997 2745.1 937.97 2739.21 935.018 2738.49 931.263L2738.42 930.55 2738.42 930.55 2738.42 930.502 2738.37 919.431 2738.38 919.395C2739.06 915.63 2739.43 911.489 2739.41 907.141 2739.41 904.967 2739.3 902.844 2739.11 900.793L2738.89 898.917 2736.01 899.355C2735.55 897.989 2736.88 896.858 2738.01 896.497L2738.53 896.388 2738.28 894.878 2738.27 894.842 2738.25 889.138C2738.22 882.064 2744.38 876.354 2752 876.383Z" fill="${svg_color}" fill-rule="evenodd"/><path d="M2760 917 2760 917 2760 928.291 2760 928.291 2760 929.57C2760 930.912 2756.42 932 2752 932 2747.58 932 2744 930.912 2744 929.57L2744 927.139 2744 927.139 2744 917 2744.16 917.07C2744.91 917.227 2748.13 917.346 2752 917.346 2756.42 917.346 2760 917.191 2760 917Z" fill-rule="evenodd"/><path d="M2740.47 896C2742.25 901.111 2742.04 910 2741.93 917 2739.36 913.488 2739.91 900.869 2740.47 896Z" fill-rule="evenodd"/><path d="M0.466318 0C2.24608 5.11058 2.03964 14 1.9325 21-0.641752 17.4881-0.0877225 4.86834 0.466318 0Z" fill-rule="evenodd" transform="matrix(-1 0 0 1 2765 896)"/><path d="M2752.5 889C2758.46 889 2763.37 890.801 2763.95 893.109L2764 893.464 2763.94 893.577 2763.23 893.577 2763.23 893.577 2763.94 893.577 2763.65 894.135C2763.17 895.192 2762.79 896.371 2762.51 897.634L2762.08 900 2761.4 899.615C2759.47 898.74 2756.21 898.164 2752.5 898.164 2748.79 898.164 2745.53 898.74 2743.6 899.615L2742.92 900 2742.49 897.634C2742.21 896.371 2741.83 895.192 2741.35 894.135L2741.06 893.585 2741.77 893.585 2741.77 893.577 2741.06 893.577 2741 893.464 2741.04 893.109C2741.63 890.801 2746.54 889 2752.5 889Z" fill-rule="evenodd"/><path d="M2744 934 2744.01 934.004C2745.75 934.555 2748.7 934.916 2752.05 934.916 2754.73 934.916 2757.15 934.685 2758.91 934.31L2760 934.028 2760 935.048 2758.91 935.394C2757.15 935.768 2754.73 936 2752.05 936 2749.37 936 2746.95 935.768 2745.19 935.394L2744 935.016Z" fill-rule="evenodd"/></g></svg>`;

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

        if (prevPos) {
            // let bearing = calculateBearing(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
            // userMarker.setIcon({
            //     path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            //     // scaledSize: new google.maps.Size(4, 4),
            //     scale: 5,
            //     strokeColor: "#cc0000",
            //     // strokeWeight: 2,
            //     rotation: bearing,
            //     // anchor: new google.maps.Point(2, 2),
            // });
          
            let distance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPos), new google.maps.LatLng(pos)) + google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(prevPrevPos), new google.maps.LatLng(prevPos));

            console.log(`Distance: ${distance}`)
            distance = distance * 0.000621371;
    
            let speed = distance * 1800;
            console.log(`Speed: ${speed}`)
    
            document.getElementById('speedometer').textContent = speed.toFixed(1) + ' mph';
              
    
        }

        if (!lastUpdatedPos || google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(lastUpdatedPos), new google.maps.LatLng(pos)) > 10) {
            let bearing = calculateBearing(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
            userMarker.setIcon({
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                // scaledSize: new google.maps.Size(4, 4),
                scale: 5,
                strokeColor: "#cc0000",
                // strokeWeight: 2,
                rotation: bearing,
                // anchor: new google.maps.Point(2, 2),
            });

            // Update the last updated position
            lastUpdatedPos = pos;
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

if (window.navigator.standalone && window.matchMedia("(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)").matches) {
    document.addEventListener("DOMContentLoaded", function () {
        const navbar = document.querySelector("#address-form");
        navbar.style.paddingBottom = "25px";
    });
}
