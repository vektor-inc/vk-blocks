const vkFaq2Container = document.getElementsByClassName('vk_faq-accordion');

const FAQ2ToggleLoop = (i) => {
	const titleElement = vkFaq2Container[i].querySelector('.vk_faq_title');
	const contentElement = vkFaq2Container[i].querySelector('.vk_faq_content');

	// Assign unique ID to content element for aria-controls / コンテンツ要素にユニークIDを付与（aria-controls のため）
	const contentId = `vk-faq2-content-${i}`;
	contentElement.setAttribute('id', contentId);

	titleElement.setAttribute('tabindex', '0');
	titleElement.setAttribute('role', 'button');
	titleElement.setAttribute('aria-controls', contentId);
	// デフォルト値として false を設定し、open クラスがあれば true に上書きする
	titleElement.setAttribute('aria-expanded', 'false');

	if (vkFaq2Container[i].classList.contains('vk_faq-accordion-open')) {
		contentElement.classList.add('vk_faq_content-accordion-open');
		titleElement.setAttribute('aria-expanded', 'true');
	}

	if (vkFaq2Container[i].classList.contains('vk_faq-accordion-close')) {
		contentElement.classList.add('vk_faq_content-accordion-close');
		titleElement.setAttribute('aria-expanded', 'false');
	}

	const handleToggle = () => {
		if (vkFaq2Container[i].classList.contains('vk_faq-accordion-open')) {
			vkFaq2Container[i].classList.remove('vk_faq-accordion-open');
			vkFaq2Container[i].classList.add('vk_faq-accordion-close');

			contentElement.classList.remove('vk_faq_content-accordion-open');
			contentElement.classList.add('vk_faq_content-accordion-close');
			titleElement.setAttribute('aria-expanded', 'false');
		} else if (
			vkFaq2Container[i].classList.contains('vk_faq-accordion-close')
		) {
			vkFaq2Container[i].classList.remove('vk_faq-accordion-close');
			vkFaq2Container[i].classList.add('vk_faq-accordion-open');

			contentElement.classList.remove('vk_faq_content-accordion-close');
			contentElement.classList.add('vk_faq_content-accordion-open');
			titleElement.setAttribute('aria-expanded', 'true');
		}
	};

	titleElement.addEventListener('click', handleToggle, false);

	// Add keyboard support (Enter / Space) for toggle / Enter / Space キーで開閉できるようにキーボードイベントを追加
	titleElement.addEventListener(
		'keydown',
		(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				// Prevent default Space key scroll behavior / Space キーはページスクロールを防ぐ
				e.preventDefault();
				handleToggle();
			}
		},
		false
	);
};

for (let i = 0; i < vkFaq2Container.length; i++) {
	FAQ2ToggleLoop(i);
}
