# SimpleMaps Extension for MediaWiki
This project adds basic map visualization functionality to wikis using specifically formatted wiki tables.

## Extension settings

* `SimpleMapsRenderingClass` (default is `simpleMap`): the table class that SimpleMaps will look for to know which wiki tables to convert to a map.
* `SimpleMapsSettingsClass` (default is `simpleMapSettings`): the table class that SimpleMaps will look for to define settings associated with a given map.
* `SimpleMapsTileLayerUrl`: the tileset url that SimpleMaps will use when rendering maps.
* `SimpleMapsTileLayerAttribution`: the attribution for the tile data.

## How to add a map

SimpleMaps uses javascript to detect and replace specially tagged formatted wiki tables with Leaflet maps.  The table must have the `SimpleMapsRenderingClass` (default: `simpleMap`) class to be processed.

### SimpleMap Columns

SimpleMap looks for certain column headers to know how to process a table.  These headers must be defined as the first row of the table.  They are case insensitive and can be defined in any order.  All fields are technically optional, but in order for an element to render some fields must be set.

* `Lat`: The latitude of the pin to be added. This field is required in order to render a pin.
* `Lng`: The longitude of the pin to be added. This field is required in order to render a pin.
* `Popup Content`: An optional label which will appear as a popup.
* `Icon`: Use a custom icon, as defined by a simple map settings table.
* `Feature`: Use a custom icon, as defined by a simple map settings table. This field is required in order to render a polygon.

### SimpleMapSettings Columns

It is possible to modify the settings of all SimpleMaps instance on a page by creating a map settings table on the same wiki page as a SimpleMap.  This table should have two columns, titled `Setting` and `Value`, where the first column of a row defines the name of the setting, and the second defines the value.

Below are the valid setting names:

* `Icons`: an embedded table (see the `Custom Icons` section) which defines custom icons for use by markers in a SimpleMap.
* `Feature Collection JSON`: A JSON string which contains a [GeoJSON Feature Collection](https://datatracker.ietf.org/doc/html/rfc7946#section-3.3).  Feature IDs can be referenced by map data.

#### Icon Columns

Defining a custom Icon requires several fields.  These fields are used to populate the [Leaflet custom icon object](https://leafletjs.com/reference-1.7.1.html#icon).

* `Id`: The identifier / name which markers can specify in order to use this icon.
* `Icon Url`: A URL pointing to the image to use for an icon.
* `Icon Height`: The height of the icon (in pixels).
* `Icon Width`: The width of the icon  (in pixels).
* `Icon Anchor X`: The X coordinate of the [icon anchor](https://leafletjs.com/reference-1.7.1.html#icon-iconanchor).
* `Icon Anchor Y`: The Y coordinate of the [icon anchor](https://leafletjs.com/reference-1.7.1.html#icon-iconanchor).
* `Shadow Url` (optional): A URL pointing to the image to use for an icon's shadow.
* `Shadow Height` (optional): The height of the shadow (in pixels).
* `Shadow Width` (optional): The width of the shadow (in pixels).
* `Shadow Anchor X` (optional): The X coordinate of the [shadow anchor](https://leafletjs.com/reference-1.7.1.html#icon-shadowanchor).
* `Shadow Anchor Y` (optional): The Y coordinate of the [shadow anchor](https://leafletjs.com/reference-1.7.1.html#icon-shadowanchor).
* `Popup Anchor X` (optional): The X coordinate of the [popup anchor](https://leafletjs.com/reference-1.7.1.html#icon-popupanchor).
* `Popup Anchor Y` (optional): The Y coordinate of the [popup anchor](https://leafletjs.com/reference-1.7.1.html#icon-popupanchor).

#### Example Settings Table

For instance, this table would define a new icon type of 'flag'.

```
{| class="simpleMapSettings"
 |-
 ! Setting
 ! Value
 |-
 |Icons
 |
  {|
   |-
   ! Id
   ! Icon Url
   ! Icon Height
   ! Icon Width
   ! Icon Anchor X
   ! Icon Anchor Y
   ! Shadow Url
   ! Shadow Height
   ! Shadow Width
   ! Shadow Anchor X
   ! Shadow Anchor Y
   ! Popup Anchor X
   ! Popup Anchor Y
   |-
   | flag
   | https://leafletjs.com/examples/custom-icons/leaf-green.png
   | 38
   | 95
   | 22
   | 94
   | https://leafletjs.com/examples/custom-icons/leaf-shadow.png
   | 50
   | 64
   | 4
   | 62
   | -3
   | -76
   |}
 |}
 ```

