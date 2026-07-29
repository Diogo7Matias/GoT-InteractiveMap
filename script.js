const PRIMARY_COLOR = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color')
    .trim();
const SECONDARY_COLOR = getComputedStyle(document.documentElement)
    .getPropertyValue('--secondary-color')
    .trim();
const HIGHLIGHT_COLOR = getComputedStyle(document.documentElement)
    .getPropertyValue('--highlight-color')
    .trim();

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

input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(input.value), 0); // ajust value
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
        {...loc,
            // the loaded y-coordinates are top to bottom
            y: imageHeight - loc.y
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
    if (!text) {
        returnToBaseState();
        return;
    }
    
    const results = fuse.search(text);
    if (results.length === 0) {
        returnToBaseState();
        return;
    }

    searchResults.innerHTML = "";
    searchResults.style.visibility = "visible";
    results.forEach(r => {
        const li = document.createElement("li");
        if (r.item.id === results[0].item.id) {
            li.style.backgroundColor = SECONDARY_COLOR;
        }
        li.textContent = r.item.name;
        searchResults.appendChild(li);
    });

    const locID = results[0].item.id;
    const location = locations.get(locID);

    if (locID != previousLocationID) {
        placeHighlightMarker(location.y, location.x, location.marker);
        previousLocationID = locID;
    }
    map.flyTo([location.y, location.x], 0.5, {duration: 0.8});
}

function returnToBaseState() {
    searchResults.innerHTML = "";
    searchResults.style.visibility = "hidden";
    removeHighlightMarker();
    previousLocationID = null;
    map.flyTo([imageHeight / 2, imageWidth / 2], -2, {duration: 0.4});
}

// Location Highlight

let highlightMarker = null;

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

function placeHighlightMarker(y, x, markerType) {
    removeHighlightMarker();
    if (markerType == "diamond") {
        highlightMarker = createDiamondMarker(y, x, 36).addTo(map);
    } else if (markerType == "circle") {
        highlightMarker = createCircleMarker(y, x, 32).addTo(map);
    } else if (markerType == "circle_small") {
        highlightMarker = createCircleMarker(y, x, 16).addTo(map);
    }
}

function removeHighlightMarker() {
    if (highlightMarker) {
        map.removeLayer(highlightMarker);
    }
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