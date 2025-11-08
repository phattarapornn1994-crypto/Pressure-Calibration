const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const stops = [];
const routeLayer = L.layerGroup().addTo(map);
const stopList = document.getElementById('stop-list');

document.getElementById('route-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const stopInput = document.getElementById('stop-input');
    const stopName = stopInput.value.trim();
    if (stopName) {
        geocode(stopName);
        stopInput.value = '';
    }
});

function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const latlng = [parseFloat(lat), parseFloat(lon)];
                addStop(display_name, latlng);
            } else {
                alert('Could not find the location.');
            }
        });
}

function addStop(name, latlng) {
    const stop = { name, latlng };
    stops.push(stop);

    const listItem = document.createElement('li');
    listItem.textContent = name;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-stop');
    removeButton.addEventListener('click', () => {
        removeStop(stop, listItem);
    });

    listItem.appendChild(removeButton);
    stopList.appendChild(listItem);

    const marker = L.marker(latlng).addTo(map);
    stop.marker = marker;
}

function removeStop(stop, listItem) {
    const index = stops.indexOf(stop);
    if (index > -1) {
        stops.splice(index, 1);
    }
    stopList.removeChild(listItem);
    map.removeLayer(stop.marker);
}

document.getElementById('plan-route').addEventListener('click', () => {
    if (stops.length < 2) {
        alert('Please add at least two stops.');
        return;
    }

    const coordinates = stops.map(stop => stop.latlng.slice().reverse());
    const url = `http://router.project-osrm.org/route/v1/driving/${coordinates.join(';')}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0].geometry;
                routeLayer.clearLayers();
                L.geoJSON(route).addTo(routeLayer);
            } else {
                alert('Could not plan the route.');
            }
        });
});
