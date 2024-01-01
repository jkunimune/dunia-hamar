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
import "../lib/jquery.min.js";
import {Random} from "../util/random.js";
import {Dialect, Lect, ProtoLang, LogaTipo} from "../language/lect.js";
import {DOM} from "../util/document.js";


const NUM_ROWS = 12;

let seed = 0; // TODO the actual version should use the current time.

/**
 * Generate the planet and its mean temperature (not yet accounting for altitude)
 */
DOM.elm('nam-apply').addEventListener('click', () => { // TODO: back button
	console.log("jena nam...");

	const rng = new Random(seed);
	let bax: Lect = new ProtoLang(rng);
	for (let i = 0; i < 30; i ++)
		bax = new Dialect(bax, rng);

	const type = rng.probability(.5) ? 1 : rng.probability(.33) ? 0 : -1;

	let firstSeed = 0, lastSeed = 0;
	for (const namliste of [DOM.elm('nam-liste-1'), DOM.elm('nam-liste-2')]) {
		namliste.textContent = '';
		for (let i = 0; i < NUM_ROWS; i++) {
			const jannam = bax.getName(`firstname${firstSeed}`, LogaTipo.ALO);
			const familnam = bax.getName(`lastname${lastSeed}`, LogaTipo.FAMILI);
			let holnam;
			if (type === 1)
				holnam = `${jannam} ${familnam}`;
			else if (type === 0)
				holnam = `${jannam}`;
			else
				holnam = `${familnam} ${jannam}`;
			
			const listem = document.createElement('li'); // start by creating the text element
			listem.setAttribute('class', 'list-group-item');
			listem.textContent = holnam;
			namliste.append(listem);

			firstSeed += 1;
			if (rng.probability(0.5)) lastSeed += 1;
		}
	}

	seed += 1;

	console.log("fina!");
});


/**
 * Once the page is ready, start the algorithm!
 */
document.addEventListener("DOMContentLoaded", () => {
	console.log("ready!");
	(DOM.elm('nam-apply') as HTMLElement).click();
});
