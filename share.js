document.addEventListener('DOMContentLoaded', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const reg = urlParams.get('reg');
    const make = urlParams.get('make');
    const model = urlParams.get('model');
    const lat = parseFloat(urlParams.get('lat'));
    const lon = parseFloat(urlParams.get('lon'));
    const address = urlParams.get('address');
    const w3w = urlParams.get('w3w');

    if (reg && make && model) {
        displayCarDetails(reg, make, model);
        displayLocationDetails(lat, lon, address, w3w);
        initMap(lat, lon, reg); // Initialize Google Map with registration number
    } else {
        document.body.innerHTML = "<p>Invalid or missing parameters in the URL.</p>";
    }
});

function displayCarDetails(reg, make, model) {
    document.getElementById('regPlate').textContent = reg;
    const query = `${make} ${model}`;
    fetchCarImage(query);
}

function fetchCarImage(query) {
    const cx = '36cf5ff588ea9446d';
    const apiKey = 'AIzaSyB_OkuGhKAK75L5qhtQn21vorSaxa-bmR8';
    fetch(`https://www.googleapis.com/customsearch/v1?q=${query}&cx=${cx}&key=${apiKey}&searchType=image&num=1`)
        .then(response => response.json())
        .then(data => {
            const carImageUrl = data.items[0].link;
            document.getElementById('carImage').src = carImageUrl;
        })
        .catch(error => console.error('Error fetching car image:', error));
}

function displayLocationDetails(lat, lon, address, w3w) {
    document.getElementById('postalAddress').textContent = `Postal Address: ${decodeURIComponent(address)}`;
    const w3wLink = `https://what3words.com/${w3w}`;
    document.getElementById('w3wAddress').innerHTML = `What3Words Address: <a href="${w3wLink}" target="_blank">${w3w}</a>`;

    const streetView = new google.maps.StreetViewPanorama(
        document.getElementById('streetView'),
        {
            position: { lat: lat, lng: lon },
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            clickToGo: false,
            disableDefaultUI: true,
            linksControl: false,
            motionTracking: false
        }
    );

    let currentHeading = 165;

    function autoPan() {
        currentHeading += 0.3; // Adjust this value to change the pan speed
        if (currentHeading >= 360) {
            currentHeading = 0;
        }
        streetView.setPov({
            heading: currentHeading,
            pitch: 0
        });
        requestAnimationFrame(autoPan); // Continue the animation
    }

    // Start the auto-pan after the panorama is loaded
    streetView.addListener('pano_changed', () => {
        autoPan();
    });
}

function initMap(lat, lon, reg) {
    const location = { lat: lat, lng: lon };
    const map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 11,
					styles: [{"featureType":"all","elementType":"geometry","stylers":[{"hue":"#ff4400"},{"saturation":-68},{"lightness":-4},{"gamma":0.72}]},{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.country","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#0077ff"},{"gamma":3.1}]},{"featureType":"poi.park","elementType":"all","stylers":[{"hue":"#44ff00"},{"saturation":-23}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"saturation":-64},{"hue":"#ff9100"},{"lightness":16},{"gamma":0.47},{"weight":2.7}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"lightness":-48},{"hue":"#ff5e00"},{"gamma":1.2},{"saturation":-23}]},{"featureType":"water","elementType":"all","stylers":[{"hue":"#00ccff"},{"gamma":0.44},{"saturation":-33}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"hue":"#007fff"},{"gamma":0.77},{"saturation":65},{"lightness":99}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"gamma":0.11},{"weight":5.6},{"saturation":99},{"hue":"#0091ff"},{"lightness":-86}]}],
					maxZoom: 20,
					minZoom: 0,
                    clickableIcons: true,
    });

    

    // Car marker with custom icon and size constraint
    const carIcon = {
        url: 'fonts/id32.png',
        scaledSize: new google.maps.Size(150, 100), // Set the size to 30x30 pixels
    };
    const carMarker = new google.maps.Marker({
        position: location,
        map: map,
        icon: carIcon,
        title: 'Car Location'
    });

    // Add car information div
    const carInfoDiv = document.createElement('div');
    carInfoDiv.id = 'car-info';
    carInfoDiv.classList.add('hidden');
    carInfoDiv.innerHTML = `
        <div><strong>Registration Number:</strong> ${reg}</div>
        <div><strong>Details:</strong> Some other information</div>
    `;
    document.body.appendChild(carInfoDiv);

    // Show car information on marker click
    carMarker.addListener('click', function() {
        const infoDiv = document.getElementById('car-info');
        
        // Get the marker position in pixel coordinates
        const projection = map.getProjection();
        const point = projection.fromLatLngToPoint(carMarker.getPosition());
        
        // Convert point to pixel
        const scale = Math.pow(2, map.getZoom());
        const pixelPoint = new google.maps.Point(point.x * scale, point.y * scale);
        
        // Position the infoDiv near the marker
        infoDiv.style.left = `${pixelPoint.x}px`;
        infoDiv.style.top = `${pixelPoint.y}px`;
        
        // Toggle visibility
        if (infoDiv.classList.contains('hidden')) {
            infoDiv.classList.remove('hidden');
            infoDiv.classList.add('visible');
        } else {
            infoDiv.classList.remove('visible');
            infoDiv.classList.add('hidden');
        }
    });

    // User location marker with custom icon and size
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                const userIcon = {
                    url: 'fonts/look.gif',
                    scaledSize: new google.maps.Size(100, 70), // Set the size to 40x40 pixels
                };
                const userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: userIcon,
                    title: 'Your Location'
                });

                // Function to calculate distance between two points using the Haversine formula
                function calculateDistance(lat1, lon1, lat2, lon2) {
                    const R = 6371e3; // Radius of the Earth in meters
                    const φ1 = lat1 * Math.PI / 180;
                    const φ2 = lat2 * Math.PI / 180;
                    const Δφ = (lat2 - lat1) * Math.PI / 180;
                    const Δλ = (lon2 - lon1) * Math.PI / 180;

                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                              Math.cos(φ1) * Math.cos(φ2) *
                              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                    const distance = R * c; // Distance in meters
                    return distance;
                }

                // Display the distance between the car and the user
                function updateDistance() {
                    const distance = calculateDistance(lat, lon, userLocation.lat, userLocation.lng);
                    document.getElementById('distance').textContent = `Distance to your driver: ${distance.toFixed(2)} meters`;
                }

                // Optionally, adjust the map bounds to include both markers
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(location);
                bounds.extend(userLocation);
                map.fitBounds(bounds);

                // Update the distance initially
                updateDistance();

                // Watch the user's position for changes and update the distance
                navigator.geolocation.watchPosition(
                    (position) => {
                        userLocation.lat = position.coords.latitude;
                        userLocation.lng = position.coords.longitude;
                        userMarker.setPosition(userLocation);
                        updateDistance();
                    },
                    (error) => {
                        console.error('Error watching user location:', error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            },
            (error) => {
                console.error('Error fetching user location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser');
    }
}

// CSS for car-info div
const style = document.createElement('style');
style.innerHTML = `
    #car-info {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: none;
    }
    .hidden {
        display: none;
    }
    .visible {
        display: block;
    }
`;
document.head.appendChild(style);
