(function () {
	var simpleMapIdCounter = 0;
  var simpleMapsConfig = mw.config.get('wgSimpleMaps');
	var localSettings = {};

	function toCamelCase(whitespacedString) {
		// Attribution: https://stackoverflow.com/a/50168915/159522
		return whitespacedString
			.toLowerCase()
			.replace(/\s+(\w)?/gi, function(match, letter) {
				return letter.toUpperCase();
			});
	}

	function isTable(obj) {
		return obj.tagName === 'TABLE';
	}

	function generateObjectFromAttributeArray(attributes, defaultValue) {
		var obj = {}
		attributes.forEach(function (attribute) {
			obj[attribute] = defaultValue;
		})
		return obj;
	}

	function formatFieldName(fieldName) {
		return toCamelCase(fieldName.trim())
	}

	function getFirstChildTable(domEl) {
		for (var i = 0; i < domEl.childNodes.length; i++) {
			var child = domEl.childNodes[i];
			if (isTable(child)) {
				return child;
			}
		}
		return null;
	}

	function loadFieldMapFromColumns(table, fieldNames) {
		var fieldMap = generateObjectFromAttributeArray(fieldNames, -1);
		if (!isTable(table)) {
			return fieldMap;
		}

		// Iterate through the columns to find the field indexes, if present
		if (table.rows.length > 0) {
			const headerRow = table.rows[0];
			for (var i = 0; i < headerRow.cells.length; i++) {
				var cell = headerRow.cells[i];
				var fieldName = formatFieldName(cell.textContent);
				if (fieldNames.includes(fieldName)) {
					fieldMap[fieldName] = i;
				}
			}
		}
		return fieldMap;
	}

	function loadFieldMapFromRows(table, fieldNames) {
		var fieldMap = generateObjectFromAttributeArray(fieldNames, -1);
		if (!isTable(table)) {
			return fieldMap;
		}

		// Iterate through the rows to find the field indexes, if present
		for (var i = 0; i < table.rows.length; i++) {
			row = table.rows[i];
			if (row.cells.length > 0) {
				var cell = row.cells[0];
				var fieldName = formatFieldName(cell.textContent);
				if (fieldNames.includes(fieldName)) {
					fieldMap[fieldName] = i;
				}
			}
		}
		return fieldMap;
	}

	function loadMapFieldMap(mapTable) {
		return loadFieldMapFromColumns(mapTable, [
			'lat',
			'lng',
			'popupContent',
			'icon',
		]);
	}

	function loadIconFieldMap(iconsTable) {
		return loadFieldMapFromColumns(iconsTable, [
			'id',
			'iconUrl',
			'iconHeight',
			'iconWidth',
			'iconAnchorX',
			'iconAnchorY',
			'shadowUrl',
			'shadowHeight',
			'shadowWidth',
			'shadowAnchorX',
			'shadowAnchorY',
			'popupAnchorX',
			'popupAnchorY',
		]);
	}

	function loadSettingsFieldMap(settingsTable) {
		return loadFieldMapFromRows(settingsTable, [
			'icons',
		]);
	}

	function fieldExists(fieldIndex, items) {
		return fieldIndex !== -1 && items.length > fieldIndex;
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

	function getSettingFromRows(fieldIndex, rows) {
		if (fieldExists(fieldIndex, rows)) {
			var row = rows[fieldIndex];
			if (row.cells.length > 1) {
				return row.cells[1];
			}
		}
		return null;
	}

	function getMarkersFromMapTable(mapTable) {
		var fieldMap = loadMapFieldMap(mapTable);
		var markers = [];

		// We skip the header row
		for (var i = 1; i < mapTable.rows.length; i++) {
			var row = mapTable.rows[i];
			var marker = {
				lat: null,
				lng: null,
				popupContent: '',
			}
			if (fieldExists(fieldMap.lat, row.cells)) {
				marker.lat = Number.parseFloat(row.cells[fieldMap.lat].textContent);
			}
			if (fieldExists(fieldMap.lng, row.cells)) {
				marker.lng = Number.parseFloat(row.cells[fieldMap.lng].textContent);
			}
			if (fieldExists(fieldMap.popupContent, row.cells)) {
				marker.popupContent = row.cells[fieldMap.popupContent].innerHTML;
			}
			if (fieldExists(fieldMap.popupContent, row.cells)) {
				marker.icon = row.cells[fieldMap.icon].textContent.trim();
			}
			markers.push(marker);
		}
		return markers;
	}

	function loadIconsFromIconsTable(iconsTable) {
		var icons = {};
		if (isTable(iconsTable)) {
			var fieldMap = loadIconFieldMap(iconsTable);
			for (var i = 1; i < iconsTable.rows.length; i++) {
				var row = iconsTable.rows[i]
				if(fieldExists(fieldMap.id, row.cells)) {
					var iconId = row.cells[fieldMap.id].textContent.trim();
					var iconSettings = {};
					if (fieldExists(fieldMap.iconUrl, row.cells)) {
						iconSettings.iconUrl = row.cells[fieldMap.iconUrl].textContent.trim();
					}
					if (fieldExists(fieldMap.iconHeight, row.cells)
						&& fieldExists(fieldMap.iconWidth, row.cells)) {
						var iconHeight = Number.parseInt(row.cells[fieldMap.iconHeight].textContent);
						var iconWidth = Number.parseInt(row.cells[fieldMap.iconWidth].textContent);
						iconSettings.iconSize = [iconHeight, iconWidth];
					}
					if (fieldExists(fieldMap.iconAnchorX, row.cells)
						&& fieldExists(fieldMap.iconAnchorY, row.cells)) {
						var iconAnchorX = Number.parseInt(row.cells[fieldMap.iconAnchorX].textContent);
						var iconAnchorY = Number.parseInt(row.cells[fieldMap.iconAnchorY].textContent);
						iconSettings.iconAnchor = [iconAnchorX, iconAnchorY];
					}
					if (fieldExists(fieldMap.shadowUrl, row.cells)) {
						iconSettings.shadowUrl = row.cells[fieldMap.shadowUrl].textContent.trim();
					}
					if (fieldExists(fieldMap.shadowHeight, row.cells)
						&& fieldExists(fieldMap.shadowWidth, row.cells)) {
						var shadowHeight = Number.parseInt(row.cells[fieldMap.shadowHeight].textContent);
						var shadowWidth = Number.parseInt(row.cells[fieldMap.shadowWidth].textContent);
						iconSettings.shadowSize = [shadowHeight, shadowWidth];
					}
					if (fieldExists(fieldMap.shadowAnchorX, row.cells)
						&& fieldExists(fieldMap.shadowAnchorY, row.cells)) {
						var shadowAnchorX = Number.parseInt(row.cells[fieldMap.shadowAnchorX].textContent);
						var shadowAnchorY = Number.parseInt(row.cells[fieldMap.shadowAnchorY].textContent);
						iconSettings.shadowAnchor = [shadowAnchorX, shadowAnchorY];
					}
					if (fieldExists(fieldMap.popupAnchorX, row.cells)
						&& fieldExists(fieldMap.popupAnchorY, row.cells)) {
						var popupAnchorX = Number.parseInt(row.cells[fieldMap.popupAnchorX].textContent);
						var popupAnchorY = Number.parseInt(row.cells[fieldMap.popupAnchorY].textContent);
						iconSettings.popupAnchor = [popupAnchorX, popupAnchorY];
					}
					icons[iconId] = L.icon(iconSettings);
				}
			}
		}
		return icons;
	}

	function loadSettingsFromSettingsTable(settingsTable) {
		var fieldMap = loadSettingsFieldMap(settingsTable);
		var rows = settingsTable.rows;
		var settings = {
			icons: loadIconsFromIconsTable(getFirstChildTable(getSettingFromRows(fieldMap.icons, rows))),
		};
		return settings;
	}

	function getLeafletIconImagePath() {
		return '/' + mw.config.get('wgSiteName') + '/extensions/SimpleMaps/resources/ext.leaflet/images/';
	}

	function getSettingsTables() {
		return document.querySelectorAll('table.' + simpleMapsConfig.settingsClass);
	}

	function getMapTables() {
		return document.querySelectorAll('table.' + simpleMapsConfig.renderingClass);
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

	function loadSettings() {
		var settingsTables = getSettingsTables();
		settingsTables.forEach(function (settingsTable, i) {
			var settings = loadSettingsFromSettingsTable(settingsTable);
			if (!localSettings.default) {
				localSettings.default = settings;
			}
			localSettings[i] = settings;
		})
	}

	function getLocalSetting(setting) {
		if (localSettings.default && localSettings.default[setting]) {
			return localSettings.default[setting];
		}
		return null;
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
			var icons = getLocalSetting('icons');
			var markers = getMarkersFromMapTable(mapTable);
			var latLngs = getLatLngsFromMarkers(markers);
			var bounds = new L.LatLngBounds(latLngs);
			markers.forEach(function(marker) {
				if(!isNaN(marker.lat) && !isNaN(marker.lng)) {
					var markerSettings = {};

					if (marker.icon && icons && icons.hasOwnProperty(marker.icon)) {
						markerSettings.icon = icons[marker.icon];
					}
					var leafletMarker = L.marker(
						[marker.lat, marker.lng],
						markerSettings,
					).addTo(simpleMap);

					if (marker.popupContent) {
						leafletMarker.bindPopup(marker.popupContent);
					}
				}
			});
			simpleMap.fitBounds(bounds);
		})
	}
	loadSettings();
	renderMaps();
})()
