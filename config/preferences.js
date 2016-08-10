/*global brackets,define,$*/
"use strict";
define(function (require, exports, module) {
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        ExtensionStrings = require("../config/Strings"),
        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS);
    preferences.definePreference("showPanel", "boolean", false);
    preferences.definePreference("usePathOrCustom", "string", "path");
    preferences.definePreference("elmBinary", "string", "");
    preferences.definePreference("elm-formatBinary", "string", "");
    preferences.definePreference("elm-oracleBinary", "string", "");
    preferences.definePreference("buildout", "string", "");
    preferences.definePreference("docsoutputfile", "string", "");
    preferences.definePreference("formatout", "string", "");
    preferences.definePreference("buildyes", "boolean", true);
    preferences.definePreference("warn", "boolean", false);
    preferences.definePreference("formatyes", "boolean", true);
});
