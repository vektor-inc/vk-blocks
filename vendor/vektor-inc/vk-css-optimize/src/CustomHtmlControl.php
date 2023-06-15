<?php //phpcs:ignore
/**
 * CustomHtmlControl
 *
 * @package vektor-inc/vk-css-optimize
 * @license GPL-2.0+
 *
 * @version 0.0.1
 */

namespace VektorInc\VK_CSS_Optimize;

/**
 * VkCustomHtmlControl
 */
class CustomHtmlControl extends \WP_Customize_Control {
	public $type             = 'customtext';
	public $custom_title_sub = ''; // we add this for the extra custom_html.
	public $custom_html      = ''; // we add this for the extra custom_html.
	public function render_content() {
		if ( $this->label ) {
			// echo '<h2 class="admin-custom-h2">' . wp_kses_post( $this->label ) . '</h2>';
			echo '<h2 class="admin-custom-h2">' . wp_kses_post( $this->label ) . '</h2>';
		}
		if ( $this->custom_title_sub ) {
			echo '<h3 class="admin-custom-h3">' . wp_kses_post( $this->custom_title_sub ) . '</h3>';
		}
		if ( $this->custom_html ) {
			echo '<div>' . wp_kses_post( $this->custom_html ) . '</div>';
		}
	} // public function render_content() {
} // class Custom_Html_Control extends WP_Customize_Control {
