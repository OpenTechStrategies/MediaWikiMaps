<?php

class SimpleMapsHooks {
	public static function registerExtension() {

	}

	public static function onBeforePageDisplay( &$out ) {
    $out->addModules('ext.simplemaps');
    return true;
	}

	public static function onResourceLoaderGetConfigVars( array &$vars, string $skin, Config $config ) {
		// Define variables that we want accessible in JavaScript using the technique described in
		// https://www.mediawiki.org/wiki/Manual:Hooks/ResourceLoaderGetConfigVars
		$vars['wgSimpleMaps'] = [
			'settingsClass' => $config->get('SimpleMapsSettingsClass'),
			'renderingClass' => $config->get('SimpleMapsRenderingClass'),
			'tileLayerUrl' => $config->get('SimpleMapsTileLayerUrl'),
			'tileLayerAttribution' => $config->get('SimpleMapsTileLayerAttribution'),
		];

		return true;
	}

	public static function onOutputPageBeforeHTML( OutputPage $out, &$text ) {
		global $wgSimpleMapsRenderingClass,
			$wgSimpleMapsSettingsClass;
		$out->addInlineStyle('table.'.$wgSimpleMapsRenderingClass.' { display: none; }');
		$out->addInlineStyle('table.'.$wgSimpleMapsSettingsClass.' { display: none; }');
	}
}
