window.onload = () => {

    let hTags = getDom();
    appendIdHtags(hTags,assignIdHref);

};

let isExist = (val) =>{
    if (typeof val === 'undefined' || val === null ) {
        return false
    }else {
        return true;
    }
};

/**
 * Get hTag's NodeList included in target class's element.
 * @returns {*} NodeListOf<Element> or false
 */
let getDom = () => {

    let editor = document.getElementsByClassName('vk_table-of-contents');

    if(isExist(editor[0])){
        if (editor[0].parentElement) {
            return editor[0].parentElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
        } else {
            return false;
        }
    }
};

/**
 * Append span#{id} to inside H Tags in view.
 * @param hTags
 * @param callback
 */
let appendIdHtags = (hTags, callback) => {

    if(isExist(hTags)){

        for (let i = 0; i < hTags.length; i++) {

            let hTag = hTags[i];

            if (!hTag.id) {
                hTag.id = "vk-htags-" + i;
            }
        }

        callback(hTags);
    }
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

