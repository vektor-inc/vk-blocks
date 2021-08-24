<?php
/*
  Load modules
/*-------------------------------------------*/
if ( ! class_exists( 'Vk_Font_Awesome_Versions' ) ) {
	if ( ! vk_blocks_is_lightning() ) {
		global $font_awesome_directory_uri;
		$font_awesome_directory_uri = plugins_url( '', __FILE__ ) . '/package/';

		global $set_enqueue_handle_style;
		$set_enqueue_handle_style = 'vkExUnit_common_style';

		require_once dirname( __FILE__ ) . '/package/class-vk-font-awesome-versions.php';
	}
}
