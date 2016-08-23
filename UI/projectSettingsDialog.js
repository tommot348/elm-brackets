/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),
        licenses = require("../config/licenses").licenses;


    function ProjectSettingsDialog() {
        this.html = null;
        this.dialog = null;
        this.packages = null;
        this.gotData = false;
        this.projectFile = null;
    }

    ProjectSettingsDialog.prototype.init = function () {
        var template = require("text!../html/projectSettingsDialog.html"),
            compiledTemplate = Mustache.render(template, {
                S: ExtensionStrings,
                licenses: licenses
            }),
            html = $(compiledTemplate);
        this.html = html;
        //console.log(JSON.stringify(licenses));

        CommandManager.register(ExtensionStrings.SHOW_PACKAGE_MANAGER, IDs.SHOW_PACKAGE_MANAGER_ID, function () {
            this.show();
        }.bind(this));
    };

    ProjectSettingsDialog.prototype.show = function () {
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            var html = this.html;

            if (!this.gotData) {
                $.getJSON("http://package.elm-lang.org/all-packages", function (ret) {
                    this.packages = ret;
                    this.gotData = true;
                    console.log("success");
                }.bind(this)).done(function () {
                    console.log("second success");
                }).fail(function () {
                    console.log("error");
                }).always(function () {
                    console.log("complete");
                });
            }

            var projectFiles = ProjectManager.getAllFiles(function (e) {
                return e._path.indexOf("elm-stuff") === -1 && e.name === "elm-package.json";
            }, false, true);

            projectFiles.done(function (ret) {
                var chooseDialog = null;
                console.dir(ret);
                this.projectFile = $.Deferred();
                if (ret.length !== 1) {
                    //choose
                    var path = null;
                    fs.resolve(ProjectManager.getProjectRoot().fullPath + ".elm-package-path", function (err, file) {
                        if (!err) {
                            path = file;
                        }
                    });
                    if (path === null) {
                        if (ret.length > 1) {
                            var template = require("text!../html/chooseElmPackage.html"),
                                files = ret.map(function (e, i) {
                                    return { file: e._path, index: i };
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
                                this.projectFile.resolve(ret[Number(file)]);
                            }.bind(this));
                        }
                    } else {
                        path.read(function (err, path) {
                            if (!err) {
                                this.projectFile.resolve(fs.getFileForPath(path));
                            }
                        }.bind(this));
                    }
                } else {
                    this.projectFile.resolve(ret[0]);
                }
                this.projectFile.done(function (data) {
                    this.dialog = DialogManager.showModalDialogUsingTemplate(html);
                    $("table#availiable tbody", html).html("");

                    $("#elm-project-tabs a", html).click(function (e) {
                        e.preventDefault();
                        $(this).tab("show");
                    });

                    $("#search", html).change(function () {
                        var query = $("#search", this.html).val();
                        if (this.gotData) {
                            this.getList(query);
                        } else {
                            console.log("no data");
                        }
                    }.bind(this));

                    $(".dialog-button", html).click(function () {
                        var version = $("#version", html).val(),
                            summary = $("#summary", html).val(),
                            repository =  $("#repository", html).val(),
                            license = $("#license", html).val(),
                            sourceDirectories = $("#source-directories", html).val().length > 0 ? $("#source-directories", html).val().split("\n") : [],
                            exposedModules = $("#exposed-modules", html).val().length > 0 ? $("#exposed-modules", html).val().split("\n") : [],
                            vlow = $("#elm-version #vlow", html).val(),
                            vhigh = $("#elm-version #vhigh", html).val(),
                            elmPackage = {},
                            dependencies = {};
                        $("table#dependencies tbody tr").each(function (row) {
                            var vlow = $("input#vlow", this).val(),
                                vhigh = $("input#vhigh", this).val(),
                                name = $("td:first-of-type", this).text();
                            dependencies[name] = vlow + " <= v < " + vhigh;
                        });
                        elmPackage.version = version;
                        elmPackage.summary = summary;
                        elmPackage.repository = repository;
                        elmPackage.license = license;
                        elmPackage["source-directories"] = sourceDirectories;
                        elmPackage["exposed-modules"] = exposedModules;
                        elmPackage["elm-version"] = vlow + " <= v < " + vhigh;
                        elmPackage.dependencies = dependencies;
                        //console.log(JSON.stringify(elmPackage));
                        data.write(JSON.stringify(elmPackage, null, 4));
                    }.bind(this));

                    data.read(function (err, file, stat) {
                        var content = JSON.parse(file),
                            dependencies = content.dependencies,
                            depKeys = Object.keys(dependencies),
                            elmVersion = content["elm-version"].split("<");
                        $("#version", html).val(content.version);
                        $("#summary", html).val(content.summary);
                        $("#repository", html).val(content.repository);
                        $("#license", html).val(content.license);
                        $("#source-directories", html).val(content["source-directories"].join("\n"));
                        $("#exposed-modules", html).val(content["exposed-modules"].join("\n"));
                        $("table#dependencies tbody", html).html("");
                        $("#elm-version input#vlow", html).val(elmVersion[0].trim());
                        $("#elm-version input#vhigh", html).val(elmVersion[2].trim());
                        depKeys.forEach(function (curr) {
                            var tr = $("<tr></tr>"),
                                name = $("<td></td>").text(curr),
                                versions = dependencies[curr].split("<"),
                                vlow = $("<input type=\"text\" name=\"vlow\" id=\"vlow\">").val(versions[0].trim()),
                                vhigh = $("<input type=\"text\" name=\"vhigh\" id=\"vhigh\">").val(versions[2].trim()),
                                version = $("<td></td>").append(vlow).append("<p>&lt;= v &lt; </p>").append(vhigh),
                                button = $("<button>remove</button>").attr("data-name", curr).click(function () {
                                    tr.remove();
                                }),
                                remove = $("<td></td>").append(button);
                            tr.append(name).append(version).append(remove);

                            $("table#dependencies tbody", html).append(tr);
                        });
                    });
                }.bind(this));
            }.bind(this));
        }
    };

    ProjectSettingsDialog.prototype.query = function (query) {
        return this.packages.filter(function (i) {
            return i.name.indexOf(query) !== -1;
        });
    };

    ProjectSettingsDialog.prototype.getList = function (query) {
        var pack = this.query(query);
        console.log(JSON.stringify(pack));
        $("table#availiable tbody", this.html).html("");
        pack.forEach(function (elem) {
            var tr = $("<tr></tr>"),
                name = $("<td></td>").text(elem.name),
                desc = $("<td></td>").text(elem.summary),
                select = $("<select></select>"),
                versions = $("<td></td>"),
                button = $("<button>install</button>").attr("data-name", elem.name).click(function () {
                    var tri = $("<tr></tr>"),
                        version = $("<td></td>"),
                        v1 = select.val(),
                        v2 = String(Number(v1[0]) + 1) + ".0.0",
                        vlow = $("<input name=\"vlow\" id=\"vlow\">").val(v1),
                        vhigh = $("<input name=\"vhigh\" id=\"vhigh\">").val(v2),
                        button = $("<button>remove</button>").attr("data-name", elem.name).click(function () {
                            tri.remove();
                        }),
                        remove = $("<td></td>").append(button);
                    version.append(vlow).append("<p> <= v < </p>").append(vhigh);
                    tri.append(name).append(version).append(remove);
                    $("table#dependencies tbody").append(tri);
                }),
                install = $("<td></td>").append(button);
            elem.versions.forEach(function (elem) {
                select.append($("<option></option>").text(elem).val(elem));
            });
            versions.append(select);
            tr.append(name)
                .append(desc)
                .append(versions)
                .append(install);

            $("table#availiable tbody", this.html).append(tr);
        }.bind(this));
    };

    exports.projectSettingsDialog = new ProjectSettingsDialog();
});
