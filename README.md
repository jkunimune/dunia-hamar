# Dunier – fantasy map generator

Dunier is a tool being designed to help world builders build more and more realistic
worlds. Sometimes you need a world, but don't want to painstakingly build every
aspect of it yourself. Maybe you're running an RPG campaign and just need a
believable setting for your plot. Maybe you're a world builder who's more interested
in culture and magic than in locations and names. Then Dunier is the tool for
you.

Not just a map generator, Dunier also gives you an info sheet on each country,
a list of names in each language, and a 3&thinsp;000 year history of conquest,
division, and advancement across the world.

Dunier is inspired by previous fantasy map generators like
[Azgaar's one](https://azgaar.github.io/Fantasy-Map-Generator), but has more of an emphasis
on realism. It is not as interactive as some generators, and it does not generate as
many fine details like mine locations and diplomatic relations. It does, however,
account for several features missing in other generators that are noticeable on the
macroscopic scale, such as planetary curvature, plate tectonics, and linguistic
drift.

## Contents

This repository contains the following files and directories, among others.

- `README.md` – this file!
- `LICENSE.txt` – legal details of the CC0 1.0 universal public domain dedication
- `package.json` – instructions for Node to set up TypeScript and Jest
- `tsconfig.json` – instructions for TypeScript to compile the code
- `source/` – the TypeScript source code
  - `gui/` – source files that interact directly with the user interface
  - `surface/` – source files related to the geometry and topology of planetary surfaces
  - `generation/` – source files related to terrain and society generation
  - `language/` – source files related to constructing languages
  - `map/` – source files related to graphical representation of geographic data
  - `datastructures/` – some simple data structure classes
  - `utilities/` – other low-level utilities that I had to write
  - `libraries/` – low-level utilities that were not written by me
  - `python/` – some auxiliary Python scripts, to generate resources and such
- `templates/` – the untranslated HTML files from which the localized ones are built
- `resources/` – all other files used by the webpage at runtime
  - `style.css` – the main stylesheet
  - `processes.txt` – the list of phonological changes languages can undergo
  - `alphabet.tsv` – the table of graphemes defining the different transcription styles
  - `rules_english.tsv` – the list of special rules needed for the "English" transcription style
  - `culture.tsv` – the specification of how to construct and describe fictional cultures
  - `tech_tree.txt` – a list of technologies and dates used to qualitatively describe technological advancement
  - `translations/` – the lists of translated GUI strings used to build the localized HTML
  - `images/` – all images used in the webpage (mostly flags for the language selector)
  - `fonts/` – the fonts used in the generated PDFs
- `tests/` – the Jest test scripts

You'll note that the HTML files are absent.
These, like the JavaScript files, must be built.
To find out how, read on!

## Compiling the code

This webapp is based on static HTML files that load in compiled TypeScript files.
If you want to host your own fork of it, you'll need to compile the TypeScript.
You can install the TypeScript compiler with Node; I still don't really understand how Node works,
but I think all the information you need regarding Node dependencies is in `package.json`.
Once you have that, you should be able to just go to the root directory and call
~~~bash
tsc
~~~

If you want to run the tests, you'll need Jest, which can also be installed with Node.
Once you've got that done, you should be able to just call
~~~bash
npm test
~~~

The HTML files are all autogenerated from the templates in `templates/` and the translation files in `resources/translations/`.
If you edit either of those, you can update the HTML by installing Python 3 and calling
~~~bash
python source/python/build_html.py
~~~

The JavaScript has some dependencies, but I just put them all in the Git repository
(I had to manually modify some of them to work so it seemed the safest option)
so you shouldn't have to think about them.
You will need to install Bootstrap.
Download the [compiled Bootstrap CSS and JavaScript](https://getbootstrap.com/docs/4.6/getting-started/download/)
(version 4.5 or 4.6 or so), and put the whole folder in `resources/`,
and rename it to `bootstrap-4.6.2-dist` if it's not already named that.

## Credits

This project draws heavy inspiration from
Azgaar's [Fantasy Map Generator](https://azgaar.github.io/Fantasy-Map-Generator/).

The slick aesthetic comes courtesy of
[Bootstrap](https://getbootstrap.com/) and [HatScripts' circular flag collection](https://github.com/HatScripts/circle-flags).

External source libraries used by Dunier include
Vladimir Agaforkin's [Tinyqueue](https://github.com/mourner/tinyqueue),
Stefan Haack's [Bootstrap Input Spinner](https://github.com/shaack/bootstrap-input-spinner),
Axel Rauschmayer's [Enumify](https://2ality.com/2020/01/enum-pattern.html), and
James Hall's and yWorks GmbH's [JSPDF](https://parall.ax/products/jspdf), as well as
[Popper](https://popper.js.org/docs/v2/),
[Plotly](https://plotly.com/), and
[JQuery](https://jquery.com/),
all of which are released under the MIT license by their respective authors.

## License

Dunier by Justin Kunimune is marked as dedicated to the public domain via
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0).
You may copy, modify, and distribute it, even for commercial purposes, all without asking permission.
I make no warranties about Dunier, and disclaim liability for all uses of it,
to the fullest extent permitted by applicable law.
When using or citing Dunier, you should not imply endorsement by me.
