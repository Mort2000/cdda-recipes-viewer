class Item {
  constructor(item) {
    this.item = item;
    this.id = item.id;
    this.results = [];
    this.components = [];
    this.title = item.title;
  }

  craftBy(recipe, index) {
    this.recipe = recipe;
    this.components = recipe.components ? recipe.components.reduce(
      (previous, options) => options
        // eslint-disable-next-line no-unused-vars
        .filter(([source, count]) => index.has(source))
        .map(([source, count]) => [index.get(source), count])
        .map(([item, count], i, opts) => ({ item, opts, count }))
        .reduce((comps, comp) => [...comps, comp], previous), [],
    ) : [];
    this.components.forEach(({ item, opts }) => {
      item.results.push({ item: this, opts });
    });
  }

  traverse(target, except = [], depth = 1) {
    return this[target].reduce(
      ([nodes, links], { item, opts }) => {
        const [pNodes, pLinks] = except.indexOf(item.id) < 0
          ? item.traverse(target, [...nodes.map(({ id }) => id), ...except], depth + 1)
          : [[], []];

        return [
          [...nodes, ...pNodes],
          [...links, { source: item.id, target: this.id, value: 1 / opts.length }, ...pLinks],
        ];
      }, [[{
        item: this, id: this.id, title: this.title, value: 1 / depth,
      }], []],
    );
  }

  downstream() {
    return this.traverse('results');
  }

  upstream() {
    return this.traverse('components');
  }
}

export default class RecipesIndex {
  constructor(items, recipes, locale = null) {
    if (locale !== null) {
      items.filter(item => item.name in locale).forEach((item) => {
        [item.comment, item.title] = locale[item.name];
        item.id = item.id || item.ident;
        item.title = item.title instanceof Array ? item.title[0] : item.title;
      });
    }

    this.items = new Map(items.map(item => [item.id, new Item(item)]));
    this.recipes = recipes
      .filter(({ result }) => this.items.has(result))
      .forEach(recipe => this.items.get(recipe.result).craftBy(recipe, this.items));
  }

  findAll(keyword) {
    return [...this.items.values()].filter(({ title }) => title && title.search(keyword) >= 0);
  }

  search(keyword) {
    return [...this.items.values()].find(({ title }) => title && title.search(keyword) >= 0);
  }
}
