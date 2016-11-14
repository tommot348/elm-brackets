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
        command = require("../config/IDs").FORMAT_ID; // package-style naming to avoid collisions

    function handleFormat() {
        var result = $.Deferred();
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            var curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
                curOpenFile = DocumentManager.getCurrentDocument().file._path;

            (ElmDomain.exec("format",
                curOpenFile,
                curOpenDir,
                preferences.get("elm-formatBinary"),
                preferences.get("usePathOrCustom") === "path",
                preferences.get("formatout"),
                preferences.get("formatyes")))
                .done(function (data) {
                    result.resolve(data);
                })
                .fail(function (data) {
                    result.reject(data);
                });
        }
        return result.promise();
    }

    CommandManager.register("elm-format current-file", command, handleFormat);
    exports.command_id = command;
});
