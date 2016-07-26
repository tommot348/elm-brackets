/*global define,$,brackets*/
define(function (require, exports, module) {
    "use strict";
    var CodeInspection = brackets.getModule('language/CodeInspection'),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "../node/elmDomain")),
        LINTER_NAME = "elmLint";

    function lint() {
        var response = new $.Deferred(),
            result = {errors : []},
            curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path,
            buffer = "";
        ElmDomain.exec("lint",
            curOpenFile,
            curOpenDir,
            brackets.platform === "win");
        $(ElmDomain).on("lintout", function (evt, data) {
            buffer += data;
        });

        /*$(ElmDomain).on("linterr", function (evt, data) {
            buffer += data;
        });*/

        $(ElmDomain).on("lintfinished", function (evt, data) {
            console.log("lint finished " + buffer);
            var error = buffer.substr(buffer.indexOf("["), buffer.lastIndexOf("]") + 1),
                message = buffer.substr(buffer.lastIndexOf("]") + 1, buffer.length - error.length).trim(),
                errors = "";
            if (error.length) {
                //console.log ( error );
                try {
                    errors = JSON.parse(error);
                    errors.forEach(function (elem) {
                        result.errors.push({
                            pos: {
                                line: elem.region.start.line - 1,
                                ch: elem.region.start.column - 1
                            },
                            message: elem.tag +
                                "\n" +
                                elem.overview +
                                "\n" +
                                elem.details,
                            type: elem.type === "error" ? CodeInspection.Type.ERROR : CodeInspection.Type.WARNING
                        });
                    });
                } catch (ex) {
                    console.log(ex + " " + error);
                }

            }
            $(ElmDomain).off("lintout");
            $(ElmDomain).off("linterr");
            $(ElmDomain).off("lintfinished");
            response.resolve(result);
            buffer = "";

        });
        return response.promise();
    }
    CodeInspection.register("elm", {
        name: LINTER_NAME,
        scanFileAsync: lint
    });
});
