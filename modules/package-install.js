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
        command = require("../config/IDs").PKG_INSTALL_ID; // package-style naming to avoid collisions

    function handlePkg_install(pkg) {
        var curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path;
        pkg = pkg || "";
        CommandManager.execute("file.saveAll");
        ElmDomain.exec("pkg_install",
            pkg,
            curOpenDir,
            brackets.platform === "win",
            preferences);
    }

    CommandManager.register("elm-package install", command, handlePkg_install);
    exports.command_id = command;
});
