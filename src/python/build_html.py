import json
import os
import re

LANGUAGES = ['en', 'es', 'jp', 'pd']
DEFAULT_LANGUAGE = 'pd'

# load the base
with open(f'../../res/templates/base.html', 'r', encoding='utf8') as base_file:
	base = base_file.read()

# iterate thru all non-base templates in the folder
for filename in os.listdir('../../res/templates/'):
	if filename == "base.html" or not filename.endswith(".html"):
		continue
	filename = filename[:-5]

	print(f"{filename}")
	# iterate thru the languages
	for lang_code in LANGUAGES:
		# load the template and insert it into the base
		print(f"  {lang_code}")
		with open(f'../../res/templates/{filename}.html', 'r', encoding='utf8') as page_file:
			page = base.replace('{Content}', page_file.read())

		# replace the special key
		page = page.replace(f'{{.name}}', filename)

		# replace the basic keys
		with open(f'../../res/tarje/{lang_code}.json', 'r', encoding='utf8') as lang_file:
			lang = json.load(lang_file)
		for key, value in lang.items():
			page = page.replace(f'{{{key}}}', value)
		remaining_keys = re.search(r'{([a-zA-Z0-9-.]+)}', page)
		if remaining_keys:
			raise KeyError(f"no jana cabe '{remaining_keys.group(1)}'!")

		# resolve any if-statements
		page = re.sub(fr'{{If"{filename}"([^}}]*)}}', '\\1', page)
		page = re.sub(fr'{{If"[^"]*"[^}}]*}}', '', page)

		# save the result
		with open(f'../../{lang_code}/{filename}.html', 'w', encoding='utf8') as page_file:
			page_file.write(page)
		if lang_code == DEFAULT_LANGUAGE:
			with open(f'../../{filename}.html', 'w', encoding='utf8') as page_file:
				page_file.write(page)

print("fini!")
