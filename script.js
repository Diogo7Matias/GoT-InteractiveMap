// map

var imageWidth = 3164;
var imageHeight = 2344;

var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2
});

var bounds = [[0, 0], [imageHeight, imageWidth]];
L.imageOverlay('images/westeros.jpg', bounds).addTo(map);
map.fitBounds(bounds);

// language & search

const input = document.getElementById("searchInput");
const langSelect = document.getElementById("language");
let lang = langSelect.value;
let fuse;

langSelect.addEventListener("change", async function () {
    lang = langSelect.value;
    const translations = await loadTranslations(lang);
    buildFuseIndex(translations);
});

async function loadTranslations(lang) {
    const response = await fetch(`translations/${lang}.json`);
    const data = await response.json();
    return data;
}

function buildSearchArray(translations) {
    return Object.entries(translations).map(([id, name]) => ({ id, name }));
}

function buildFuseIndex(translations) {
    const searchArray = buildSearchArray(translations);
    fuse = new Fuse(searchArray, {
        keys: ["name"],
        threshold: 0.3
    });
}

input.addEventListener("input", function () {
    const text = input.value;

    if (!text) return;
    
    const results = fuse.search(text);
    console.log(results);
});

function init() {
    loadTranslations(lang).then(translations => {
        buildFuseIndex(translations);
    });
}

init();

L.marker([1180, 2581]).addTo(map);
L.marker([1344, 759]).addTo(map);