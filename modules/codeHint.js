/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        TokenUtils = brackets.getModule("utils/TokenUtils"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        ExtensionStrings = require("../config/Strings"),
        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "../node/elmDomain")),
        elmPackageJson = require("./elm-package-json"); // package-style naming to avoid collisions


    function ElmHintProvider() {
        var editor;
    }
    ElmHintProvider.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos(),
            activeToken = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
        return (!CodeHintManager.isOpen()) && activeToken.token.string.length > 1;
    };
    ElmHintProvider.prototype.getHints = function (implicitChar) {
        var curOpenDir = elmPackageJson.getElmPackagePath(),
            curOpenFile = DocumentManager.getCurrentDocument().file._path,
            result = $.Deferred(),
            cursor = this.editor.getCursorPos(),
            activeToken = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
        curOpenDir.done(function (path) {
            (ElmDomain.exec("hint",
                activeToken.token.string,
                curOpenFile,
                path,
                preferences.get("elm-oracleBinary"),
                preferences.get("usePathOrCustom") === "path"))
                .done(function (data) {
                    try {
                        var hintsJson = JSON.parse(data);
                        result.resolve(
                            {
                                hints: hintsJson.map(function (elem) {
                                    return elem.name;
                                }).sort(),
                                match: "",
                                selectInitial: true,
                                handleWideResults: true
                            }
                        );
                    } catch (ex) {
                        console.log(data);
                        console.log(ex);
                        result.reject(ex);
                    }
                })
                .fail(function (err) {
                    result.reject(err);
                });
        });
        return result.promise();
    };
    ElmHintProvider.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            currentToken = this.editor._codeMirror.getTokenAt(cursor),
            replaceStart,
            replaceEnd;
        if (currentToken.string.indexOf(".") === currentToken.string.length - 1) {
            replaceStart = {
                line: cursor.line,
                ch: currentToken.end
            };
            replaceEnd = {
                line: cursor.line,
                ch: cursor.ch
            };
        } else {
            replaceStart = {
                line: cursor.line,
                ch: currentToken.start
            };
            replaceEnd = {
                line: cursor.line,
                ch: cursor.ch
            };
        }


        this.editor.document.replaceRange(hint.toString(), replaceStart, replaceEnd);
        return false;
    };

    var provider = new ElmHintProvider();
    CodeHintManager.registerHintProvider(provider, ["elm"], 10);
});
