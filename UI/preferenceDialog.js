/*global define,brackets,$,document*/
define(function (require, exports) {
    "use strict";
    var DialogManager = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),

        EditorManager =  brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        fs = brackets.getModule("filesystem/FileSystem");
    function PreferenceDialog() {
        this.html = null;
        this.dialog = null;
    }
    function setValue(name, value) {
        if (value !== undefined && value !== null && value.length !== 0) {
            $(name).val(value);
        }
    }
    function initValues(html) {
        //console.log(JSON.stringify(preferences));
        //console.log("init begin");
        $("input", html).each(function () {
            var name = $(this).attr("name"),
                oldVal = preferences.get(name);
            switch ($(this).prop("type")) {
            case "checkbox":
                if (oldVal === true) {
                    $(this).prop("checked", true);
                }
                break;
            case "radio":
                if (oldVal === $(this).val()) {
                    $(this).prop("checked", true);
                }
                break;
            default:
                $(this).val(oldVal);
                break;
            }

        });
        //console.log("init end");
    }
    function initBrowseButtons() {
        $("#browseElmBinary").on("click", function () {
            fs.showOpenDialog(false, true, "Choose elm binary path", null, null, function (err, ret) {
                if (Array.isArray(ret)) {
                    setValue("#elmBinary", ret[0]);
                } else {
                    console.log(err);
                }
            });
        });
        $("#browseElm-formatBinary").on("click", function () {
            fs.showOpenDialog(false, true, "Choose elm format binary path", null, null, function (err, ret) {
                if (Array.isArray(ret)) {
                    setValue("#elm-formatBinary", ret[0]);
                } else {
                    console.log(err);
                }
            });
        });
        $("#browseElm-oracleBinary").on("click", function () {
            fs.showOpenDialog(false, true, "Choose elm oracle binary path", null, null, function (err, ret) {
                if (Array.isArray(ret)) {
                    setValue("#elm-oracleBinary", ret[0]);
                } else {
                    console.log(err);
                }
            });
        });
    }
    PreferenceDialog.prototype.init = function () {
        var template = require("text!../html/preferenceDialog.html"),
            compiledTemplate = Mustache.render(template, {S: ExtensionStrings}),
            html = $(compiledTemplate);
        this.html = html;
        CommandManager.register(ExtensionStrings.SHOW_PREFERENCES_DIALOG, IDs.SHOW_PREFERENCES_DIALOG_ID, function () {
            this.show();
        }.bind(this));


    };

    PreferenceDialog.prototype.show = function () {
        var html = this.html;
        this.dialog = DialogManager.showModalDialogUsingTemplate(this.html);
        initBrowseButtons();
        $("#customRadio", html).on("change", function () {
            //console.log($(this));
            if ($(this).prop("checked")) {
                //console.log("checked");
                $("#pathSettings", html).css("display", "table");
            }
        });
        if (preferences.get("usePathOrCustom") === "custom") {
            $("#pathSettings", html).css("display", "table");
        }
        $("#pathRadio", html).on("change", function () {
            //console.log($(this));
            if ($(this).prop("checked")) {
                //console.log("checked");
                $("#pathSettings", html).css("display", "none");
            }
        });
        $("#savebutton", html).on("click", function () {
            var texts = $(":text"),
            //console.log(JSON.stringify(fields));
                radio = $(":radio").serializeArray(),
                cbs = $(":checkbox");

            $.each(radio, function (i, field) {
                //console.log(field.name + " " + field.value);
                preferences.set(field.name, field.value);
            });
            texts.each(function () {
                var name = $(this).attr("name"),
                    value = $(this).val();
                //console.log(field.name + " " + field.value);
                if (name) {
                    preferences.set(name, value);
                }
            });
            cbs.each(function () {
                var name = $(this).attr("name"),
                    value = $(this).prop("checked");
                if (name) {
                    preferences.set(name, value);
                }
            });
            //preferences.save();
        });
        initValues(this.html);
    };



    exports.preferenceDialog = new PreferenceDialog();
});
