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

    console.log(nodeList);

    for (let i = 0; i < nodeList.length; i++) {

        let id = document.createElement("span");
        id.id = "vk-htags-" + i;
        nodeList[i].appendChild(id);

    }
};
