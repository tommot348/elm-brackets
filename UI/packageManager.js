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


    function PackageManager() {
        this.html = null;
        this.dialog = null;
        this.packages = null;
        this.gotData = false;
    }
    PackageManager.prototype.init = function () {
        var template = require("text!../html/packageManager.html"),
            compiledTemplate = Mustache.render(template, {
                S: ExtensionStrings,
                licenses: licenses
            }),
            html = $(compiledTemplate);
        this.html = html;
        console.log(JSON.stringify(licenses));



        CommandManager.register(ExtensionStrings.SHOW_PACKAGE_MANAGER, IDs.SHOW_PACKAGE_MANAGER_ID, function () {
            this.show();
        }.bind(this));


    };

    PackageManager.prototype.show = function () {
        var html = this.html;
        this.dialog = DialogManager.showModalDialogUsingTemplate(this.html);

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
        $("#elm-project-tabs a", html).click(function (e) {
            e.preventDefault();
            $(this).tab("show");
        });
        $("#search", this.html).change(function () {
            var query = $("#search", this.html).val();
            if (this.gotData) {
                this.getList(query);
            } else {
                console.log("no data");
            }
        }.bind(this));
        var projectFiles = ProjectManager.getAllFiles(function (e) {
            return e._path.indexOf("elm-stuff") === -1 && e.name === "elm-package.json";
        }, false, true);
        projectFiles.done(function (ret) {
            console.dir(ret);
            if (ret.length !== 1) {
                //choose
                console.dir(ret);
            } else {
                ret[0].read(function (err, file, stat) {
                    var content = JSON.parse(file),
                        dependencies = content.dependencies,
                        depKeys = Object.keys(dependencies);
                    $("#version", html).val(content.version);
                    $("#summary", html).val(content.summary);
                    $("#repository", html).val(content.repository);
                    $("#license", html).val(content.license);
                    $("#source-directory", html).val(content["source-directories"].join("\n"));
                    $("#exposed-modules", html).val(content["exposed-modules"].join("\n"));
                    $("table#dependencies tbody", html).html("");
                    depKeys.forEach(function (curr) {
                        var tr = $("<tr></tr>"),
                            name = $("<td></td>").text(curr),
                            version = $("<td></td>").text(dependencies[curr]),
                            button = $("<button>remove</button>").attr("data-name", curr).click(function () {
                                console.log("remove");
                            }),
                            remove = $("<td></td>").append(button);
                        tr.append(name).append(version).append(remove);

                        $("table#dependencies tbody", html).append(tr);
                    });
                });
            }
        });

    };

    PackageManager.prototype.query = function (query) {
        return this.packages.filter(function (i) {
            return i.name.indexOf(query) !== -1;
        });
    };

    PackageManager.prototype.getList = function (query) {
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
                    console.log("install");
                    $(this).parents("tr").children("select");
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

    exports.packageManager = new PackageManager();
});
