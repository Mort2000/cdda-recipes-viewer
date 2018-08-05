import * as d3 from 'd3';

export default class RecipeViewer {
  constructor(index) {
    this.index = index;
    this.radius = 20;
    this.radiusBand = d3.interpolate(this.radius, this.radius * 2);
    this.lineColorBand = d3.interpolateHsl(d3.color('#388E3C'), d3.color('#D32F2F'));
    this.nodeColorBand = d3.interpolateHsl(d3.color('#C5E1A5'), d3.color('#FFAB91'));
  }

  dragstarted(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  // eslint-disable-next-line class-methods-use-this
  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragended(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  ticked() {
    this.link
      .each((d) => {
        d.dx = d.source.x - d.target.x;
        d.dy = d.source.y - d.target.y;
        const distance = Math.sqrt((d.dy ** 2) + (d.dx ** 2));
        d.sr = Math.min((this.radiusBand(d.source.value)) / distance, 0.5);
        d.tr = Math.min((this.radiusBand(d.target.value) + 5) / distance, 0.5);
      })
      .attr('x1', ({ source, dx, sr }) => source.x - dx * sr)
      .attr('y1', ({ source, dy, sr }) => source.y - dy * sr)
      .attr('x2', ({ target, dx, tr }) => target.x + dx * tr)
      .attr('y2', ({ target, dy, tr }) => target.y + dy * tr)
      .attr('stroke', ({ value }) => this.lineColorBand(value));

    this.node
      .attr('cx', ({ x }) => x)
      .attr('cy', ({ y }) => y)
      .attr('fill', ({ value }) => this.nodeColorBand(value))
      .attr('r', ({ value }) => this.radiusBand(value));

    this.text
      .attr('x', ({ x }) => x)
      .attr('y', ({ y }) => y);
  }

  mount(svg) {
    this.svg = svg;

    const bbox = this.svg.node().getBoundingClientRect();
    this.width = bbox.width;
    this.height = bbox.height;
    this.svg
      .attr('width', this.width)
      .attr('height', this.height);

    this.defs = this.svg.append('svg:defs');

    this.defs.append('svg:marker')
      .attr('id', 'triangle')
      .attr('refX', 2)
      .attr('refY', 2)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 4 2 0 4 1 2');

    this.linkLayer = this.svg.append('g').attr('class', 'links');
    this.nodeLayer = this.svg.append('g').attr('class', 'nodes');
    this.textLayer = this.svg.append('g').attr('class', 'texts');
  }

  load([nodes, links]) {
    this.data = {
      nodes,
      links: links.map((
        ([source, target]) => ({ source: source.id, target: target.id, id: `${source.id}->${target.id}` })
      )),
    };
    this.draw();
    this.start();
  }

  get link() {
    return this.linkLayer.selectAll('line').data(this.data.links, ({ id }) => id);
  }

  get node() {
    return this.nodeLayer.selectAll('circle').data(this.data.nodes, ({ id }) => id);
  }

  get text() {
    return this.textLayer.selectAll('text').data(this.data.nodes, ({ id }) => id);
  }

  draw() {
    if (this.simulation) this.simulation.on('tick', null);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(({ id }) => id))
      .force('charge', d3.forceManyBody(-100))
      .force('collide', d3.forceCollide(30))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.link.exit().remove();
    this.link.enter()
      .append('line')
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#triangle)');

    this.node.exit().remove();
    const newNodes = this.node.enter()
      .append('circle')
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    newNodes.append('title').text(({ components }) => components && components.length);

    this.text.exit().remove();
    this.text.enter()
      .append('text')
      .attr('dy', 4)
      .attr('class', 'text')
      .text(({ title }) => title)
      .on('click', (item) => {
        this.load(item.upstream());
      });
  }

  start() {
    this.simulation
      .nodes(this.data.nodes)
      .on('tick', this.ticked.bind(this));

    this.simulation
      .force('charge')
      .theta(0.7)
      .strength(({ components }) => (-components.length * 40));

    this.simulation.force('link')
      .links(this.data.links)
      .distance(({ target }) => Math.log(target.components.length + 2, 2) * this.radius * 5);
  }
}
