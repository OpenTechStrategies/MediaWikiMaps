<?php

class SimpleMapsHooks {
	public static function registerExtension() {

	}

	public static function onBeforePageDisplay( &$out ) {
    $out->addModules('ext.simplemaps');
    return true;
	}

	public static function onResourceLoaderGetConfigVars( array &$vars, string $skin, Config $config ) {
		// Define variables that we want accessable in JavaScript using the technique decribed in
		// https://www.mediawiki.org/wiki/Manual:Hooks/ResourceLoaderGetConfigVars
		$vars['wgSimpleMaps'] = [
			'renderingClass' => $config->get('SimpleMapsRenderingClass'),
		];

		return true;
	}
}
