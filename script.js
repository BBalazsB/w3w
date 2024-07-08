document.addEventListener('DOMContentLoaded', (event) => {
    const carInfo = getCookie('carInfo');
    if (carInfo) {
        const { reg, make, model } = JSON.parse(carInfo);
        document.getElementById('reg').value = reg;
        document.getElementById('make').value = make;
        document.getElementById('model').value = model;
        document.getElementById('carForm').style.display = 'none';
        displayCarDetails(reg, make, model);
    }
});

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
}

function saveCarInfo() {
    const reg = document.getElementById('reg').value;
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const carInfo = { reg, make, model };
    setCookie('carInfo', JSON.stringify(carInfo), 14); // Set the cookie with a 14-day expiration
    document.getElementById('carForm').style.display = 'none';
    displayCarDetails(reg, make, model);
}

function resetCarInfo() {
    setCookie('carInfo', '', -1); // This deletes the cookie by setting it to expire in the past
    document.getElementById('carForm').style.display = 'block';
    document.getElementById('carDetails').style.display = 'none';
    document.getElementById('locationDetails').style.display = 'none';
}

function displayCarDetails(reg, make, model) {
    document.getElementById('carDetails').style.display = 'block';
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

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const apiKey = '231ce1111efa459da5b8e35a150f81e3';
    const w3wApiKey = '903IJ78C';
    const tinyUrlApiKey = 'Q7h47MvdRmmYmV2M2wIFFznDnYNzIQegeeSfOq1Bb2TVOlt0xmCKqsrFFxWO';

    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            const address = data.results[0].formatted;
            document.getElementById('postalAddress').textContent = `Postal Address: ${address}`;

            fetch(`https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lon}&key=${w3wApiKey}`)
                .then(response => response.json())
                .then(data => {
                    const w3w = data.words;
                    const w3wLink = `https://what3words.com/${w3w}`;
                    document.getElementById('w3wAddress').innerHTML = `What3Words Address: <a href="${w3wLink}" target="_blank">${w3w}</a> <button class="copy-button" onclick="copyToClipboard('${w3wLink}')">Copy</button>`;

                    const carInfo = JSON.parse(getCookie('carInfo'));
                    const shareUrl = `https://staging.d23v9zy8ztnmjq.amplifyapp.com/share.html?lat=${lat}&lon=${lon}&address=${encodeURIComponent(address)}&w3w=${w3w}&reg=${carInfo.reg}&make=${carInfo.make}&model=${carInfo.model}`;

                    fetch('https://api.tinyurl.com/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tinyUrlApiKey}`
                        },
                        body: JSON.stringify({
                            url: shareUrl,                            
                            domain: 'i-am-here.live',
                            alias: carInfo.reg,
                            expires_at: new Date(Date.now() + 5 * 60000).toISOString() // Expire in 5 minutes
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            const shortUrl = data.data.tiny_url;
                            document.getElementById('shareLink').innerHTML = `Shareable Link: <a href="${shortUrl}" target="_blank">${shortUrl}</a> <button class="copy-button" onclick="copyToClipboard('${shortUrl}')">Copy</button>`;
                        })
                        .catch(error => {
                            console.error('Error shortening URL:', error);
                            document.getElementById('shareLink').innerHTML = `Shareable Link: <a href="${shareUrl}" target="_blank">${shareUrl}</a>`;
                        });
                })
                .catch(error => console.error('Error fetching what3words address:', error));
        })
        .catch(error => console.error('Error fetching postal address:', error));

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
        currentHeading += 0.1; // Adjust this value to change the pan speed
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

    document.getElementById('locationDetails').style.display = 'block';
}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
