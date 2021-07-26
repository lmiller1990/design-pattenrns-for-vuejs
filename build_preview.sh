cat \
  src/pdf/CONTENTS.md \
  src/pdf/ABOUT.md \
  src/pdf/INTRO.md \
  src/pdf/FORMS.md \
  src/pdf/RENDERLESS-COMPONENTS.md \
  | pandoc \
  --highlight-style tango \
  --pdf-engine xelatex \
  -o build/preview.pdf 
