class ItemGroup {
  constructor(components, id = null) {
    this.results = [];
    this.components = [];
    [this.options] = components;
    [this.items, this.count] = this.options.reduce(
      ([pItems, pCount], [item, count]) => [[...pItems, item], [...pCount, count]], [[], []],
    );
    this.id = id || `_components_${ItemGroup.GroupCounter++}`;
  }

  get title() {
    return `${this.items.find(item => item.title).title}等(${this.items.length})`;
  }

  // eslint-disable-next-line no-unused-vars
  traverse(target, except = [], depth = 1) {
    this.value = 1 / depth;
    return [[this], []];
  }

  upstream() {
    return this.items.reduce(([pNodes, pLinks], item) => {
      const [nodes, links] = item.traverse('components', pNodes);

      return [[...pNodes, ...nodes], [...pLinks, ...links]];
    }, [[], []]);
  }
}

ItemGroup.GroupCounter = 0;

class Item {
  constructor(item) {
    this.item = item;
    this.id = item.id;
    this.links = {};
    this.results = [];
    this.components = [];
  }

  get title() {
    return this.item.title;
  }

  craftBy(recipe, index) {
    this.recipe = recipe;
    this.components = recipe.components ? recipe.components.map(options => (
      options.length === 1
        ? { item: index.get(options[0][0]), count: options[1] }
        : { item: new ItemGroup([options.map(([source, count]) => [index.get(source), count])]) }
    )) : [];
    this.components.forEach(({ item, opts }) => {
      item.results.push({ item: this, opts });
    });
  }

  traverse(target, except = [], depth = 1) {
    this.value = 1 / depth;

    return this[target].reduce(
      ([nodes, links], { item }) => {
        const [pNodes, pLinks] = except.indexOf(item) < 0
          ? item.traverse(target, [...nodes, ...except], depth + 1)
          : [[], []];

        return [
          [...nodes, ...pNodes],
          [...links, [item, this], ...pLinks],
        ];
      }, [[this], []],
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
  constructor(items, recipes, requirements, locale = null) {
    if (locale !== null) {
      items.filter(item => item.name in locale).forEach((item) => {
        [item.comment, item.title] = locale[item.name];
        item.id = item.id || item.ident;
        item.title = item.title instanceof Array ? item.title[0] : item.title;
      });
    }

    this.requirements = requirements
      .filter(group => group.components instanceof Array)
      .map(group => new ItemGroup(group.components, group.id));

    this.iter = [
      ...items.map(item => [item.id, new Item(item)]),
      ...this.requirements.map(group => [group.id, group]),
    ];
    this.items = new Map(this.iter);
    this.requirements.forEach((group) => {
      group.items = group.items.map(id => this.items.get(id));
    });

    this.iter.map(([id, item]) => [id, item['copy-from']])
      .filter(([id, source]) => id && this.items.has(source))
      .forEach(([id, source]) => {
        this.items.get(id).item = { ...this.items.get(source), ...this.items.get(id).item };
      });

    this.recipes = recipes
      // eslint-disable-next-line camelcase
      .filter(({ result, id_suffix }) => !id_suffix && this.items.has(result))
      .forEach(recipe => this.items.get(recipe.result).craftBy(recipe, this.items));
  }

  findAll(keyword) {
    return [...this.items.values()].filter(
      ({ id, title }) => title && (title.search(keyword) >= 0 || (id && id.search(keyword) >= 0)),
    );
  }

  search(keyword) {
    return [...this.items.values()].find(({ title }) => title && title.search(keyword) >= 0);
  }
}
