/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

// English - root strings

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    //General Stuff
    "NAME": "Name",
    "VERSION": "Version",
    "SUMMARY": "Summary",
    "GENERAL_SETTINGS": "General Settings",


    // Extension
    "EXTENSION_NAME"    :   "elm-brackets",
    "EXTENSION_PREFS"   :   "tommot348.elm-brackets",
    
    //PANEL
    // General
    "SHOW_PANEL"        :   "Show Panel",
    "PANEL_HEADER"      :   "Elm related output",

    // Build Panel
    "CLEAR"             :   "Clear",
    "BUILD"             :   "Build",
    "FORMAT"            :   "Format",
    "PKG_INSTALL"       :   "Pkg install",

    // hover over buttons
    "CLEAR_HOVER"       :   "Clear panel",
    "BUILD_HOVER"       :   "Build current file",
    "FORMAT_HOVER"      :   "Format current file",
    "PKG_INSTALL_HOVER" :   "Install all dependencies for current file",
    "PREFERENCES_HOVER" :   "Open settings dialog",
    "PROJECT_DIALOG_HOVER" :   "Open Project Settings Dialog",
    "REPL_HOVER"        :   "Open/Close REPL",
    
    // Status
    "STATUSBAR_NAME"    :   "Elm Build Status",
    "INACTIVE"          :   "Inactive",
    "INACTIVE_MSG"      :   "No Build",
    "PROGRESS"          :   "Progressing",
    
    //REPL
    "SHOW_REPL_PANEL"        :   "Show REPL Panel",
    "REPL_PANEL_HEADER"      :   "elm-repl output",

    //SETTINGS DIALOG
    //General
    "SHOW_PREFERENCES_DIALOG":  "Show settings dialog",

    //UI ELEMENTS
    "PREFERENCES_DIALOG_HEADER" : "Elm settings",
    "PATHORCUSTOM" : "Use PATH or custom paths to the binaries?",
    "ELMBINARY" : "path to elm binaries",
    "ELMFORMAT" : "path to elm-format binary",
    "ELMORACLE" : "path to elm-oracle binary",
    "CUSTOM_PATHS": "Custom paths",
    "ELM_MAKE_OPTIONS": "elm-make options",
    "BUILDOUT": "output file name (default=\"index.html\", .js will turn output into javascript)",
    "DOCSOUT": "docs output file (default=\"[filename]-docs.js\")",
    "YTA": "yes to all",
    "YTAMESSAGE": "(unchecking this will cause build to fail if the dependencies are not installed via elm-package)",
    "WARNINGS": "show warnings?",
    "ELM_FORMAT_OPTIONS": "elm-format options",
    "FORMATOUT": "output file (default: [name of formatted file])",

    //Project Dialog
    "SHOW_PROJECT_DIALOG":  "Show Project Dialog",
    "PROJECT_DIALOG_HEADER": "elm project",
    "PROJECT_DIALOG_DEPENDENCIES": "Dependecies",
    "ELM_CHOOSE_DIALOG": "Please choose elm-package.json",

    //Multi Purpose UI elements
    //BUTTONS
    "BUTTON_CLOSE"      :   "Close",
    "BUTTON_SAVE"      :   "Save",
    "BUTTON_BROWSE": "browse",
    "BUTTON_REMOVE": "remove",
    "BUTTON_INSTALL": "install"
});
