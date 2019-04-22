import TableOfContents from './TableOfContents';

window.onload = () => {

    const tocView = new TableOfContents();

    if (tocView.getHtagsInView()) {

        console.log("success!");
    }

};
