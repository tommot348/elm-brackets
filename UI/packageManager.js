/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        EditorManager =  brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem");
    function PackageManager() {
        this.html = null;
        this.dialog = null;
    }
    PackageManager.prototype.init = function () {
        var template = require("text!../html/packageManager.html"),
            compiledTemplate = Mustache.render(template, {S: ExtensionStrings}),
            html = $(compiledTemplate);
        this.html = html;
        CommandManager.register(ExtensionStrings.SHOW_PACKAGE_MANAGER, IDs.SHOW_PACKAGE_MANAGER_ID, function () {
            this.show();
        }.bind(this));


    };

    PackageManager.prototype.show = function () {
        var html = this.html;
        this.dialog = DialogManager.showModalDialogUsingTemplate(this.html);

    };



    exports.packageManager = new PackageManager();
});
