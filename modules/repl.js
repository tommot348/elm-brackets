/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "../node/elmDomain")),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        EditorManager = brackets.getModule('editor/EditorManager'),
        Menus = brackets.getModule("command/Menus"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),

        ExtensionStrings = require("../config/Strings"),
        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),
        repl = require("../config/IDs").REPL_ID,
        replMarked = require("../config/IDs").REPL_MARKED_ID,
        elmPackageJson = require("./elm-package-json");

    EditorManager.on('activeEditorChange', function () {
        var doc = DocumentManager.getCurrentDocument(),
            lang = (doc ? doc.language : null),
            id = (lang ? lang.getId() : ""),
            menu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
        try {
            menu.removeMenuItem(replMarked);
        } catch (ex) {

        }
        try {
            KeyBindingManager.removeBinding("Ctrl-R");
        } catch (ex2) {

        }
        if (id === "elm") {
            menu.addMenuItem(replMarked, "Ctrl-R");
        }
    }.bind(this));

    function _sendToREPL(cwd, data, result) {
        ElmDomain.exec("sendToREPL",
                        cwd,
                        preferences.get("elmBinary"),
                        preferences.get("usePathOrCustom") === "path",
                        data)
            .done(function (proc) {
                result.resolve(proc);
            })
            .fail(function (err) {
                result.reject(err);
            });
    }

    function sendToREPL(data) {
        var result = $.Deferred();

        elmPackageJson.getElmPackagePath()
            .done(function (path) {
                _sendToREPL(path, data, result);
            })
            .fail(function (err) {
                var path = DocumentManager.getCurrentDocument().parent._path;
                _sendToREPL(path, data, result);
            });

        return result;
    }

    function sendMarkedToREPL() {
        var text = (EditorManager.getActiveEditor().getSelectedText())
            .replace(/\n/g, "\\\n");

        sendToREPL(text);
        sendToREPL(13);
    }

    CommandManager.register("send data to elm repl", repl, sendToREPL);
    CommandManager.register("evaluate in elm repl", replMarked, sendMarkedToREPL);
    exports.command_id = repl;
});
