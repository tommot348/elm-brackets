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
        build = require("../config/IDs").BUILD_ID; // package-style naming to avoid collisions

    function handleBuild() {
        var curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path;
        CommandManager.execute("file.saveAll");
        ElmDomain.exec("build",
            curOpenFile,
            curOpenDir,
            brackets.platform === "win");
    }

    CommandManager.register("elm-make current file", build, handleBuild);
    exports.command_id = build;
});
