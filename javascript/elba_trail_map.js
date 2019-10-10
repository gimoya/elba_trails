/* PW protection */	
function trim(str) {
	return str.replace(/^\s+|\s+$/g, '');  
}

var pw_prompt = prompt('Bitte Passwort eingeben (Anfrage per E-Mail an: kay@tiroltrailhead.com), um auf die **ELBA TRAIL MAP** zu gelangen..',' ');
var pw = 'gimmegimme';
// if prompt is cancelled the pw_prompt var will be null!
if (pw_prompt == null) {
	alert('Kein Passwort wurde angegeben, **ELBA TRAIL MAP** wird nicht geladen...');
	if (bowser.msie) {
		document.execCommand('Stop');
	} else {
		window.stop();
	}
	window.location='http://tiroltrailhead.com/guiding';
}
if (trim(pw_prompt) == pw ) {
	alert('Passwort richtig!');
} else {
	alert('Falsches Passwort, **ELBA TRAIL MAP** wird nicht geladen..');
	if (bowser.msie) {
		document.execCommand('Stop');
	} else {
		window.stop();
	}
	window.location='http://tiroltrailhead.com/guiding';
}

/*** Add base maps with controls ***/
var map = L.map('map', {
  center: [42.808660, 10.375],
  zoom: 12,
  maxZoom: 17,
  minZoom: 9,
  zoomControl: false,
  attributionControl: false
});

new L.control.attribution({position: 'bottomright'}).addTo(map);
new L.Control.Zoom({ position: 'topright' }).addTo(map);

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

var mapbox_Attr = 'Tiles &copy; <a href="https://www.mapbox.com">mapbox</a> | Design &copy; <a href="http://www.tiroltrailhead.com/guiding">Tirol Trailhead</a>';  
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
			width: 320,	
			height: 160,
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
var trails_json;

var selected = null;

function dehighlight (layer) { 	// will be used inside select function
  if (selected === null || selected._leaflet_id !== layer._leaflet_id) {
	  trails_json.resetStyle(layer);
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
	
	trails_json.eachLayer(function(layer){ if(selected._leaflet_id !== layer._leaflet_id) {
		dehighlight(layer);
		layer.setStyle({opacity: 0.4})
		}
	});
	
}

/*** Add Trails ***/

/* Start/End pts in different pane ontop pf trails */ 
map.createPane('ptsPane');
map.getPane('ptsPane').style.zIndex = 600;

$.getJSON('trails_elba.geojson', function(json) {
	
	trails_json = L.geoJson(json, {
		
		style: 	styleLines,
		
		onEachFeature: function(feature, layer) {
			
			var stPt = [ feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0],  ]; // need to flip xy-coords!
			var endPt = [ feature.geometry.coordinates[feature.geometry.coordinates.length - 1][1], feature.geometry.coordinates[feature.geometry.coordinates.length - 1][0] ];
			
			// Add Start and End Markers to each Feature 
			new L.circleMarker(stPt, {
					color: 'darkslategrey',
					fillColor: 'lightgreen',	
					fillOpacity: 1,				
					radius: 5,
					pane: 'ptsPane'
				})
				.bindTooltip(feature.properties.name + ' - Start (' + feature.geometry.coordinates[0][2] + ' m)', {
					permanent: false, 
					direction: 'right'
				})
				.addTo(map);
			
			new L.circleMarker(endPt, {
					color: 'darkslategrey',
					fillColor: 'pink',
					fillOpacity: 1,
					radius: 5,
					pane: 'ptsPane'
				})	
				.bindTooltip(feature.properties.name + ' - End (' + feature.geometry.coordinates[feature.geometry.coordinates.length - 1][2] + ' m)', {
					permanent: false, 
					direction: 'right'
				})
				.addTo(map)	
			
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
Points of interest
*/

/* used icons for markers:
L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
  
var POIS_Icon = L.AwesomeMarkers.icon({
		icon: 'fa-truck',
		markerColor: 'cadetblue',
		iconColor: 'yellow'
	  })
*/
	  
var POIs = {
	"type": "FeatureCollection",
	"name": "points",
	"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3857" } },
	"features": [
	{ "type": "Feature", "properties": { "name": "Calendozio Minen", "description": "<a href=\"google.com\/maps\/search\/Calendozio Minen\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1161417.95483361161314, 5288646.322180738672614 ] } },
	{ "type": "Feature", "properties": { "name": "Bar & Crepes 'I Sassirossi'", "description": "<a href=\"google.com\/maps\/search\/Bar & Crepes 'I Sassirossi'\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1160136.901747878175229, 5290572.92692178953439 ] } },
	{ "type": "Feature", "properties": { "name": "Bar & Ristorante 'La Piazza'", "description": "<a href=\"google.com\/maps\/search\/Bar & Ristorante 'La Piazza'\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1157895.584731705719605, 5283668.071825037710369 ] } },
	{ "type": "Feature", "properties": { "name": "Aloe B & B Ranch Elba", "description": "<a href=\"google.com\/maps\/search\/Aloe B & B Ranch Elba\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1158689.222040652995929, 5283286.197810660116374 ] } },
	{ "type": "Feature", "properties": { "name": "PP 'Le Panche'", "description": "<a href=\"google.com\/maps\/search\/PP 'Le Panche'\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1156969.035653347847983, 5282890.444572151638567 ] } },
	{ "type": "Feature", "properties": { "name": "Ristorante Mare - Magazzini", "description": "<a href=\"google.com\/maps\/search\/Ristorante Mare - Magazzini\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1153081.093616098165512, 5281555.022736757062376 ] } },
	{ "type": "Feature", "properties": { "name": "Bar Ristorante Le Palme - Bagnaia", "description": "<a href=\"google.com\/maps\/search\/Bar Ristorante Le Palme - Bagnaia\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1153684.94358855066821, 5283194.139711218886077 ] } },
	{ "type": "Feature", "properties": { "name": "Bar & Stabilimento Mandel", "description": "<a href=\"google.com\/maps\/search\/Bar & Stabilimento Mandel\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1154656.289171668002382, 5271329.205282471142709 ] } },
	{ "type": "Feature", "properties": { "name": "Minimarkt Lacona & Bankomat", "description": "<a href=\"google.com\/maps\/search\/Minimarkt Lacona & Bankomat\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1148099.609597255475819, 5276299.096900106407702 ] } },
	{ "type": "Feature", "properties": { "name": "'Tratoria Orti di Mare'", "description": "<a href=\"google.com\/maps\/search\/'Tratoria Orti di Mare'\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1147629.125164234777912, 5276244.886802461929619 ] } },
	{ "type": "Feature", "properties": { "name": "Ristorante Cacio & Vino", "description": "<a href=\"google.com\/maps\/search\/Ristorante Cacio & Vino\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1136750.308837652672082, 5274239.10219088755548 ] } },
	{ "type": "Feature", "properties": { "name": "Bar Spiaggia Cavolli", "description": null }, "geometry": { "type": "Point", "coordinates": [ 1133944.78495599492453, 5272084.203654404729605 ] } },
	{ "type": "Feature", "properties": { "name": "Minimarkt Seccheto", "description": "<a href=\"google.com\/maps\/search\/Minimarkt Seccheto\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1132881.282110746251419, 5272130.546890933066607 ] } },
	{ "type": "Feature", "properties": { "name": "Panificcio Seccheto", "description": "<a href=\"google.com\/maps\/search\/Panificcio Seccheto\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1132944.730535158887506, 5272116.44724106322974 ] } },
	{ "type": "Feature", "properties": { "name": "Baba Pizza Pomonte", "description": "<a href=\"google.com\/maps\/search\/Baba Pizza Pomonte\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1126648.992721959250048, 5273786.988016488030553 ] } },
	{ "type": "Feature", "properties": { "name": "Mini Market Pomonte", "description": "<a href=\"google.com\/maps\/search\/Mini Market Pomonte\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1126755.840933259576559, 5273751.784518867731094 ] } },
	{ "type": "Feature", "properties": { "name": "Hotel & Bar Il Perseo Chiessi", "description": "<a href=\"google.com\/maps\/search\/Hotel & Bar Il Perseo Chiessi\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1125821.231468439335003, 5275361.60012162104249 ] } },
	{ "type": "Feature", "properties": { "name": "Hotel & Bar Bel Mare Patresi \/ Bike Guide Matteo Anselmi", "description": "<a href=\"google.com\/maps\/search\/Hotel & Bar Bel Mare Patresi \/ Bike Guide Matteo Anselmi\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1126310.593472460051998, 5280256.275251095183194 ] } },
	{ "type": "Feature", "properties": { "name": "Osteria Del Noce", "description": "<a href=\"google.com\/maps\/search\/Osteria Del Noce\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1131808.194145827088505, 5280110.140657518059015 ] } },
	{ "type": "Feature", "properties": { "name": "Pizzeria & Bar Bagni Paola Procchio", "description": "<a href=\"google.com\/maps\/search\/Pizzeria & Bar Bagni Paola Procchio\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1140746.968430680688471, 5279976.214608100242913 ] } },
	{ "type": "Feature", "properties": { "name": "Osteria Locanda Cecconi Porto Azzurro", "description": "<a href=\"google.com\/maps\/search\/Osteria Locanda Cecconi Porto Azzurro\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1157527.188141128281131, 5276414.723462347872555 ] } },
	{ "type": "Feature", "properties": { "name": "Pizzeria Da Giuseppe", "description": "<a href=\"google.com\/maps\/search\/Pizzeria Da Giuseppe\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1157213.122509032953531, 5276304.747618111781776 ] } },
	{ "type": "Feature", "properties": { "name": "Bar Alta Luna Porto Azzurro", "description": "<a href=\"google.com\/maps\/search\/Bar Alta Luna Porto Azzurro\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1157545.627600588835776, 5276382.140474840067327 ] } },
	{ "type": "Feature", "properties": { "name": "Il Veliero Bar Marina di Campo", "description": "<a href=\"google.com\/maps\/search\/Il Veliero Bar Marina di Campo\">Goolge Maps Search<\/a>" }, "geometry": { "type": "Point", "coordinates": [ 1139482.411330306436867, 5272911.784571797586977 ] } }
	]
}

var POIs_Icon = L.icon({
	iconUrl: 'elba_trails/images/marker.svg',
	iconSize: [30, 46], // size of the icon
	});

for (i = 0; i < POIs.features.length; i++) { 
	new L.marker(POIs.features[1].geometry.coordinates, {icon: POIs_Icon})
		.bindTooltip(POIs.features[1].properties.name, 
			{
				permanent: false, 
				direction: 'right'
			}
		)
		.addTo(map);
}

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

