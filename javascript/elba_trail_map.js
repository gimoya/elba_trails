

/*** Add base maps with controls ***/
var map = L.map('map', {
  center: [42.808660, 10.375],
  zoom: 12,
  maxZoom: 17,
  minZoom: 11,
  zoomControl: false,
  attributionControl: false
});

new L.control.attribution({position: 'bottomright'}).addTo(map);
new L.Control.Zoom({ position: 'topright' }).addTo(map);

/* 
Control disabled due to http protocol at the moment.. only https allowed

L.control.locate({
	strings: {
		title: "Show me where I am, yo!"
	}

}).addTo(map);		
*/

var toggle = L.easyButton({
  position: 'topright',
  states: [{
	stateName: 'basemap-outdoor',
	icon: '<span class="custom-control">T</span>',
	title: 'change basemap back to satellite',		
	onClick: function(control) {
	  map.removeLayer(mapbox_outdoorLayer);
	  map.addLayer(mapbox_satelliteLayer);
	  control.state('basemap-satellite');
	}
  }, {
	stateName: 'basemap-satellite',
	icon: '<span class="custom-control">S</span>',
	title: 'change basemap to outdoor/terrain',
	onClick: function(control) {
	  map.removeLayer(mapbox_satelliteLayer);
	  map.addLayer(mapbox_outdoorLayer);
	  control.state('basemap-outdoor');
	},
  }]
});	

toggle.addTo(map);

var mapbox_Attr = 'Tiles &copy; <a href="https://www.mapbox.com">mapbox</a> | Design &copy; <a href="//tiroltrailhead.com/guiding">Tirol Trailhead</a>';  
var mapbox_satelliteUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2ltb3lhIiwiYSI6IkZrTld6NmcifQ.eY6Ymt2kVLvPQ6A2Dt9zAQ';
var mapbox_outdoorUrl = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2ltb3lhIiwiYSI6IkZrTld6NmcifQ.eY6Ymt2kVLvPQ6A2Dt9zAQ';

var mapbox_satelliteLayer = L.tileLayer(mapbox_satelliteUrl, {
  attribution: mapbox_Attr 
});

var mapbox_outdoorLayer = L.tileLayer(mapbox_outdoorUrl, {
  attribution: mapbox_Attr 
});		

mapbox_outdoorLayer.addTo(map);	


/*** Set up Elevation Control ***/

var el = L.control.elevation({
			position: "bottomright",
			theme: "lime-theme", //default: lime-theme
			width: 500,	
			height: 200,
			margins: {
				top: 20,
				right: 20,
				bottom: 30,
				left: 60
			},
			useHeightIndicator: true, //if false a marker is drawn at map position
			interpolation: "linear", //see https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_interpolate
			hoverNumber: {
				decimalsX: 2, //decimals on distance (always in km)
				decimalsY: 0, //deciamls on hehttps://www.npmjs.com/package/leaflet.coordinatesight (always in m)
				formatter: undefined //custom formatter function may be injected
			},
			xTicks: undefined, //number of ticks in x axis, calculated by default according to width
			yTicks: undefined, //number of ticks on y axis, calculated by default according to height
			collapsed: false,  //collapsed mode, show chart on click or mouseover
			imperial: false    //display imperial units instead of metric
	});
		
/*** Trail Style-Helper Functions ***/

function highlight (layer) {	// will be used on hover
	layer.setStyle({
		weight: 4,
		dashArray: '',
		opacity: 0.95
	});
	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}	
}

function getColor(description) { // ..used inside styleLines function. will color trails according to description details..
	var color;
	color = description.indexOf('K!') > -1 ? "#E53E38" : "#1F5AAA";
	// trails with ? classification (unknown, planned but not yet been there) should be pink
	if (description.indexOf('?') > -1) {color = "#FF69B4"}
	// trails with X! classification (been there, and it was shit) should be grey
	if (description.indexOf('X!') > -1) {color = "#BCBCBC"}	
	return color
}

function styleLines(feature) {	// deafult style used for constructor of json
    return {
		color: getColor(feature.properties.description),
		weight: 3,
		opacity: 0.8,
		lineJoin: 'round',  //miter | round | bevel 
    };
}


/*** Map and Json Layer Event Listeners and Helper Functions ***/
			
var lyr;
var ftr;
var trailsLayer;

var selected = null;

function dehighlight (layer) { 	// will be used inside select function
  if (selected === null || selected._leaflet_id !== layer._leaflet_id) {
	  trailsLayer.resetStyle(layer);
	  layer.setText(null);
  }
}

function select (layer) {  // ..use inside onClick Function doClickStuff() to select and style clicked feature 
  if (selected !== null) {
	var previous = selected;
  }
	map.fitBounds(layer.getBounds());
	selected = layer;
	if (previous) {
	  dehighlight(previous);
	}
}

function doClickStuff(e) {
	
	lyr = e.target;
	ftr = e.target.feature;
	
	select(lyr);
	lyr.setText('- - - ►             ', { repeat: true, offset: 11, attributes: {fill:  getColor(ftr.properties.description), 'font-weight': 'bold', 'font-size': '12'} });
	
	/*** Elevation Control ***/
		
	if (typeof el !== 'undefined') {
		// the variable is defined
		el.clear();
		map.removeControl(el);
	};	
	
	L.DomEvent.stopPropagation(e);
    el.addData(ftr, lyr);
    map.addControl(el);	
	
	/*** make all non-selected trails opaque, after resetting styles (ftr selected before)***/ 
	
	trailsLayer.eachLayer(function(layer){ if(selected._leaflet_id !== layer._leaflet_id) {
		dehighlight(layer);
		layer.setStyle({opacity: 0.4})
		}
	});
	
}

/*** Add Trails ***/

$.getJSON('wgs_trails_elba.geojson', function(json) {
	
	trails_json = L.geoJson(json, {
		
		style: 	styleLines,
		
		onEachFeature: function(feature, layer) {
			
			console.log(feature.geometry.coordinates[0]);
			var stPt = [ feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0] ]; // need to flip xy-coords!
			new L.circleMarker(stPt).addTo(map);
			
			// on events
			layer.on({		
				'mouseover': function (e) {
					highlight(e.target);
				},
				'mouseout': function (e) {
					dehighlight(e.target);
				},
				'click': doClickStuff
			});			
	
			/*** add a popup to each feature and.. ***/ 	
			/*** ..set GPX link ***/
			var bb = new Blob([togpx(feature)], {type: 'text/plain'});
			var gpxLink = document.createElement("a");
			gpxLink.href = window.URL.createObjectURL(bb);		
			gpxLink.download = feature.properties.name + ".gpx";
			gpxLink.innerHTML = "GPX";			
			var popupContent = '<h2 class="map-popup">' + feature.properties.name + '</h2>' + '<div>' + feature.properties.description + '</div>' + gpxLink.outerHTML;
			layer.bindPopup(popupContent, {closeOnClick: true, className: 'trailPopupClass'});
		}
	}).addTo(map);
	map.fitBounds(trails_json.getBounds(), {maxZoom: 14});
});

/*
trails_json.eachLayer(function(layer){

	var stPt = [ feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0] ]; // need to flip xy-coords!
	// var endPt = [ feature.geometry.coordinates[feature.geometry.coordinates.length - 1][0], feature.geometry.coordinates[feature.geometry.coordinates.length - 1][1] ];

	// Add Start and End Markers to each Feature 
	new L.circleMarker(stPt, {
			color: 'darkslategrey',
			fillColor: 'lightgreen',	
			fillOpacity: 1,				
			radius: 8
		})
		.bindTooltip(feature.properties.name + ' - Start', {
			permanent: false, 
			direction: 'right'
		})
		.addTo(map);
	
	new L.circleMarker([ endPt[1], endPt[0] ], {
			color: 'darkslategrey',
			fillColor: 'pink',
			fillOpacity: 1,
			radius: 8
		})	
		.bindTooltip(feature.properties.name + ' - End', {
			permanent: false, 
			direction: 'right'
		})
		.addTo(map)	
	
});
*/

/*** Map Event Listeners ***/

map.on("click", function(e){
	if (typeof el !== 'undefined') {
		// the variable is defined
		el.clear();
		map.removeControl(el);
	};	
	/*** reset opaque trails, reset direction arrows ***/
	trails_json.eachLayer(function(layer) {
		layer.setStyle({opacity: 0.75})
	});
	if (selected!== null) selected.setText(null);
	
});

