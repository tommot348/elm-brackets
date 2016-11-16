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
        command = require("../config/IDs").PKG_INSTALL_ID,
        elmPackageJson = require("./elm-package-json"); // package-style naming to avoid collisions
    function exec(path, pkg, result) {
        (ElmDomain.exec("pkg_install",
            pkg,
            path,
            preferences.get("elmBinary"),
            preferences.get("usePathOrCustom") === "path"))
            .done(function (data) {
                result.resolve(data);
            })
            .fail(function (data) {
                result.reject(data);
            });
    }
    function handlePkg_install(pkg) {
        var result = $.Deferred();
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            var curOpenDir = elmPackageJson.getElmPackagePath(),
                curOpenFile = DocumentManager.getCurrentDocument().file._path;
            pkg = pkg || "";
            CommandManager.execute("file.saveAll");

            curOpenDir.done(function (path) {
                exec(path, pkg, result);
            }).fail(function (err) {
                console.log(err);
                var path = DocumentManager.getCurrentDocument().parent._path;
                exec(path, pkg, result);
            });
        }
        return result.promise();
    }

    CommandManager.register("elm-package install", command, handlePkg_install);
    exports.command_id = command;
});
