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
        repl = require("../config/IDs").REPL_ID,
        elmPackageJson = require("./elm-package-json");
    function _sendToREPL(cwd, data, result) {
        ElmDomain.exec("sendToRepl",
                        cwd,
                        preferences.get("elmBinary"),
                        preferences.get("usePathOrCustom") === "path",
                        data)
            .done(function (proc) {
                result.resolve(proc);
            })
            .fail(function (err) {
                result.reject(err);
            });
    }
    function sendToREPL(data) {
        var result = $.Deferred();

        elmPackageJson.getElmPackagePath()
            .done(function (path) {
                _sendToREPL(path, data, result);
            })
            .fail(function (err) {
                var path = DocumentManager.getCurrentDocument().parent._path;
                _sendToREPL(path, data, result);
            });

        return result;
    }
    CommandManager.register("get elm repl", repl, sendToREPL);
    exports.command_id = repl;
});
