window.onload = () => {

    let hTags = getDom('entry-content');
    appendIdHtags(hTags);

    let aTags = document.getElementsByClassName('vk_table-of-contents-list_item_link');
    assignIdHref(aTags,hTags);

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
 * @param nodeList
 */
let appendIdHtags = (nodeList) => {

    for (let i = 0; i < nodeList.length; i++) {

        let hTag = nodeList[i];

        if(!hTag.id){
            hTag.id = "vk-htags-" + i;
        }
    }
};

/**
 * Add Htag's ID to href of Table of Contents block.
 * @param aTags
 * @param Htags
 */
let assignIdHref = (aTags,Htags) => {

    for (let i = 0; i < aTags.length; i++) {

        aTags[i].attributes[0].nodeValue = Htags[i].id;
    }

};

