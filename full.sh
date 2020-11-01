cat \
  CONTENTS.md \
  INTRO.md \
  FORMS.md \
  RENDERLESS-COMPONENTS.md \
  PROPS.md \
  EVENTS.md \
  TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
  GROUPING-FEATURES-WITH-COMPOSABLES.md \
  FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md | \
  pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o design_patterns_for_vuejs.pdf 
