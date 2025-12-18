/* globals MutationObserver */
import { useCallback, useEffect } from '@wordpress/element';

const DEFAULT_LINK_SELECTOR =
	'.vk_post_imgOuter a, .vk_post .vk_post_title a, .postListText_title a, .card-intext .card-intext-inner, .postListText_singleTermLabel_inner, .vk_post_btnOuter a, .vk_post_taxonomy_terms a';

const PROCESSED_MARK = 'data-vk-disable-links-processed';

const defaultLinkProcessor = (link) => {
	if (link.hasAttribute(PROCESSED_MARK)) {
		return;
	}

	link.addEventListener('click', (event) => {
		event.preventDefault();
	});
	link.style.cursor = 'default';
	link.style.boxShadow = 'unset';
	link.style.textDecorationColor = 'inherit';
	link.setAttribute(PROCESSED_MARK, 'true');
};

export const useDisableLinks = ({
	selector = DEFAULT_LINK_SELECTOR,
	onLinkProcess = defaultLinkProcessor,
	deps = [],
} = {}) => {
	const disableLinks = useCallback(() => {
		if (typeof document === 'undefined') {
			return;
		}

		const iframe = document.querySelector(
			'.block-editor-iframe__container iframe'
		);
		const targetDocument = iframe?.contentWindow?.document || document;

		const links = targetDocument.querySelectorAll(selector);
		links.forEach(onLinkProcess);
	}, [selector, onLinkProcess]);

	useEffect(() => {
		if (typeof document === 'undefined') {
			return undefined;
		}

		const iframe = document.querySelector(
			'.block-editor-iframe__container iframe'
		);
		const targetDocument = iframe?.contentWindow?.document || document;
		const observerTarget = targetDocument.querySelector('body');

		const observer = new MutationObserver(disableLinks);
		if (observerTarget) {
			observer.observe(observerTarget, {
				childList: true,
				subtree: true,
			});
		}

		disableLinks();

		return () => observer.disconnect();
	}, [disableLinks, ...deps]);

	return disableLinks;
};

export const editorLinkSelector = DEFAULT_LINK_SELECTOR;
