# pandoc \
#   INTRO.md \
#   FORMS.md \
#   PROPS.md \
#   GROUPING-FEATURES-WITH-COMPOSABLES.md \
#   EVENTS.md \
#   RENDERLESS-COMPONENTS.md \
#   TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
#   FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md \
# -o design_patterns_for_vuejs.pdf --highlight-style tango

cat \
  CONTENTS.md \
  INTRO.md \
  FORMS.md \
  PROPS.md \
  GROUPING-FEATURES-WITH-COMPOSABLES.md \
  EVENTS.md \
  RENDERLESS-COMPONENTS.md \
  TRULY-MODULAR-COMPONENTS-WITH-V-MODEL.md \
  FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md | \
  pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o design_patterns_for_vuejs.pdf 
