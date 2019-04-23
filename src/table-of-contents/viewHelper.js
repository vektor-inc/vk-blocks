window.onload = () => {

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

    //in html collection
    //out html collection  | id to href
    /**
     *
     * @param nodeList
     */
    let appendIdHtags = (nodeList) => {

        console.log(nodeList);

        for (let i = 0; i < nodeList.length; i++) {

            let id = document.createElement("span");
            id.id = "id";
            nodeList[i].appendChild(id);


            // if (hTags[i].tagName === "UL") {
            //
            //     blockElm[0].removeChild(hTags[i]);
            // }

        }
    };

    let Htags = getDom('entry-content');
    appendIdHtags(Htags);

};
