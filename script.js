// map setup

var imageWidth = 3164;
var imageHeight = 2344;

var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2
});

var bounds = [[0, 0], [imageHeight, imageWidth]];
L.imageOverlay('images/westeros.jpg', bounds).addTo(map);
map.fitBounds(bounds);

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
let lang = langSelect.value;
let fuse;
let locations;

init();

input.addEventListener("input", () => search(input.value));

langSelect.addEventListener("change", async function () {
    lang = langSelect.value;
    const translations = await loadTranslations(lang);
    buildFuseIndex(translations);
});

function buildSearchArray(translations) {
    return Object.entries(translations).map(([id, name]) => ({ id, name }));
}

function buildLocationsMap(locationsArray) {
    return new Map(locationsArray.map(loc => [loc.id, loc]));
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
        map.flyTo([imageHeight / 2, imageWidth / 2], -2, {duration: 0.4});
        return;
    }
    
    const results = fuse.search(text);
    const locID = results[0].item.id;
    const location = locations.get(locID);

    map.flyTo([location.y, location.x], 0.5, {duration: 0.8});
}

function init() {
    loadTranslations(lang).then(translations => {
        buildFuseIndex(translations);
    });

    loadLocations().then(locs => {
        locations = buildLocationsMap(locs);
    });
}