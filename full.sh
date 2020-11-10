cat \
  CONTENTS.md \
  INTRO.md \
  FUNCTIONAL-PROGRAMMING-MUTABLE-VUE.md \
  | pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o design_patterns_for_vuejs.pdf 
