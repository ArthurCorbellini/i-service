/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJ0Y29yYiIsImEiOiJjbGFpd3JpcDQwNm4wM3FzdXF1anh5NXVhIn0.sjf09-lJ0QVIfzWLOmYH1A";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/artcorb/claiyza2e000g15p7m2ewejd3",
    // scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  // Create marker
  const el = document.createElement("div");
  el.className = "marker";

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: "bottom",
  })
    .setLngLat(locations.coordinates)
    .addTo(map);

  // Add popup
  // new mapboxgl.Popup({
  //   offset: 30,
  // })
  //   .setLngLat(locations.coordinates)
  //   .setHTML(`<p>${locations.description}</p>`)
  //   .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(locations.coordinates);

  map.fitBounds(bounds, {
    zoom: 10,
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
