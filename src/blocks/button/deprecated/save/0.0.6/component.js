import { Component } from '@wordpress/element';
import parse from 'html-react-parser';

export class VKBButton extends Component {
	render() {
		const buttonColorCustom = this.props.lbColorCustom;
		const buttonColor = this.props.lbColor;
		const buttonType = this.props.lbType;
		const buttonAlign = this.props.lbAlign;
		const buttonSize = this.props.lbSize;
		const buttonUrl = this.props.lbUrl;
		const buttonTarget = this.props.lbTarget;
		let fontAwesomeIconBefore = this.props.lbFontAwesomeIconBefore;
		let fontAwesomeIconAfter = this.props.lbFontAwesomeIconAfter;
		const richText = this.props.lbRichtext;
		const subCaption = this.props.lbsubCaption;
		let aClass = '';
		let aStyle = {};
		let iconBefore = '';
		let iconAfter = '';

		aStyle = null;
		aClass = `vk_button_link`;

		if (buttonType === '0' || buttonType === null || buttonType === '1') {
			aClass = `${aClass} btn`;
		} else {
			aClass = `${aClass} vk_button_link-type-text`;
		}

		// 塗り
		if (buttonType === '0' || buttonType === null) {
			// 規定カラーの場合
			if (
				buttonColorCustom === 'undefined' ||
				buttonColorCustom === undefined ||
				buttonColorCustom === null
			) {
				aClass = `${aClass} btn-${buttonColor}`;
				aStyle = null;

				// カスタムカラーの場合
			} else {
				aStyle = {
					backgroundColor: `${buttonColorCustom}`,
					border: `1px solid ${buttonColorCustom}`,
					color: `#fff`,
				};
			}
			// 塗りなし
		} else if (buttonType === '1') {
			// 規定カラーの場合
			if (
				buttonColorCustom === 'undefined' ||
				buttonColorCustom === undefined ||
				buttonColorCustom === null
			) {
				aClass = `${aClass} btn-outline-${buttonColor}`;
				aStyle = null;
				// カスタムカラーの場合
			} else {
				aStyle = {
					backgroundColor: 'transparent',
					border: `1px solid ${buttonColorCustom}`,
					color: `${buttonColorCustom}`,
				};
			}
			// テキストのみ
		} else if (buttonType === '2') {
			// 規定カラーの場合
			if (
				buttonColorCustom === 'undefined' ||
				buttonColorCustom === undefined ||
				buttonColorCustom === null
			) {
				aClass = `${aClass} btn-outline-${buttonColor}`;
				aStyle = null;
				// カスタムカラーの場合
			} else {
				aStyle = {
					color: `${buttonColorCustom}`,
				};
			}
		}

		aClass = `${aClass} btn-${buttonSize}`;

		if (buttonAlign === 'block') {
			aClass = `${aClass} btn-block`;
		}

		//過去バージョンをリカバリーした時にiconを正常に表示する
		if (fontAwesomeIconBefore && !fontAwesomeIconBefore.match(/<i/)) {
			fontAwesomeIconBefore = `<i class="${fontAwesomeIconBefore}"></i>`;
		}
		if (fontAwesomeIconAfter && !fontAwesomeIconAfter.match(/<i/)) {
			fontAwesomeIconAfter = `<i class="${fontAwesomeIconAfter}"></i>`;
		}

		if (fontAwesomeIconBefore) {
			fontAwesomeIconBefore = fontAwesomeIconBefore.replace(
				/ fas/g,
				'fas '
			);

			//add class and inline css
			const faIconFragmentBefore = fontAwesomeIconBefore.split(' ');
			faIconFragmentBefore[1] =
				' ' + faIconFragmentBefore[1] + ` vk_button_link_before `;
			iconBefore = faIconFragmentBefore.join('');
		}
		if (fontAwesomeIconAfter) {
			iconAfter = fontAwesomeIconAfter.replace(/ fas /g, ' vk_button_link_after fas');
		}

		return (
			/* eslint react/jsx-no-target-blank: 0 */
			<a
				href={buttonUrl}
				id={'vk_button_link'}
				style={aStyle}
				className={aClass}
				role={'button'}
				aria-pressed={true}
				target={buttonTarget ? '_blank' : null}
				rel={'noopener noreferrer'}
			>
				{parse(iconBefore)}
				{richText}
				{parse(iconAfter)}
				{/*サブキャプションが入力された時のみ表示*/}
				{subCaption && (
					<p className={'vk_button_link_subCaption'}>{subCaption}</p>
				)}
			</a>
		);
	}
}
