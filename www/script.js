// map setup

var imageWidth = 3164;
var imageHeight = 2344;

var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2
});

// load JSON data

async function loadJSON(filename) {
    const response = await fetch(filename);
    const data = await response.json();
    return data;
}

async function loadTranslations(lang) {
    return await loadJSON(`translations/${lang}.json`);
}

async function loadLocations() {
    return await loadJSON('locations.json');
}

// language & search

const input = document.getElementById("searchInput");
const langSelect = document.getElementById("language");
const searchResults = document.getElementById("searchResults");
let fuse;
let locations;
let debounceTimer;
let previousLocationID = null;
let selectedResultIndex = 0;
let results;

document.addEventListener("click", function (event) {
    const clickedInsideSearch = input.contains(event.target) || searchResults.contains(event.target);
    if (!clickedInsideSearch) {
        searchResults.style.visibility = "hidden";
    }
});

function updateSelectedHighlight() {
    const items = searchResults.children;
    for (let i = 0; i < items.length; ++i) {
        items[i].classList.toggle("selected", i === selectedResultIndex);
    }
}

input.addEventListener("keydown", function (event) {
    if (event.code == "Escape") {
        input.value = "";
        search("");
    } else if (event.code == "ArrowDown") {
        event.preventDefault();
        if (results.length === 0) return;
        if (++selectedResultIndex >= results.length) selectedResultIndex = 0;
        updateSelectedHighlight();
        displayLocation();
    } else if (event.code == "ArrowUp") {
        event.preventDefault();
        if (results.length === 0) return;
        if (--selectedResultIndex < 0) selectedResultIndex = results.length - 1;
        updateSelectedHighlight();
        displayLocation();
    }
});

input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(input.value), 0); // adjust value
});

input.addEventListener("click", function () {
    if (results.length != 0) {
        searchResults.style.visibility = "visible";
    }
})

searchResults.addEventListener("mousedown", function (event) {
    event.preventDefault();
});

langSelect.addEventListener("change", async function () {
    const translations = await loadTranslations(langSelect.value);
    buildFuseIndex(translations);
});

function buildSearchArray(translations) {
    return Object.entries(translations).map(([id, name]) => ({ id, name }));
}

function buildLocationsMap(locationsArray) {
    return new Map(locationsArray.map(loc => [
        loc.id, 
        {
            ...loc,
            // the loaded y-coordinates are top to bottom
            y: imageHeight - loc.y,
            ...(loc.y2 !== undefined && { y2: imageHeight - loc.y2 })
        }
    ]));
}

function buildFuseIndex(translations) {
    const searchArray = buildSearchArray(translations);
    fuse = new Fuse(searchArray, {
        keys: ["name"],
        threshold: 0.3
    });
}

function search(text) {
    selectedResultIndex = 0;

    if (!text) {
        returnToBaseState();
        return;
    }
    
    results = fuse.search(text);
    if (results.length === 0) {
        returnToBaseState();
        return;
    }

    searchResults.innerHTML = "";
    searchResults.style.visibility = "visible";
    results.forEach(r => {
        const li = document.createElement("li");
        if (r.item.id === results[0].item.id) {
            li.classList.toggle("selected", true);
        }
        li.textContent = r.item.name;

        li.addEventListener("click", function () {
            selectedResultIndex = results.findIndex(res => res.item.id === r.item.id);
            updateSelectedHighlight();
            displayLocation();
        });

        searchResults.appendChild(li);
    });

    displayLocation();
}

function displayLocation() {
    const locID = results[selectedResultIndex].item.id;
    const location = locations.get(locID);

    if (locID != previousLocationID) {
        removeHighlightMarkers();

        // special case - double marker
        if (locID == "the_twins") {
            placeHighlightMarker(location.y2, location.x2, location.type);
        }

        placeHighlightMarker(location.y, location.x, location.type);
        previousLocationID = locID;
    }
    map.flyTo([location.y, location.x], 0.5, { duration: 0.8 });
}

function returnToBaseState() {
    searchResults.innerHTML = "";
    searchResults.style.visibility = "hidden";
    removeHighlightMarkers();
    previousLocationID = null;
    map.flyTo([imageHeight / 2, imageWidth / 2], -2, {duration: 0.4});
}

// Location Highlight

let highlightMarkers = [];

function createDiamondMarker(y, x, size) {
    const half = size / 2;
    return L.polygon([
        [y - half, x],          // top
        [y, x + half / 1.5],    // right
        [y + half, x],          // bottom
        [y, x - half / 1.5]     // left
    ], {
        weight: 0,
        fillColor: "#815c39",
        fillOpacity: 1
    });
}

function createCircleMarker(y, x, size) {
    return L.circle([y, x], {
        radius: size / 2,
        weight: 0,
        fillColor: "#815c39",
        fillOpacity: 1
    });
}

function placeHighlightMarker(y, x, type) {
    if (type == "castle") {
        highlightMarkers.push(createDiamondMarker(y, x, 36).addTo(map));
    } else if (type == "city") {
        highlightMarkers.push(createCircleMarker(y, x, 30).addTo(map));
    } else if (type == "town") {
        highlightMarkers.push(createCircleMarker(y, x, 16).addTo(map));
    }
}

function removeHighlightMarkers() {
    highlightMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
}

// =========== Init

function init() {
    var bounds = [[0, 0], [imageHeight, imageWidth]];
    L.imageOverlay('images/westeros.jpg', bounds).addTo(map);
    map.fitBounds(bounds);

    loadTranslations(langSelect.value).then(translations => {
        buildFuseIndex(translations);
    });

    loadLocations().then(locs => {
        locations = buildLocationsMap(locs);
    });
}

init();