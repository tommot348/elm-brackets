/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem"),

        ExtensionStrings = require("../config/Strings");

    function openChooseDialog(ret, deferred) {
        var template = require("text!../html/chooseElmPackage.html"),
            files = ret.map(function (e, i) {
                return {
                    file: e._path,
                    index: i
                };
            }),
            compiledTemplate = Mustache.render(template, {
                S: ExtensionStrings,
                files: files
            }),
            chtml = $(compiledTemplate);

        var chooseDialog = DialogManager.showModalDialogUsingTemplate(chtml, false);
        $(".dialog-button", chtml).click(function () {
            console.log("close choose");
            var file = $("select", chtml).val();
            console.log(file);
            chooseDialog.close();
            fs.getFileForPath(ProjectManager.getProjectRoot().fullPath + ".elm-package-path").write(ret[Number(file)]._parentPath);
            deferred.resolve(ret[Number(file)]._parentPath);
        });
    }

    var getElmPackagePath = function () {
        var path = $.Deferred();

        fs.resolve(ProjectManager.getProjectRoot().fullPath + ".elm-package-path", function (err, file) {
            if (!err) {
                file.read(function (err, data) {
                    if (!err) {
                        path.resolve(data);
                    } else {
                        path.reject();
                    }
                });
            } else {
                 var projectFiles = ProjectManager.getAllFiles(function (e) {
                    return e._path.indexOf("elm-stuff") === -1 && e.name === "elm-package.json";
                }, false, true);
                projectFiles.done(function (ret) {
                    if (ret.length !== 1) {
                        //choose
                        if (ret.length > 1) {
                            openChooseDialog(ret, path);
                        } else {
                            path.reject();
                        }
                    } else {
                        fs.getFileForPath(ProjectManager.getProjectRoot().fullPath + ".elm-package-path").write(ret[0]._parentPath);
                        path.resolve(ret[0]._parentPath);
                    }
                });
            }
        });
        return path;
    };

    var getElmPackage = function () {
        var data = $.Deferred();

        var path = getElmPackagePath();
        path.done(function (epjpath) {
             data.resolve(fs.getFileForPath(epjpath + "elm-package.json"));
        });
        return data;
    };

    exports.getElmPackage = getElmPackage;
    exports.getElmPackagePath = getElmPackagePath;
});
