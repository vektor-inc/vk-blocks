window.onload = () => {

    let Htags = getDom('entry-content');
    appendIdHtags(Htags);
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
