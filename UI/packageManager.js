/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        EditorManager = brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem");

    function PackageManager() {
        this.html = null;
        this.dialog = null;
        this.packages = null;
        this.gotData = false;
    }
    PackageManager.prototype.init = function () {
        var template = require("text!../html/packageManager.html"),
            compiledTemplate = Mustache.render(template, {
                S: ExtensionStrings
            }),
            html = $(compiledTemplate);
        this.html = html;

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
        $("#search", this.html).change(function () {
            var query = $("#search", this.html).val();
            if (this.gotData) {
                this.getList(query);
            } else {
                console.log("no data");
            }
        }.bind(this));
    };

    PackageManager.prototype.query = function (query) {
        return this.packages.filter(function (i) {
            return i.name.indexOf(query) !== -1;
        });
    };

    PackageManager.prototype.getList = function (query) {
        var pack = this.query(query);
        console.log(JSON.stringify(pack));
        $("tr", this.html).remove();
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

            $("table", this.html).append(tr);
        }.bind(this));
    };

    exports.packageManager = new PackageManager();
});
