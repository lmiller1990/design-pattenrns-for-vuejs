cat \
  CONTENTS.md \
  INTRO.md \
  PROVIDE-INJECT.md  \
  | pandoc \
  --highlight-style tango \
  --pdf-engine pdflatex \
  -o design_patterns_for_vuejs.pdf 
