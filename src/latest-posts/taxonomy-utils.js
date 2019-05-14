const getTaxonomySlugs = (taxonomies) => {

    if (!taxonomies) {
        return false
    }

    let slugs = [];
    for (let i = 0; i <= taxonomies.length - 1; i++) {
        slugs.push(taxonomies[i].slug);
    }
    return slugs;
};

const setUpTaxonomyData = (taxonomies, slugs, select) => {

    let Taxonomy = [];

    for (let i = 0; i <= slugs.length - 1; i++) {
        let tax = (select('core').getEntityRecords('taxonomy', taxonomies[i].slug));

        if (tax != null) {

            for (let i = 0; i <= tax.length - 1; i++) {

                if (tax[i].slug != null) {

                    Taxonomy[tax[i].slug] = {
                        name: tax[i].name,
                        slug: tax[i].slug,
                        taxonomyType: tax[i].taxonomy,
                    }
                }
            }
        }
    }

    return Taxonomy;
};

export {getTaxonomySlugs, setUpTaxonomyData};
