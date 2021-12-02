<?php
/**
 * This file represents an example of the code that themes would use to register
 * the required plugins.
 *
 * It is expected that theme authors would copy and paste this code into their
 * functions.php file, and amend to suit.
 *
 * @see http://tgmpluginactivation.com/configuration/ for detailed documentation.
 *
 * @package    TGM-Plugin-Activation
 * @subpackage Example
 * @version    2.5.2
 * @author     Thomas Griffin, Gary Jones, Juliette Reinders Folmer
 * @copyright  Copyright (c) 2011, Thomas Griffin
 * @license    http://opensource.org/licenses/gpl-2.0.php GPL v2 or later
 * @link       https://github.com/TGMPA/TGM-Plugin-Activation
 */

add_action( 'tgmpa_register', 'vkb_register_required_plugins' );
/**
 * Register the required plugins for this theme.
 *
 * In this example, we register five plugins:
 * - one included with the TGMPA library
 * - two from an external source, one from an arbitrary source, one from a GitHub repository
 * - two from the .org repo, where one demonstrates the use of the `is_callable` argument
 *
 * The variable passed to tgmpa_register_plugins() should be an array of plugin
 * arrays.
 *
 * This function is hooked into tgmpa_init, which is fired within the
 * TGM_Plugin_Activation class constructor.
 */
function vkb_register_required_plugins() {
	/*
	 * Array of plugin arrays. Required keys are name and slug.
	 * If the source is NOT from the .org repo, then source is also required.
	 */
	$plugins = array(

		// This is an example of how to include a plugin bundled with a theme.
		array(
			'name'     => 'VK Block Patterns', // The plugin name.
			'slug'     => 'vk-block-patterns', // The plugin slug (typically the folder name).
			'required' => false, // If false, the plugin is only 'recommended' instead of required.
		),
	);

	/*
	 * Array of configuration settings. Amend each line as needed.
	 *
	 * TGMPA will start providing localized text strings soon. If you already have translations of our standard
	 * strings available, please help us make TGMPA even better by giving us access to these translations or by
	 * sending in a pull-request with .po file(s) with the translations.
	 *
	 * Only uncomment the strings in the config array if you want to customize the strings.
	 */
	$config = array(
		'id'           => 'tgmpa',                 // Unique ID for hashing notices for multiple instances of TGMPA.
		'default_path' => '',                      // Default absolute path to bundled plugins.
		'menu'         => 'tgmpa-install-plugins', // Menu slug.
		'parent_slug'  => 'plugins.php',           // Parent menu slug.
		'capability'   => 'edit_theme_options',    // Capability needed to view plugin install page, should be a capability associated with the parent menu used.
		'has_notices'  => true,                    // Show admin notices or not.
		'dismissable'  => true,                    // If false, a user cannot dismiss the nag message.
		'dismiss_msg'  => '',                      // If 'dismissable' is false, this message will be output at top of nag.
		'is_automatic' => false,                   // Automatically activate plugins after installation or not.
		'message'      => '',                      // Message to output right before the plugins table.

		'strings'      => array(
			'page_title'                      => __( 'Install Required Plugins', 'vk-blocks' ),
			'menu_title'                      => __( 'Install Plugins', 'vk-blocks' ),
			// translators: %s = plugin name.
			'installing'                      => __( 'Installing Plugin: %s', 'vk-blocks' ),
			'oops'                            => __( 'Something went wrong with the plugin API.', 'vk-blocks' ),
			// translators:
			'notice_can_install_required'     => _n_noop(
				'This plugin requires the following plugin: %1$s.',
				'This plugin requires the following plugins: %1$s.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_can_install_recommended'  => _n_noop(
				'This plugin recommends the following plugin: %1$s.<br>Many additional functions are available for free.',
				'This plugin recommends the following plugins: %1$s.<br>Many additional functions are available for free.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_cannot_install'           => _n_noop(
				'Sorry, but you do not have the correct permissions to install the %1$s plugin.',
				'Sorry, but you do not have the correct permissions to install the %1$s plugins.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_ask_to_update'            => _n_noop(
				'The following plugin needs to be updated to its latest version to ensure maximum compatibility with this plugin: %1$s.',
				'The following plugins need to be updated to their latest version to ensure maximum compatibility with this plugin: %1$s.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_ask_to_update_maybe'      => _n_noop(
				'There is an update available for: %1$s.',
				'There are updates available for the following plugins: %1$s.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_cannot_update'            => _n_noop(
				'Sorry, but you do not have the correct permissions to update the %1$s plugin.',
				'Sorry, but you do not have the correct permissions to update the %1$s plugins.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_can_activate_required'    => _n_noop(
				'The following required plugin is currently inactive: %1$s.',
				'The following required plugins are currently inactive: %1$s.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_can_activate_recommended' => _n_noop(
				'The following recommended plugin is currently inactive: %1$s.',
				'The following recommended plugins are currently inactive: %1$s.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'notice_cannot_activate'          => _n_noop(
				'Sorry, but you do not have the correct permissions to activate the %1$s plugin.',
				'Sorry, but you do not have the correct permissions to activate the %1$s plugins.',
				'vk-blocks'
			),
			// translators: %s = plugin name.
			'install_link'                    => _n_noop(
				'Begin installing plugin',
				'Begin installing plugins',
				'vk-blocks'
			),
			'update_link'                     => _n_noop(
				'Begin updating plugin',
				'Begin updating plugins',
				'vk-blocks'
			),
			'activate_link'                   => _n_noop(
				'Begin activating plugin',
				'Begin activating plugins',
				'vk-blocks'
			),
			'return'                          => __( 'Return to Required Plugins Installer', 'vk-blocks' ),
			'plugin_activated'                => __( 'Plugin activated successfully.', 'vk-blocks' ),
			'activated_successfully'          => __( 'The following plugin was activated successfully:', 'vk-blocks' ),
			// translators: %s = plugin name.
			'plugin_already_active'           => __( 'No action taken. Plugin %1$s was already active.', 'vk-blocks' ),
			// translators: %s = plugin name.
			'plugin_needs_higher_version'     => __( 'Plugin not activated. A higher version of %s is needed for this theme. Please update the plugin.', 'vk-blocks' ),
			// translators: %s = plugin name.
			'complete'                        => __( 'All plugins installed and activated successfully. %1$s', 'vk-blocks' ),
			// translators: %s = dashboard link.
			'contact_admin'                   => __( 'Please contact the administrator of this site for help.', 'vk-blocks' ),
			'nag_type'                        => 'updated', // Determines admin notice type - can only be 'updated', 'update-nag' or 'error'.
		),
	);

	tgmpa( $plugins, $config );
}
