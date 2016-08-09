/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "../node/elmDomain")),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        ExtensionStrings = require("../config/Strings"),
        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),
        build = require("../config/IDs").BUILD_ID; // package-style naming to avoid collisions

    function handleBuild() {
        var curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path,
            myPrefs={};
        myPrefs.usePathOrCustom=preferences.get("usePathOrCustom");
        myPrefs.buildyes=preferences.get("buildyes");
        myPrefs.elmBinary=preferences.get("elmBinary");
        myPrefs.buildout=preferences.get("buildout");
        CommandManager.execute("file.saveAll");
        console.log("bla");
        ElmDomain.exec("build",
            curOpenFile,
            curOpenDir,
            brackets.platform === "win",
            myPrefs);
    }

    CommandManager.register("elm-make current file", build, handleBuild);
    exports.command_id = build;
});
