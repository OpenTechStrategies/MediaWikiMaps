(function () {
	var simpleMapIdCounter = 0;
  var simpleMapsConfig = mw.config.get('wgSimpleMaps');

	function toCamelCase(whitespacedString) {
		// Attribution: https://stackoverflow.com/a/50168915/159522
		return whitespacedString
			.toLowerCase()
			.replace(/\s+(\w)?/gi, function(match, letter) {
				return letter.toUpperCase();
			});
	}

	function isTable(obj) {
		return obj !== null && obj.tagName === 'TABLE';
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
			'layer',
			'feature',
			'fillColor',
			'borderColor',
			'overlayContent',
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

	function loadLayerFieldMap(layersTable) {
		return loadFieldMapFromColumns(layersTable, [
			'id',
			'label',
			'legendKey',
		]);
	}

	function loadLegendFieldMap(legendTable) {
		return loadFieldMapFromColumns(legendTable, [
			'key',
			'value',
		]);
	}

	function loadSettingsFieldMap(settingsTable) {
		return loadFieldMapFromRows(settingsTable, [
			'icons',
			'layers',
			'layerControlTitle',
			'layerControlPosition',
			'layerControlCollapsed',
			'legend',
			'legendTitle',
			'legendDescription',
			'legendPosition',
			'featureCollectionJson',
			'overlayDefault',
			'overlayTitle',
			'scrollWheelZoom',
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
		return document.createElement('td');
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
				feature: null,
				borderColor: '',
				fillColor: '',
				overlayContent: '',
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
			if (fieldExists(fieldMap.icon, row.cells)) {
				marker.icon = row.cells[fieldMap.icon].textContent.trim();
			}
			if (fieldExists(fieldMap.layer, row.cells)) {
				marker.layer = row.cells[fieldMap.layer].textContent.trim();
			}
			if (fieldExists(fieldMap.feature, row.cells)) {
				marker.feature = row.cells[fieldMap.feature].textContent.trim();
			}
			if (fieldExists(fieldMap.borderColor, row.cells)) {
				marker.borderColor = row.cells[fieldMap.borderColor].textContent.trim();
			}
			if (fieldExists(fieldMap.fillColor, row.cells)) {
				marker.fillColor = row.cells[fieldMap.fillColor].textContent.trim();
			}
			if (fieldExists(fieldMap.overlayContent, row.cells)) {
				marker.overlayContent = row.cells[fieldMap.overlayContent].textContent.trim();
			}
			markers.push(marker);
		}
		return markers;
	}

	function generateLegendColorKey(color) {
		return '<i style="background: ' + color + '"></i>';
	}

	function generateLegendImageKey(imageUrl) {
		return '<div class="imageContainer"><img src="' + imageUrl + '" /></div>';
	}

	function generateLegendKey(keyString) {
		if (keyString.charAt(0) === '#') {
			return generateLegendColorKey(keyString);
		} else {
			return generateLegendImageKey(keyString);
		}
	}

	function loadLayersFromLayersTable(layersTable) {
		var layers = {};
		if (isTable(layersTable)) {
			var fieldMap = loadLayerFieldMap(layersTable);
			for (var i = 1; i < layersTable.rows.length; i++) {
				var row = layersTable.rows[i]
				if(fieldExists(fieldMap.id, row.cells)) {
					var layerId = row.cells[fieldMap.id].textContent.trim();
					var layerSettings = {
						label: '',
						legendKey: '',
					};
					if (fieldExists(fieldMap.label, row.cells)) {
						layerSettings.label = row.cells[fieldMap.label].innerHTML;
					}
					if (fieldExists(fieldMap.legendKey, row.cells)) {
						layerSettings.legendKey = generateLegendKey(row.cells[fieldMap.legendKey].textContent.trim());
					}
					layers[layerId] = layerSettings;
				}
			}
		}
		return layers;
	}

	function loadLegendRowsFromLegendTable(legendTable) {
		var legendRows = [];
		if (isTable(legendTable)) {
			var fieldMap = loadLegendFieldMap(legendTable);
			for (var i = 1; i < legendTable.rows.length; i++) {
				var row = legendTable.rows[i]
				var legendRow = {
					'key': '',
					'value': '',
				}
				if(fieldExists(fieldMap.key, row.cells)) {
					legendRow.key = generateLegendKey(row.cells[fieldMap.key].textContent.trim());
				}
				if(fieldExists(fieldMap.value, row.cells)) {
					legendRow.value = row.cells[fieldMap.value].innerHTML;
				}
				legendRows.push(legendRow);
			}
		}
		return legendRows;
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

	function loadFeatureCollectionFeaturesFromString(str) {
		var featureCollection = JSON.parse(str);
		var features = {};
		featureCollection.features.forEach((feature) => {
			features[feature.id] = feature;
		})
		return features;
	}

	function getDefaultSettings() {
		return {
			icons: {},
			layers: {},
			layerControlTitle: '',
			layerControlPosition: 'topright',
			layerControlCollapsed: true,
			features: {},
			legendRows: [],
			legendTitle: '',
			legendDescription: '',
			legendPosition: 'bottomright',
			overlayDefault: null,
			overlayTitle: '',
			scrollWheelZoom: true,
		};
	}

	function loadSettingsFromSettingsTable(settingsTable) {
		var fieldMap = loadSettingsFieldMap(settingsTable);
		var rows = settingsTable.rows;
		var settings = getDefaultSettings();

		if (fieldExists(fieldMap.icons, rows)) {
			settings.icons = loadIconsFromIconsTable(getFirstChildTable(getSettingFromRows(fieldMap.icons, rows)));
		}
		if (fieldExists(fieldMap.layers, rows)) {
			settings.layers = loadLayersFromLayersTable(getFirstChildTable(getSettingFromRows(fieldMap.layers, rows)));
		}
		if (fieldExists(fieldMap.layerControlTitle, rows)) {
			settings.layerControlTitle = getSettingFromRows(fieldMap.layerControlTitle, rows).textContent.trim();
		}
		if (fieldExists(fieldMap.layerControlPosition, rows)) {
			settings.layerControlPosition = getSettingFromRows(fieldMap.layerControlPosition, rows).textContent.trim();
		}
		if (fieldExists(fieldMap.layerControlCollapsed, rows)) {
			settings.layerControlCollapsed = getSettingFromRows(fieldMap.layerControlCollapsed, rows).textContent.trim() === 'true';
		}
		if (fieldExists(fieldMap.legend, rows)) {
			settings.legendRows = loadLegendRowsFromLegendTable(getFirstChildTable(getSettingFromRows(fieldMap.legend, rows)));
		}
		if (fieldExists(fieldMap.legendTitle, rows)) {
			settings.legendTitle = getSettingFromRows(fieldMap.legendTitle, rows).textContent.trim();
		}
		if (fieldExists(fieldMap.legendDescription, rows)) {
			settings.legendDescription = getSettingFromRows(fieldMap.legendDescription, rows).innerHTML;
		}
		if (fieldExists(fieldMap.legendPosition, rows)) {
			settings.legendPosition = getSettingFromRows(fieldMap.legendPosition, rows).textContent.trim();
		}
		if (fieldExists(fieldMap.featureCollectionJson, rows)) {
			settings.features = loadFeatureCollectionFeaturesFromString(getSettingFromRows(fieldMap.featureCollectionJson, rows).textContent);
		}
		if (fieldExists(fieldMap.overlayDefault, rows)) {
			settings.overlayDefault = getSettingFromRows(fieldMap.overlayDefault, rows).innerHTML;
		}
		if (fieldExists(fieldMap.overlayTitle, rows)) {
			settings.overlayTitle = getSettingFromRows(fieldMap.overlayTitle, rows).textContent.trim();
		}
		if (fieldExists(fieldMap.scrollWheelZoom, rows)) {
			settings.scrollWheelZoom = getSettingFromRows(fieldMap.scrollWheelZoom, rows).textContent.trim() === 'true';
		}
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

	function hasLatLng(marker) {
		return !isNaN(marker.lat)
			&& !isNaN(marker.lng)
			&& marker.lat !== null
			&& marker.lng !== null
			&& marker.lat !== ''
			&& marker.lng !== '';
	}

	function hasFeature(marker, features) {
		return marker.feature && featureExists(marker.feature, features);
	}

	function hasLayer(marker, layers) {
		return layers && marker.layer && layerExists(marker.layer, layers);
	}

	function hasOverlayContent(marker) {
		return marker.overlayContent !== null
			&& marker.overlayContent !== '';
	}

	function getBoundsFromMarkers(markers, features) {
		var coordinateSets = markers.flatMap(function (marker) {
			var latLngs = []
			if (hasLatLng(marker)) {
				latLngs.push([marker.lat, marker.lng]);
			};
			if (hasFeature(marker, features)) {
				latLngs.push(L.geoJson(features[marker.feature]).getBounds());
			}
			return latLngs;
		});
		return new L.LatLngBounds(coordinateSets);
	}

	function loadLocalSettingSets() {
		var settingsTables = getSettingsTables();
		var localSettingSets = {};
		settingsTables.forEach(function (settingsTable, i) {
			var settings = loadSettingsFromSettingsTable(settingsTable);
			if (settingsTable.id) {
				localSettingSets[settingsTable.id] = settings;
			} else if (!localSettingSets.default) {
				localSettingSets.default = settings;
			}
			localSettingSets[i] = settings;
		})
		if(!localSettingSets.default) {
			localSettingSets.default = getDefaultSettings();
		}
		return localSettingSets;
	}

	function getLocalSettingSet(localSettingSets, key = 'default') {
		if (localSettingSets[key]) {
			return localSettingSets[key];
		}
		return getDefaultSettings();
	}
	function getSetting(setting, settings) {
		if (settings
			&& settings[setting] !== null
			&& settings[setting] !== undefined
		) {
			return settings[setting];
		}
		return null;
	}

	function attributeExists(attribute, obj) {
		return obj && attribute in obj;
	}

	function featureExists(featureId, features) {
		return attributeExists(featureId, features);
	}

	function layerExists(layerId, layers) {
		return attributeExists(layerId, layers);
	}

	function onFeatureMouseOver(e) {
		var layer = e.target;
		var marker = layer.feature.properties.simpleMapMarker;
		if (hasOverlayContent(marker)) {
			var overlayPane = layer.feature.properties.simpleMapOverlayPane;
			overlayPane.update(marker.overlayContent);
		}
	}

	function onFeatureMouseOut(e) {
		var layer = e.target;
		var overlayPane = layer.feature.properties.simpleMapOverlayPane;
		overlayPane.update();
	}

	function generateOverlayControl(defaultContent, title) {
		var overlay = L.control();
		overlay._div = L.DomUtil.create('div', 'simpleMapOverlay');
		overlay.onAdd = function (map) {
			this.update();
			return this._div;
		};
		overlay.update = function (overlayContent) {
			var titleHtml = title ? '<h1>' + title + '</h1>' : '';
			var contentHtml = (overlayContent ? overlayContent : defaultContent)
			this._div.innerHTML = titleHtml + contentHtml;
		};
		return overlay;
	}

	function generateGeoJsonFeature(decoratedFeature) {
		var marker = decoratedFeature.properties.simpleMapMarker;
		var style = {
			fillOpacity: 0.7,
			fillColor: '#fff',
			color: '#aaa',
			weight: 2,
		};
		if (marker.fillColor !== '') {
			style.fillColor = marker.fillColor;
		}
		if (marker.borderColor !== '') {
			style.color = marker.borderColor
		}
		var featureGeoJson = L.geoJson(
			decoratedFeature,
			{
				style: style,
				onEachFeature: function (feaure, layer) {
					layer.on({
						mouseover: onFeatureMouseOver,
						mouseout: onFeatureMouseOut,
					});
				}
			},
		);
		return featureGeoJson;
	}

	function generateLayerGroups(layers) {
		var layerGroups = {
			default: L.layerGroup(),
		};
		if (layers !== null) {
			Object.entries(layers).forEach(function([layerId, layer]) {
				layerGroups[layerId] = L.layerGroup();
			});
		}
		return layerGroups;
	}

	function generateLayerGroupControl(layerGroups, layers, options) {
		var overlayItems = {};
		Object.entries(layerGroups).forEach(function([layerId, layerGroup]) {
			if (layerExists(layerId, layers)) {
				var legendKey = layers[layerId].legendKey
				var layerLabel = layers[layerId].label;
				if (legendKey) {
					layerLabel = "<div style='display:inline-block'>" + layers[layerId].legendKey + "&nbsp;-&nbsp;</div>" + layerLabel;
				}
				overlayItems[layerLabel] = layerGroup;
			}
		})
		return L.control.layers({}, overlayItems, options);
	}

	function generateLegend(rows, title, description, position) {
		var legend = L.control({ position: position });
		legend.onAdd = function() {
			var div = L.DomUtil.create('div', 'info simpleMapLegend')
			if (title) {
				div.innerHTML += '<h1>' + title + '</h1>';
			}
			if (description) {
				div.innerHTML += '<div class="description">' + description + '</div>';
			}
			rows.forEach(function(legendRow) {
				div.innerHTML += '<div class="legendRow">' + legendRow.key + legendRow.value + '</div>';
			});
			return div;
		}
		return legend;
	}

	function renderMaps(localSettingSets) {
		var mapTables = getMapTables();
		mapTables.forEach(function (mapTable) {
			var settingsSetName = 'default';
			if (mapTable.dataset.settings) {
				settingsSetName = mapTable.dataset.settings;
			}
			var localSettings = getLocalSettingSet(localSettingSets, settingsSetName);
			var icons = getSetting('icons', localSettings);
			var layers = getSetting('layers', localSettings);
			var layerControlTitle = getSetting('layerControlTitle', localSettings);
			var layerControlPosition = getSetting('layerControlPosition', localSettings);
			var layerControlCollapsed = getSetting('layerControlCollapsed', localSettings);
			var legendRows = getSetting('legendRows', localSettings);
			var legendTitle = getSetting('legendTitle', localSettings);
			var legendDescription = getSetting('legendDescription', localSettings);
			var legendPosition = getSetting('legendPosition', localSettings);
			var features = getSetting('features', localSettings);
			var overlayDefault = getSetting('overlayDefault', localSettings);
			var overlayTitle = getSetting('overlayTitle', localSettings);
			var scrollWheelZoom = getSetting('scrollWheelZoom', localSettings);
			var markers = getMarkersFromMapTable(mapTable);
			var bounds = getBoundsFromMarkers(markers, features);
			var overlay = generateOverlayControl(overlayDefault, overlayTitle)
			var layerGroups = generateLayerGroups(layers);

			var mapDiv = addMapNodeBeforeTable(mapTable);
			var simpleMap = L.map(
				mapDiv.id,
				{
					'tap': false, // See https://github.com/Leaflet/Leaflet/issues/7255#issuecomment-849638476
					'scrollWheelZoom': scrollWheelZoom,
				}
			).setView([0,0], 0);
			L.tileLayer(simpleMapsConfig.tileLayerUrl, {
				attribution: simpleMapsConfig.tileLayerAttribution,
			}).addTo(simpleMap);

			L.Icon.Default.imagePath = getLeafletIconImagePath()

			if (overlayDefault) {
				overlay.addTo(simpleMap);
			}

			markers.forEach(function(marker) {
				var layerGroup = 'default';
				if (hasLayer(marker, layers)) {
					layerGroup = marker.layer;
				}
				if (hasLatLng(marker)) {
					var markerSettings = {};

					if (marker.icon && icons && icons.hasOwnProperty(marker.icon)) {
						markerSettings.icon = icons[marker.icon];
					}
					var leafletMarker = L.marker(
						[marker.lat, marker.lng],
						markerSettings,
					).addTo(layerGroups[layerGroup]);

					if (marker.popupContent) {
						leafletMarker.bindPopup(marker.popupContent);
					}
				}
				if (hasFeature(marker, features)) {
					var decoratedFeature = features[marker.feature];
					decoratedFeature.properties.simpleMapMarker = marker;
					decoratedFeature.properties.simpleMapOverlayPane = overlay;
					var featureGeoJson = generateGeoJsonFeature(decoratedFeature);
					featureGeoJson.addTo(layerGroups[layerGroup]);
				}
			});

			Object.entries(layerGroups).forEach(function([key, layerGroup]) {
				simpleMap.addLayer(layerGroup);
			});
			var layerGroupControl = generateLayerGroupControl(
				layerGroups,
				layers,
				{
					position: layerControlPosition,
					collapsed: layerControlCollapsed,
				},
			);
			if (layers && Object.entries(layers).length > 0) {
				layerGroupControl.addTo(simpleMap);
				layerGroupControl.getContainer().classList.add('simpleMapControl');
				if (layerControlTitle) {
					var controlContainer = layerGroupControl.getContainer();
					var controlTitle = document.createElement('h1');
					controlTitle.innerHTML = layerControlTitle;
					controlContainer.insertBefore(
						controlTitle,
						controlContainer.firstChild,
					);
				}
			}

			if (legendRows.length > 0) {
				var legend = generateLegend(
					legendRows,
					legendTitle,
					legendDescription,
					legendPosition,
				);
				legend.addTo(simpleMap)
			}
			try {
				simpleMap.fitBounds(bounds);
			} catch {}
		})
	}
	var localSettingSets = loadLocalSettingSets();
	renderMaps(localSettingSets);
})()
