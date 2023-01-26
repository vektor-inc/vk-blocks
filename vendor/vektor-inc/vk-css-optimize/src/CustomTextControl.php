<?php //phpcs:ignore
/**
 * CustomTextControl
 *
 * @package vektor-inc/vk-css-optimize
 * @license GPL-2.0+
 *
 * @version 0.0.1
 */

namespace VektorInc\VK_CSS_Optimize;

/**
 * CustomTextControl
 */
class CustomTextControl extends \WP_Customize_Control {
	public $type         = 'customtext';
	public $description  = ''; // we add this for the extra description.
	public $input_before = '';
	public $input_after  = '';
	/**
	 * Render Content
	 */
	public function render_content() {
		?>
		<label>
			<span class="customize-control-title"><?php echo esc_html( $this->label ); ?></span>
			<?php $style = ( $this->input_before || $this->input_after ) ? ' style="width:50%"' : ''; ?>
			<div>
				<?php echo wp_kses_post( $this->input_before ); ?>
				<input type="text" value="<?php echo esc_attr( $this->value() ); ?>"<?php echo $style; ?> <?php $this->link(); ?> />
				<?php echo wp_kses_post( $this->input_after ); ?>
			</div>
			<div><?php echo $this->description; ?></div>
		</label>
		<?php
	} // public function render_content() {
}
