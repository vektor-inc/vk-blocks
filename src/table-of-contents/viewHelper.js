window.onload = () => {

    let hTags = getDom('entry-content');
    appendIdHtags(hTags,assignIdHref);

};

/**
 * Get hTag's NodeList included in target class's element.
 * @param targetClass
 * @returns {*} NodeListOf<Element> or false
 */
let getDom = (targetClass) => {

    let editor = document.getElementsByClassName(targetClass);
    if (!editor) {
        return false;
    } else {
        return editor[0].querySelectorAll("h1, h2, h3, h4, h5, h6");
    }
};

/**
 * Append span#{id} to inside H Tags in view.
 * @param hTags
 * @param callback
 */
let appendIdHtags = (hTags, callback) => {

    for (let i = 0; i < hTags.length; i++) {

        let hTag = hTags[i];

        if(!hTag.id){
            hTag.id = "vk-htags-" + i;
        }
    }

    callback(hTags);
};

/**
 * Add Htag's ID to href of Table of Contents block.
 * @param hTags
 */
let assignIdHref = (hTags) => {

    let aTags = document.getElementsByClassName('vk_table-of-contents_list_item_link');

    for (let i = 0; i < aTags.length; i++) {

        aTags[i].attributes[0].nodeValue = '#' + hTags[i].id;
    }

};

