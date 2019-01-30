<?php
function vkblocks_active() {
	return true;
}

function vkblocks_blocks_assets() {

	wp_register_style( 'vk-blocks-build-css', VK_BLOCKS_URL . 'build/block-build.css', array(), VK_BLOCKS_VERSION );
	wp_register_style( 'vk-blocks-build-editor-css', VK_BLOCKS_URL . 'build/block-build-editor.css', array(), VK_BLOCKS_VERSION );
	wp_register_script(
		'vk-blocks-buid-js', VK_BLOCKS_URL . 'build/block-build.js', array(
		'wp-blocks',
		'wp-i18n',
		'wp-element',
	), VK_BLOCKS_VERSION, true
	);

	if(function_exists('wp_set_script_translations' )){
		wp_set_script_translations( 'vk-blocks-build-js', 'vk-blocks', plugin_dir_path( __FILE__ ) . 'build/languages' );
	}

	$theme = wp_get_theme();
	if ( $theme->exists() ) {
		$theme_slug = $theme->get( 'TextDomain' );
		if($theme_slug == 'lightning-pro'){
			wp_localize_script( 'vk-blocks-build-js', 'vk_blocks_check', array( 'is_pro' => true ) );
		}
	}

	global $wp_version;
	if ( defined( 'GUTENBERG_VERSION' ) || version_compare( $wp_version, '5.0', '>=' ) ) {

	$arr = array('alert','balloon','button','faq','flow','pr-blocks','outer','pr-content');//REPLACE-FLAG : このコメントは削除しないで下さい。wp-create-gurten-template.shで削除する基準として左の[//REPLACE-FLAG]を使っています。
		foreach ($arr as $value) {
			register_block_type(
				'vk-blocks/' . $value, array(
					'style'         => 'vk-blocks-build-css',
					'editor_style'  => 'vk-blocks-build-editor-css',
					'editor_script' => 'vk-blocks-build-js',
				)
			);
		}
	}
}
add_action( 'init', 'vkblocks_blocks_assets' );

// Add Block Category,
function vkblocks_blocks_categories( $categories, $post ) {
	global $vk_blocks_prefix;
	return array_merge(
		$categories,
		array(
			array(
				'slug'  => 'vk-blocks-cat',
				'title' => $vk_blocks_prefix . __( 'Blocks（Beta）', 'vk-blocks' ),
				'icon'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>',
			),
			array(
				'slug'  => 'vk-blocks-cat-layout',
				'title' => $vk_blocks_prefix . __( 'Blocks Layout（Beta）', 'vk-blocks' ),
				'icon'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>',
			),
		)
	);
}
add_filter( 'block_categories', 'vkblocks_blocks_categories', 10, 2 );