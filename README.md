# SimpleMaps Extension for MediaWiki
This project adds basic map visualization functionality to wikis using specifically formatted wiki tables.

## Extension settings

* `SimpleMapsRenderingClass` (default is `simpleMap`): the table class that SimpleMaps will look for to know which wiki tables to convert to a map.

## How to add a map

SimpleMaps uses javascript to detect and replace specially tagged formatted wiki tables with Leaflet maps.  The table must have the `SimpleMapsRenderingClass` (default: `simpleMap`) class to be processed.

### SimpleMap Columns

SimpleMap looks for certain column headers to know how to process a table.  These headers must be defined as the first row of the table.  They are case insensitive and can be defined in any order.

* `Lat`: The latitude of the pin to be added.
* `Lng`: The longitude of the pin to be added.
* `Label` (optional): An optional label which will appear as a popup.
