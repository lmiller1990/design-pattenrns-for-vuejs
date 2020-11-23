cat \
  src/pdf/CONTENTS.md \
  src/pdf/ABOUT.md \
  src/pdf/INTRO.md \
  src/pdf/PROPS.md \
  src/pdf/EVENTS.md \
  src/pdf/FORMS.md \
  src/pdf/API-REQUESTS.md \
  src/pdf/RENDERLESS-COMPONENTS.md \
  src/pdf/RENDER-FUNCTIONS.md \
  src/pdf/PROVIDE-INJECT.md \
  src/pdf/TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
  src/pdf/GROUPING-FEATURES-WITH-COMPOSABLES.md \
  src/pdf/FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md \
  | pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o build/design_patterns_for_vuejs.pdf 
