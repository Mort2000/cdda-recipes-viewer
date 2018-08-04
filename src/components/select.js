export default class Select {
  constructor(name, parent) {
    this.name = name;
    this.parent = parent;

    const id = `select-${name}`;
    const lid = `select-${name}-datalist`;
    this.datalist = parent.append('datalist').attr('id', lid);
    this.label = parent
      .append('label')
      .attr('for', id)
      .text(name);

    this.input = parent
      .append('input')
      .attr('id', id)
      .attr('list', lid);
  }

  loadOptions(items) {
    const options = this.datalist.selectAll('option').data(items.slice(0, 64));
    options.exit().remove();
    options.enter()
      .append('option')
      .attr('value', ({ value }) => value)
      .text(({ label }) => label);
  }

  get value() {
    return this.input.node().value;
  }

  dispatch(cb) {
    this.input.on('input', () => {
      const input = this.value.trim();
      if (input) this.loadOptions(cb(input));
    });
  }
}
