/*global define,brackets,$*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),

        EditorManager =  brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache");
    function PreferenceDialog() {
        this.html = null;
        this.dialog = null;
    }

    PreferenceDialog.prototype.init = function () {
        var template = require("text!../html/preferenceDialog.html"),
            compiledTemplate = Mustache.render(template, {S: ExtensionStrings}),
            html = $(compiledTemplate);
        this.html = html;

        CommandManager.register(ExtensionStrings.SHOW_PREFERENCES_DIALOG, IDs.SHOW_PREFERENCES_DIALOG_ID, function () {
            this.show();
        }.bind(this));
        $("#customRadio", html).on("change", function () {
            //console.log($(this));
            if ($(this).prop("checked")) {
                console.log("checked");
                $("#pathSettings", html).css("display", "table");
            }
        });
    };

    PreferenceDialog.prototype.show = function () {
        this.dialog = DialogManager.showModalDialogUsingTemplate(this.html);
    };



    exports.preferenceDialog = new PreferenceDialog();
});
