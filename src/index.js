import * as d3 from 'd3';

import RecipesIndex from './models/recipes';
import RecipeViewer from './components/viewer';
import Select from './components/select';

import items from '../.build/items';
import recipes from '../.build/recipes';
import locale from '../.build/locales/zh_CN.json';

document.addEventListener('DOMContentLoaded', () => {
  const viewer = new RecipeViewer();
  viewer.mount(d3.select('svg'));

  const index = new RecipesIndex(items, recipes, locale);
  const select = new Select('Item', d3.select('#select'));

  select.dispatch(input => index.findAll(input).map(
    ({ title, id }) => ({ label: title, value: id }),
  ));

  const view = (id) => {
    const item = index.items.get(id);
    viewer.load(item.upstream());
    viewer.draw();
    viewer.start();
  };

  select.input.on('change', () => {
    if (index.items.has(select.input.value)) view(select.value);
  });

  view('water_clean');
  select.input.node().focus();
});
