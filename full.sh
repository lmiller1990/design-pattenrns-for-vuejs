cat \
  CONTENTS.md \
  INTRO.md \
  FORMS.md \
  PROPS.md \
  EVENTS.md \
  RENDERLESS-COMPONENTS.md \
  RENDER-FUNCTIONS.md \
  PROVIDE-INJECT.md \
  TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
  GROUPING-FEATURES-WITH-COMPOSABLES.md \
  FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md \
  | pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o design_patterns_for_vuejs.pdf 
