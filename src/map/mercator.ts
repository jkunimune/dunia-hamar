/**
 * MIT License
 *
 * Copyright (c) 2021 Justin Kunimune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {Surface} from "../planet/surface.js";
import {MapProjection} from "./projection.js";
import {linterp} from "../util/util.js";
import {PathSegment, Place, Point} from "../util/coordinates.js";

/**
 * a cylindrical projection that makes loxodromes appear as straight lines.
 */
export class Mercator extends MapProjection {
	private static readonly ASPECT: number = Math.sqrt(2);
	private readonly dxdλ: number;
	private readonly фRef: number[];
	private readonly yRef: number[];

	constructor(surface: Surface, northUp: boolean, locus: PathSegment[]) {
		super(surface, northUp, locus, null, null, null, null);

		// find the surface's widest point to set the scale
		const width = Math.max(
			surface.dAds(surface.фMin), surface.dAds(surface.фMax),
			surface.dAds((surface.фMin + surface.фMax)/2));

		this.фRef = surface.refLatitudes;
		this.yRef = [0];
		for (let i = 1; i < this.фRef.length; i ++) {
			const dф = this.фRef[i] - this.фRef[i-1];
			const dsdф = surface.dsdф((this.фRef[i-1] + this.фRef[i])/2);
			const dAds = surface.dAds((this.фRef[i-1] + this.фRef[i])/2);
			this.yRef.push(this.yRef[i-1] - width*dsdф*dф/dAds);
		}

		let bottom = this.yRef[0];
		let top = this.yRef[this.yRef.length-1];
		if (surface.dAds(surface.фMin) > surface.dAds(surface.фMax)) // if the South Pole is thicker than the North
			top = Math.max(top, bottom - width/Mercator.ASPECT); // crop the top to get the correct aspect ratio
		else if (surface.dAds(surface.фMin) < surface.dAds(surface.фMax)) // if the North Pole is thicker
			 bottom = Math.min(bottom, top + width/Mercator.ASPECT); // crop the bottom to make correct
		else { // if they are equally important
			const excess = Math.max(0, bottom - top - width/Mercator.ASPECT);
			top = top + excess/2; // crop both
			bottom = bottom - excess/2;
		}
		this.setDimensions(-width/2, width/2, top, bottom);

		this.dxdλ = width/(2*Math.PI);
	}

	projectPoint(point: Place): Point {
		return {x: this.dxdλ*point.λ, y: linterp(point.ф, this.фRef, this.yRef)};
	}
}
