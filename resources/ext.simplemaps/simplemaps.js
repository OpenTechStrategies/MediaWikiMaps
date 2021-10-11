(function () {
	var simpleMapIdCounter = 0;
  var simpleMapsConfig = mw.config.get('wgSimpleMaps');

	function loadFieldMap(mapTable) {
		var fieldMap = {
			lat: -1,
			lng: -1,
			popupContent: -1,
		};

		if (mapTable.rows.length > 0) {
			const headerRow = mapTable.rows[0];
			for (var i = 0; i < headerRow.cells.length; i++) {
				var cell = headerRow.cells[i];
				var columnLabel = cell.textContent
					.trim()
					.toLowerCase();
				switch (columnLabel) {
					case "lat":
						fieldMap.lat = i;
						break;
					case "lng":
						fieldMap.lng = i;
						break;
					case "popup content":
						fieldMap.popupContent = i;
						break;
				}
			}
		}

		return fieldMap;
	}

	function addMapNodeBeforeTable(mapTable) {
		simpleMapIdCounter += 1;
		var mapId = 'simpleMap' + (simpleMapIdCounter);
		var mapDiv = document.createElement("div");
		mapDiv.id = mapId;
		mapDiv.className = simpleMapsConfig.renderingClass;
		mapTable.parentNode.insertBefore(mapDiv, mapTable);
		return mapDiv;
	}

	function getMarkersFromMapTable(mapTable) {
		var fieldMap = loadFieldMap(mapTable);
		var markers = [];

		console.log(fieldMap);

		// We skip the header row
		for (var i = 1; i < mapTable.rows.length; i++) {
			var row = mapTable.rows[i];
			var marker = {
				lat: null,
				lng: null,
				popupContent: '',
			}
			if(fieldMap.lat !== -1 && row.cells.length > fieldMap.lat) {
				marker.lat = Number.parseFloat(row.cells[fieldMap.lat].textContent);
			}
			if(fieldMap.lng !== -1 && row.cells.length > fieldMap.lng) {
				marker.lng = Number.parseFloat(row.cells[fieldMap.lng].textContent);
			}
			if(fieldMap.popupContent !== -1) {
				if(row.cells.length > fieldMap.popupContent) {
					marker.popupContent = row.cells[fieldMap.popupContent].innerHTML;
				}
			}
			markers.push(marker);
		}
		return markers;
	}

	function getLeafletIconImagePath() {
		return '/' + mw.config.get('wgSiteName') + '/extensions/SimpleMaps/resources/ext.leaflet/images/';
	}

	function getMapTables() {
		return document.querySelectorAll("table.simpleMap");
	}

	function getLatLngsFromMarkers(markers) {
		let latLngs = markers.map(function (marker) {
			if(!isNaN(marker.lat) && !isNaN(marker.lng)) {
				return [marker.lat, marker.lng];
			};
			return null;
		}).filter(function (latLng) {
			return latLng !== null;
		});
		return latLngs;
	}

	function renderMaps() {
		var mapTables = getMapTables();
		mapTables.forEach(function (mapTable) {
			var mapDiv = addMapNodeBeforeTable(mapTable);
			var simpleMap = L.map(mapDiv.id).setView([0,0], 0);
			L.tileLayer(simpleMapsConfig.tileLayerUrl, {
				attribution: simpleMapsConfig.tileLayerAttribution,
			}).addTo(simpleMap);

			L.Icon.Default.imagePath = getLeafletIconImagePath()
			var markers = getMarkersFromMapTable(mapTable);
			var latLngs = getLatLngsFromMarkers(markers);
			var bounds = new L.LatLngBounds(latLngs);
			markers.forEach(function(marker) {
				if(!isNaN(marker.lat) && !isNaN(marker.lng)) {
					var leafletMarker = L.marker([marker.lat, marker.lng]).addTo(simpleMap);
					if (marker.popupContent) {
						leafletMarker.bindPopup(marker.popupContent);
					}
				}
			});
			simpleMap.fitBounds(bounds);
		})
	}
	renderMaps();
})()
