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
        LiveDevelopment = brackets.getModule('LiveDevelopment/LiveDevelopment'),
        Inspector = brackets.getModule('LiveDevelopment/Inspector/Inspector'),
        ExtensionStrings = require("../config/Strings"),
        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),
        build = require("../config/IDs").BUILD_ID,
        elmPackageJson = require("./elm-package-json"); // package-style naming to avoid collisions

    function handleBuild() {
        var result = $.Deferred();
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            var curOpenDir = elmPackageJson.getElmPackagePath(),
                curOpenFile = DocumentManager.getCurrentDocument().file._path;
            CommandManager.execute("file.saveAll");
            curOpenDir.done(function (path) {
                var execResult = ElmDomain.exec("build",
                    curOpenFile,
                    path,
                    preferences.get("elmBinary"),
                    preferences.get("usePathOrCustom") === "path",
                    preferences.get("buildyes"),
                    path + (preferences.get("buildout") === "" ? "index.html" : preferences.get("buildout")),
                    preferences.get("warn"));
                $.when(execResult)
                    .done(function (data) {
                        setTimeout(Inspector.Page.reload, 200);
                        result.resolve(data);
                    })
                    .fail(function (err) {
                        console.log("build failed " + err);
                        result.reject(err);
                    });
            });
        }
        return result.promise();
    }

    CommandManager.register("elm-make current file", build, handleBuild);
    exports.command_id = build;
});
