cat \
  src/epub/ABOUT.md \
  src/epub/INTRO.md \
  src/epub/PROPS.md \
  src/epub/EVENTS.md \
  src/epub/FORMS.md \
  src/epub/API-REQUESTS.md \
  src/epub/RENDERLESS-COMPONENTS.md \
  src/epub/RENDER-FUNCTIONS.md \
  src/epub/PROVIDE-INJECT.md \
  src/epub/TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
  src/epub/GROUPING-FEATURES-WITH-COMPOSABLES.md \
  src/epub/FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md \
  | pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  --number-sections \
  --toc \
  --metadata title="Design Patterns for Vue.js" \
  --metadata author="Lachlan Miller" \
  --epub-cover-image ./assets/covers/Vue.js_cover.png \
  -o design_patterns_for_vuejs.epub 
