var imageWidth = 3164;
var imageHeight = 2344;

var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2
});

var bounds = [[0, 0], [imageHeight, imageWidth]];
L.imageOverlay('images/westeros.jpg', bounds).addTo(map);
map.fitBounds(bounds);

L.marker([1180, 2581]).addTo(map);
L.marker([1344, 759]).addTo(map);