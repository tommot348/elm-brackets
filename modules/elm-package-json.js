/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem"),

        ExtensionStrings = require("../config/Strings");

    var projectFiles = ProjectManager.getAllFiles(function (e) {
        return e._path.indexOf("elm-stuff") === -1 && e.name === "elm-package.json";
    }, false, true);

    projectFiles.done(function (ret) {
        var chooseDialog = null;
        var path = null;
        fs.resolve(ProjectManager.getProjectRoot().fullPath + ".elm-package-path", function (err, file) {
            if (!err) {
                path = file;
            }
        });
        if (path === null) {
            if (ret.length !== 1) {
                //choose
                if (ret.length > 1) {
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

                    chooseDialog = DialogManager.showModalDialogUsingTemplate(chtml, false);
                    $(".dialog-button", chtml).click(function () {
                        console.log("close choose");
                        var file = $("select", chtml).val();
                        console.log(file);
                        chooseDialog.close();
                        fs.getFileForPath(ProjectManager.getProjectRoot().fullPath + ".elm-package-path").write(ret[Number(file)]._path);
                        file.resolve(ret[Number(file)]);
                    });
                }
            } else {
                fs.getFileForPath(ProjectManager.getProjectRoot().fullPath + ".elm-package-path").write(ret[0]._path);
            }
        }
    });
});
