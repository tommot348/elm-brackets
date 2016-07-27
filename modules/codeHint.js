/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        TokenUtils = brackets.getModule("utils/TokenUtils"),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "../node/elmDomain"));


    function ElmHintProvider() {
        /*var curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path;

        ElmDomain.exec("hint",
            curOpenFile,
            curOpenDir,
            brackets.platform === "win"
                      );*/
        var editor;

    }
    ElmHintProvider.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;
        var cursor = this.editor.getCursorPos(),
            activeToken = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
        return (!CodeHintManager.isOpen()) && activeToken.token.string.length > 1;
    };
    ElmHintProvider.prototype.getHints = function (implicitChar) {
        var buffer = "",
            curOpenDir = DocumentManager.getCurrentDocument().file._parentPath,
            curOpenFile = DocumentManager.getCurrentDocument().file._path,
            result = $.Deferred(),
            cursor = this.editor.getCursorPos(),
            activeToken = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
        ElmDomain.exec("hint",
            activeToken.token.string,
            curOpenFile,
            curOpenDir,
            brackets.platform === "win");
        $(ElmDomain).on("hintout", function (evt, data) {
            buffer += data;
        });
        $(ElmDomain).on("hintfinished", function (evt, data) {
            console.log(buffer);
            var hintsJson = "";
            try {
                hintsJson = JSON.parse(buffer);
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
                console.log(ex);
                result.reject();
            }
            buffer = "";
            $(ElmDomain).off("hintout");
            $(ElmDomain).off("hintfinished");

        });
        return result;
        /*return {
     hints: [activeToken.token.string + "bla", "blub"],
     match: "",
     selectInitial: true,
     handleWideResults: true};*/
    };
    ElmHintProvider.prototype.insertHint = function (hint) {
        var cursor = this.editor.getCursorPos(),
            currentToken = this.editor._codeMirror.getTokenAt(cursor),
            replaceStart = {
                line: cursor.line,
                ch: currentToken.start
            },
            replaceEnd = {
                line: cursor.line,
                ch: cursor.ch
            };

        this.editor.document.replaceRange(hint.toString(), replaceStart, replaceEnd);
        return false;
    };

    var provider = new ElmHintProvider();
    CodeHintManager.registerHintProvider(provider, ["elm"], 10);
    //CommandManager.register("elm-format current-file", command, handleFormat);
    //exports.command_id = command;
});