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
        build = require("../config/IDs").BUILD_ID,
        elmPackageJson = require("./elm-package-json"); // package-style naming to avoid collisions

    function handleBuild() {
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            var curOpenDir = elmPackageJson.getElmPackagePath(),
                curOpenFile = DocumentManager.getCurrentDocument().file._path;
            CommandManager.execute("file.saveAll");
            curOpenDir.done(function (path) {
                ElmDomain.exec("build",
                    curOpenFile,
                    path,
                    brackets.platform === "win",
                    preferences.get("elmBinary"),
                    preferences.get("usePathOrCustom") === "path",
                    preferences.get("buildyes"),
                    path + (preferences.get("buildout") === "" ? "index.html" : preferences.get("buildout")),
                    preferences.get("warn"));
            });

        }
    }

    CommandManager.register("elm-make current file", build, handleBuild);
    exports.command_id = build;
});
