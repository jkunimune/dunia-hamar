// map.js: all of the cartographic code
'use strict';

const MAP_PRECISION = 1/6;
const SUN_ELEVATION = 60/180*Math.PI;
const AMBIENT_LIGHT = 0.2;


/**
 * create an ordered Iterator of segments that form the boundary of this.
 * @param nodes Set of Node that are part of this group.
 * @return Array of {type: String, args: [Number, Number]} that represents the
 * boundary as a series of Path segments, ordered widdershins.
 */
function outline(nodes) {
	if (!(nodes instanceof Set)) // first, cast this to a Set
		nodes = new Set(nodes); // we're going to be making a _lot_ of calls to Set.has()

	const accountedFor = new Set(); // keep track of which Edge have been done
	const output = [];
	for (let ind of nodes) { // look at every included node
		for (let way of ind.neighbors.keys()) { // and every node adjacent to an included one
			if (nodes.has(way))    continue; // (really we only care about excluded way)
			let edge = ind.neighbors.get(way);
			if (accountedFor.has(edge)) continue; // (and can ignore edges we've already hit)

			const loopIdx = output.length;
			const start = edge; // the edge between them defines the start of the loop
			do {
				const next = ind.leftOf(way); // look for the next triangle, going widdershins
				const vertex = next.circumcenter; // pick out its circumcenter to plot
				output.push({type: 'L', args: [vertex.φ, vertex.λ]}); // make the Path segment
				accountedFor.add(edge); // check this edge off
				if (nodes.has(next.acrossFrom(edge))) // then, depending on the state of the Node after that Triangle
					ind = next.acrossFrom(edge); // advance one of the state nodes
				else
					way = next.acrossFrom(edge);
				edge = ind.neighbors.get(way); // and update edge
			} while (edge !== start); // continue for the full loop

			output[loopIdx].type = 'M'; // whenever a loop ends, set its beginning to a moveTo
			output.push({type: 'L', args: [...output[loopIdx].args]}); // and add closure
		}
	}

	return output;
}


/**
 * a class to handle all of the graphical arrangement stuff.
 */
class Chart {
	constructor(projection) {
		this.projection = projection;
	}

	/**
	 * draw a region of the world on the map with the given color.
	 * @param nodes Iterator of Node to be colored in.
	 * @param svg SVG object on which to put the Path.
	 * @param color String that HTML can interpret as a color.
	 * @return Path the newly created element encompassing these triangles.
	 */
	fill(nodes, svg, color, strokeWidth=0) {
		if (nodes.length <= 0)
			return null;
		return this.map(outline(nodes), svg).fill(color).stroke({color: color, width: strokeWidth, linejoin: 'round'});
	}

	stroke(edge, svg, color, width) {
		return this.map([
			{type: 'M', args: [edge.triangleL.φ, edge.triangleL.λ]},
			{type: 'L', args: [edge.triangleR.φ, edge.triangleR.λ]},
		], svg, false).fill('none').stroke({color: color, width: width, linecap: 'round'});
	}

	/**
	 * create a relief layer for the given set of triangles.
	 * @param triangles Array of Triangle to shade.
	 * @param svg SVG object on which to shade.
	 * @param attr String name of attribute to base the relief on.
	 */
	shade(triangles, svg, attr) { // TODO use separate delaunay triangulation
		if (!triangles)
			return;

		const slopes = [];
		let maxSlope = 0;
		for (let i = 0; i < triangles.length; i ++) { // start by computing slopes of all of the things
			const p = [];
			for (const node of triangles[i].vertices) {
				const {x, y} = this.projection.project(node.φ, node.λ);
				const z = Math.max(0, node[attr]);
				p.push(new Vector(x, -y, z));
			}
			let n = p[1].minus(p[0]).cross(p[2].minus(p[0])).norm();
			slopes.push(n.y/n.z);
			if (n.z > 0 && slopes[i] > maxSlope)
				maxSlope = slopes[i];
		}

		const heightScale = -Math.tan(2*SUN_ELEVATION)/maxSlope; // use that to normalize

		for (let i = 0; i < triangles.length; i ++) { // for each triangle
			const path = [];
			for (const node of triangles[i].vertices)
				path.push({type: 'L', args: [node.φ, node.λ]}); // put its values in a plottable form
			path.push({type: 'L', args: [...path[0].args]});
			path[0].type = 'M';
			const brightness = AMBIENT_LIGHT + (1-AMBIENT_LIGHT)*Math.max(0,
				Math.sin(SUN_ELEVATION + Math.atan(heightScale*slopes[i]))); // and use that to get a brightness
			this.map(path, svg).fill({color: '#000', opacity: 1-brightness});
		}
	}

	/**
	 * project and convert a list of SVG paths in latitude-longitude coordinates representing a series of closed paths
	 * into an SVG.Path object, and add that Path to the given SVG.
	 * @param segments ordered Iterator of segments, which each have attributes .type (str) and .args ([double])
	 * @param svg the SVG object on which to draw things
	 * @param closed if this is set to true, the map will make adjustments to account for its complete nature
	 * @returns SVG.Path object
	 */
	map(segments, svg, closed=true) {
		let jinPoints = segments;

		let loopIdx = jinPoints.length;
		let krusIdx = null;
		for (let i = jinPoints.length-1; i >= 0; i --) { // sweep through the result
			if (jinPoints[i].type === 'L') { // look for lines
				const [φ0, λ0] = jinPoints[i-1].args;
				const [φ1, λ1] = jinPoints[i].args;
				if (Math.abs(λ1 - λ0) > Math.PI) { // that cross the +/- pi border
					const φX = this.projection.getCrossing(φ0, λ0, φ1, λ1, Math.PI).φ; // estimate the place where it crosses
					const λX = (λ1 < λ0) ? Math.PI : -Math.PI;
					jinPoints.splice(i, 0,
						{type: 'L', args: [φX, λX]}, {type: 'M', args: [φX, -λX]}); // and break them up accordingly
					loopIdx += 2; // be sure to change loopIdx to keep it in sync with the array
					krusIdx = i + 1; // remember this crossing
				}
			}
			else if (jinPoints[i].type === 'M') { // look for existing breaks in the Path
				if (closed && krusIdx != null) { // if this map made a break in it, as well,
					jinPoints = jinPoints.slice(0, i)
						.concat(jinPoints.slice(krusIdx, loopIdx))
						.concat(jinPoints.slice(i+1, krusIdx))
						.concat(jinPoints.slice(loopIdx)); // then we'll want to rearrange this loop and cut out that moveto
				}
				krusIdx = null; // reset for the next loop
				loopIdx = i; // which starts now
			}
			else {
				throw "am. halow.";
			}
		}

		const cutPoints = [];
		for (const {type, args} of jinPoints) {
			const [φ, λ] = args;
			const {x, y} = this.projection.project(φ, λ); // project each point to the plane
			cutPoints.push({type: type, args: [x, y]});
		}

		for (let i = 1; i < jinPoints.length; i ++) { // sweep through the resulting polygon
			if (jinPoints[i].type === 'L') { // skipping the ones that aren't actually lines
				const [x0, y0] = cutPoints[i-1].args;
				const [x1, y1] = cutPoints[i].args;
				if (Math.hypot(x1 - x0, y1 - y0) > MAP_PRECISION) { // look for lines that are too long
					const [φ0, λ0] = jinPoints[i-1].args;
					const [φ1, λ1] = jinPoints[i].args;
					const {φ, λ} = this.projection.getMidpoint(φ0, λ0, φ1, λ1); // and split them in half
					const {x, y} = this.projection.project(φ, λ);
					jinPoints.splice(i, 0, {type: 'L', args: [φ, λ]}); // add the midpoints to the polygon
					cutPoints.splice(i, 0, {type: 'L', args: [x, y]});
					i --; // and check again
				}
			}
		}

		if (closed) { // if this path is closed, adjust for the topology of the map projection
			let λTest = null;
			let maxNordi = Number.NEGATIVE_INFINITY;
			let maxSudi = Number.POSITIVE_INFINITY;
			let enclosesNP = null;
			let enclosesSP = null;
			for (let i = 1; i < jinPoints.length; i++) {
				if (jinPoints[i].type === 'L') { // examine the lines
					const [φ0, λ0] = jinPoints[i - 1].args;
					const [φ1, λ1] = jinPoints[i].args;
					if (λTest == null)
						λTest = (λ0 + λ1) / 2; // choose a longitude (0 or pi would be easiest, but the curve doesn't always cross those)
					if (λ0 < λTest !== λ1 < λTest) { // look for segments that cross that longitude
						const φX = this.projection.getCrossing(φ0, λ0, φ1, λ1, λTest).φ;
						if (φX > maxNordi) { // the northernmost one will tell us
							maxNordi = φX;
							enclosesNP = λ1 > λ0; // if the North Pole is enclosed
						}
						if (φX < maxSudi) { // the southernmost one will tell us
							maxSudi = φX;
							enclosesSP = λ1 < λ0; // if the South Pole is enclosed
						}
					}
				}
			}
			if (enclosesNP)
				cutPoints.push(...this.projection.mapNorthPole()); // add whatever adjustments are needed to account for singularities
			if (enclosesSP)
				cutPoints.push(...this.projection.mapSouthPole());
		}

		let str = ''; // finally, put it in the <path>
		for (let i = 0; i < cutPoints.length; i ++)
			str += cutPoints[i].type + cutPoints[i].args.join(',') + ' ';
		return svg.path(str);
	}
}


/**
 * a class to manage the plotting of points from a Surface onto a plane.
 */
class MapProjection {
	constructor(surface) {
		this.surface = surface;
	}

	/**
	 * compute the coordinates of the midpoint between these two lines.
	 * @param φ0
	 * @param λ0
	 * @param φ1
	 * @param λ1
	 * @return {{φ: number, λ: number}}
	 */
	getMidpoint(φ0, λ0, φ1, λ1) {
		const pos0 = this.surface.xyz(φ0, λ0);
		const pos1 = this.surface.xyz(φ1, λ1);
		const posM = pos0.plus(pos1).over(2);
		return this.surface.φλ(posM.x, posM.y, posM.z);
	}

	/**
	 * compute the coordinates at which the line between these two points crosses the
	 * plane defined by the longitude λX.
	 * @param φ0
	 * @param λ0
	 * @param φ1
	 * @param λ1
	 * @param λX
	 * @return {{φ: number, λ: number}}
	 */
	getCrossing(φ0, λ0, φ1, λ1, λX) {
		const pos0 = this.surface.xyz(φ0, λ0-λX);
		const pos1 = this.surface.xyz(φ1, λ1-λX);
		const posX = pos0.times(pos1.x).plus(pos1.times(-pos0.x)).over(
			pos1.x - pos0.x);
		const φX = this.surface.φλ(posX.x, posX.y, posX.z).φ;
		return {φ: φX, λ: λX};
	}

	/**
	 * transform the given parametric coordinates to Cartesian ones.
	 */
	project(φ, λ) {
		throw "unimplemented";
	}

	/**
	 * generate some <path> segments to compensate for something enclosing the north pole.
	 * @return Array containing [Array of String, Array of Array]
	 */
	mapNorthPole() {
		throw "unimplemented";
	}

	/**
	 * generate some <path> segments to compensate for something enclosing the south pole.
	 * @return Array containing [Array of String, Array of Array]
	 */
	mapSouthPole() {
		throw "unimplemented";
	}
}


class Azimuthal extends MapProjection {
	constructor(surface, svg) {
		super(surface, svg);
	}

	project(φ, λ) {
		const p = linterp(φ, this.surface.refLatitudes, this.surface.cumulDistances);
		const r = 1 - p/this.surface.height;
		return {x: r*Math.sin(λ), y: r*Math.cos(λ)};
	}

	mapNorthPole() {
		return [];
	}

	mapSouthPole() {
		return [
			{type: 'M', args: [0, -1]},
			{type: 'A', args: [1, 1, 0, 1, 0, 0, 1]},
			{type: 'A', args: [1, 1, 0, 1, 0, 0, -1]}];
	}
}
