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
import {Random} from "../util/random.js";
import {Fon} from "./sound.js";
import {DEFAULT_ACENTE, Proces, PROCES_CHUZABLE} from "./process.js";
import {ipa} from "./script.js";
import {Word} from "./word.js";
import {Enumify} from "../lib/enumify.js";


const DEVIATION_TIME = 2; // TODO: replace this with a number of sound changes


/**
 * different types of nym
 */
export class LogaTipo extends Enumify {
	public readonly index: number;
	public readonly numClassifiers: number;

	static JAN = new LogaTipo(0, 0);
	static FAMILI = new LogaTipo(1, 12);
	static SITI = new LogaTipo(2, 6);
	static BASHA = new LogaTipo(3, 1);
	static DESHA = new LogaTipo(4, 3);
	static NAS = new LogaTipo(5, 1);
	static _ = LogaTipo.closeEnum();

	constructor(index: number, numClassifiers: number) {
		super();
		this.index = index;
		this.numClassifiers = numClassifiers;
	}
}

/**
 * a collection of similar words.
 */
export abstract class Lect {
	public readonly defaultStyle: string; // this language's preferd romanization style
	public readonly rightBranching: boolean; // whether this language prefers prefixen
	public macrolanguage: Lect; // the proto-language for the set of lects intelligible to this one

	protected constructor(defaultStyle: string, rightBranching: boolean) {
		this.defaultStyle = defaultStyle;
		this.rightBranching = rightBranching;
	}

	/**
	 * get a name from this language. the style of name and valid indices depend on the WordType:
	 * @param i the index of the name
	 * @param tipo the type of name
	 */
	abstract getName(i: number, tipo: LogaTipo): Word;

	/**
	 * get the language that this was n timesteps ago
	 * @param n the number of steps backward, in centuries.
	 */
	abstract getAncestor(n: number): Lect;

	/**
	 * is this language actually a dialect of lang?
	 * @param lang
	 */
	isIntelligible(lang: Lect): boolean {
		return this.macrolanguage === lang.macrolanguage;
	}
}

export class ProtoLang extends Lect {
	private static VOWELS = ipa("aiueoɜɛɔyø");
	private static CONSON = ipa("mnptksljwhfbdɡrzŋʃʔxqvɣθʙ");
	private static MEDIAL = ipa("ljwr");
	private static R_INDEX = ProtoLang.CONSON.indexOf(ipa("r")[0]); // note the index of r, because it's phonotactically important

	private static P_ONSET = 0.8;
	private static P_MEDIAL = 0.4;
	private static P_NUCLEUS = 1.5;
	private static P_CODA = 0.4;

	private readonly rng: Random; // this language's personal rng generator
	private readonly diversity: number; // the typical number of lexical suffixes used for one type of word
	private readonly nConson: number; // the number of consonants in this language
	private readonly nVowel: number; // the number of vowels in this langugage
	private readonly nMedial: number; // the numer of medials in this language
	private readonly complexity: number; // the approximate amount of information in one syllable
	private readonly name: Map<LogaTipo, Map<number, Word>>; // the word references of each type
	private readonly classifiers: Map<LogaTipo, Fon[][]>; // the noun classifiers
	private readonly fin: Fon[][]; // the noun endings

	constructor(rng: Random) {
		super(
			rng.discrete(0, 4).toString(),
			rng.probability(0.2));
		this.macrolanguage = this;

		this.rng = rng;
		this.nConson = 7 + rng.binomial(18, .5); // choose how many consonants the protolanguage will have
		this.nVowel = 5 + rng.binomial(5, .1); // choose how many nuclei it will have
		this.nMedial = (this.nConson > ProtoLang.R_INDEX) ? 4 : 0;
		this.complexity = 2*Math.log10(1 + this.nConson)
			+ Math.log10(1 + this.nMedial) + Math.log10(1 + this.nVowel);

		this.fin = [];
		for (let i = 0; i < rng.discrete(0, 6); i ++) // choose how much basic suffixing to do
			this.fin.push(this.noveMul(-i-1, 0.5));

		this.diversity = rng.uniform(0, 1); // choose how much lexical suffixing to do
		this.name = new Map<LogaTipo, Map<number, Word>>();
		this.classifiers = new Map<LogaTipo, Fon[][]>();
		let j = -this.fin.length - 1;
		for (const wordType of LogaTipo) {
			this.name.set(<LogaTipo>wordType, new Map<number, Word>());
			this.classifiers.set(<LogaTipo>wordType, []);
			for (let i = 0; i < Math.round(this.diversity*(<LogaTipo>wordType).numClassifiers); i ++) // TODO countries can be named after cities
				this.classifiers.get(<LogaTipo>wordType).push(this.noveLoga(j --, 1.5/this.complexity));
		}
		if (this.diversity > 0.4 && rng.probability(.5))
			this.classifiers.get(LogaTipo.DESHA)[0] = ipa("ia"); // this is sometimes here
	}

	/**
	 * create a new noun frase to describe a person, country, city, etc.
	 * @param index the pseudorandom seed for this word
	 * @param tipo the type of noun classifier this will have attachd
	 */
	getName(index: number, tipo: LogaTipo): Word {
		if (!this.name.get(tipo).has(index)) {
			const base = this.noveLoga(
				index + 1000*tipo.index,
				4/this.complexity); // get the base

			let name;
			if (this.classifiers.get(tipo).length === 0)
				name = base;
			else {
				const classifier = this.rng.choice(this.classifiers.get(tipo));
				if (this.rightBranching)
					name = classifier.concat([Fon.PAUSE], base);
				else
					name = base.concat([Fon.PAUSE], classifier);
			}

			this.name.get(tipo).set(index,
				DEFAULT_ACENTE.apply(new Word(name, this)));
		}
		return this.name.get(tipo).get(index);
	}

	/**
	 * generate a new random word, including a gender affix
	 * @param index the pseudorandom seed for this root
	 * @param syllables the number of syllables in the root
	 */
	noveLoga(index: number, syllables: number): Fon[] {
		const base = this.noveMul(index, syllables);
		if (this.fin.length === 0)
			return base;
		else {
			const affix = this.rng.choice(this.fin); // TODO: use index to make this more pseudoly random
			if (this.rightBranching)
				return affix.concat(base);
			else
				return base.concat(affix);
		}
	}

	/**
	 * generate a new random word root
	 * @param index the pseudorandom seed for this root
	 * @param syllables the number of syllables in this root
	 */
	noveMul(index: number, syllables: number): Fon[] {
		const syllableNumber = Math.ceil(syllables);
		const syllableSize = syllables/syllableNumber;
		let mul = [];
		for (let i = 0; i < syllableNumber; i++) {
			if (this.rng.probability(ProtoLang.P_ONSET*syllableSize)) // TODO use the index to make this more pseudoly random
				mul.push(this.rng.choice(ProtoLang.CONSON.slice(0, this.nConson)));
			if (this.nMedial > 0 && this.rng.probability(ProtoLang.P_MEDIAL*syllableSize))
				mul.push(this.rng.choice(ProtoLang.MEDIAL.slice(0, this.nMedial)));
			if (this.rng.probability(ProtoLang.P_NUCLEUS*syllableSize))
				mul.push(this.rng.choice(ProtoLang.VOWELS.slice(0, this.nVowel)));
			if (this.rng.probability(ProtoLang.P_CODA*syllableSize))
				mul.push(this.rng.choice(ProtoLang.CONSON.slice(0, this.nConson)));
		}
		return mul;
	}

	getAncestor(n: number): Lect {
		return this;
	}

	isIntelligible(lang: Lect): boolean {
		return this === lang;
	}
}

export class Dialect extends Lect {
	private readonly parent: Lect;
	private readonly changes: Proces[];

	constructor(parent: Lect, rng: Random) {
		super(parent.defaultStyle, parent.rightBranching);
		this.parent = parent;
		this.macrolanguage = this.getAncestor(DEVIATION_TIME);

		this.changes = [];
		for (const {chanse, proces} of PROCES_CHUZABLE)
			if (rng.probability(chanse))
				this.changes.push(proces);
	}

	getName(i: number, tipo: LogaTipo) {
		return this.applyChanges(this.parent.getName(i, tipo));
	}

	applyChanges(lekse: Word): Word {
		for (const change of this.changes)
			lekse = change.apply(lekse);
		return lekse;
	}

	getAncestor(n: number): Lect {
		if (n <= 0)
			return this;
		else
			return this.parent.getAncestor(n - 1);
	}
}
