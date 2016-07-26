elm-brackets
============

Elm support for brackets.  

Currently support:  
- Syntax highlight(may need some work)
- Simple file build with output panel (fetches all dependencies)
- Jump to error on click in build output / lint output
- Quasilint (compiler output is used as lint)(does not fetch dependencies)
- dependency install (via elm-package install)
- elm-format support (see notes below roadmap)

Roadmap:  
- elm-oracle support
- Package Manager
- Preferences (configurable binary path, "build/format on save" option, etc)

elm binaries have to be in PATH for this to work (see notes)  

Notes:
Installation of elm binaries:
- if you have npm and nodejs installed:
    - local : npm install elm
    - global: npm install -g elm
    If you do a global installation on linux/mac(/windows?) you're most likely done.  
    If you do a local installation you will have to add the binary path to your "PATH"  
- For windows and mac there are installers availiable on [elm-lang.org/install](http://elm-lang.org/install)  

elm-format installation:  
- Download [elm-format](https://github.com/avh4/elm-format) 
- extract and add location to PATH

elm-oracle installation:  
- local : npm install elm-oracle
- global: npm install -g elm-oracle
If you do a global installation on linux/mac(/windows?) you're most likely done.  
If you do a local installation you will have to add the binary path to your "PATH"  

Setting your PATH  
- mac: edit /etc/launchd.conf
- linux: edit /etc/environment
- windows: on the commandline: setx path "%path%;[path to elm binaries]"
    