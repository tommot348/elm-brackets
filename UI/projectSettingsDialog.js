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

        elmPackageJson = require("../modules/elm-package-json"),
        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),
        licenses = require("../config/licenses").licenses;


    function ProjectSettingsDialog() {
        this.html = null;
        this.dialog = null;
        this.packages = null;
        this.gotData = false;
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

        CommandManager.register(ExtensionStrings.SHOW_PROJECT_DIALOG, IDs.SHOW_PROJECT_DIALOG_ID, function () {
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

            elmPackageJson.getElmPackage().done(function (data) {
                this.dialog = DialogManager.showModalDialogUsingTemplate(html);
                $("div#availiable .content", html).remove();

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
                        repository = $("#repository", html).val(),
                        license = $("#license", html).val(),
                        sourceDirectories = $("#source-directories", html).val().length > 0 ? $("#source-directories", html).val().split("\n") : [],
                        exposedModules = $("#exposed-modules", html).val().length > 0 ? $("#exposed-modules", html).val().split("\n") : [],
                        vlow = $("#elm-version #vlow", html).val(),
                        vhigh = $("#elm-version #vhigh", html).val(),
                        elmPackage = {},
                        dependencies = {};
                    $("div#dependencies .content").each(function (row) {
                        var vlow = $("input#vlow", this).val(),
                            vhigh = $("input#vhigh", this).val(),
                            name = $("div:first-of-type", this).text();
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
                    CommandManager.execute(IDs.PKG_INSTALL_ID);
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
                    $("div#dependencies .content", html).remove();
                    $("#elm-version input#vlow", html).val(elmVersion[0].trim());
                    $("#elm-version input#vhigh", html).val(elmVersion[2].trim());
                    depKeys.forEach(function (curr) {
                        var row = $("<div class=\"row-fluid content\"></div>"),
                            name = $("<div class=\"span4\"></div>").text(curr),
                            versions = dependencies[curr].split("<"),
                            vlow = $("<input type=\"text\" name=\"vlow\" id=\"vlow\">").val(versions[0].trim()),
                            vhigh = $("<input type=\"text\" name=\"vhigh\" id=\"vhigh\">").val(versions[2].trim()),
                            version = $("<div class=\"span4\"></div>").append(vlow).append("<p>&lt;= v &lt; </p>").append(vhigh),
                            button = $("<button>" + ExtensionStrings.BUTTON_REMOVE + "</button>").attr("data-name", curr).click(function () {
                                row.remove();
                            }),
                            remove = $("<div class=\"span4\"></span>").append(button);
                        row.append(name).append(version).append(remove);

                        $("div#dependencies #header", html).after(row);
                    });
                });
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
        $("div#availiable .content", this.html).remove();
        pack.forEach(function (elem) {
            var row = $("<div class=\"row-fluid content\"></div>"),
                name = $("<div class=\"span3\"></div>").text(elem.name),
                desc = $("<div class=\"span3\">></div>").text(elem.summary),
                select = $("<select class=\"form-control\"></select>"),
                versions = $("<div class=\"span3\"></div>"),
                button = $("<button>" + ExtensionStrings.BUTTON_INSTALL + "</button>").attr("data-name", elem.name).click(function () {
                    var rowi = $("<div class=\"row-fluid content\"></div>"),
                        version = $("<div class=\"span3\"></div>"),
                        v1 = select.val(),
                        v2 = String(Number(v1[0]) + 1) + ".0.0",
                        vlow = $("<input class=\"form-control\" name=\"vlow\" id=\"vlow\">").val(v1),
                        vhigh = $("<input class=\"form-control\" name=\"vhigh\" id=\"vhigh\">").val(v2),
                        button = $("<button>remove</button>").attr("data-name", elem.name).click(function () {
                            rowi.remove();
                        }),
                        remove = $("<div class=\"span3\"></div>").append(button);
                    version.append(vlow).append("<p> <= v < </p>").append(vhigh);
                    rowi.append(name.clone())
                        .append(version)
                        .append(remove);
                    $("div#dependencies #header div:last-of-type").after(rowi);
                }),
                install = $("<div class=\"span3\"></div>").append(button);
            elem.versions.forEach(function (elem) {
                select.append($("<option></option>").text(elem).val(elem));
            });
            versions.append(select);
            row.append(name)
                .append(desc)
                .append(versions)
                .append(install);

            $("div#availiable #header", this.html).after(row);
        }.bind(this));
    };

    exports.projectSettingsDialog = new ProjectSettingsDialog();
});
