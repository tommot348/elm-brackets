/*global brackets,define,$*/
/* All functions related to panel and status */
define(function (require, exports) {
    "use strict";
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        DocumentManager = brackets.getModule("document/DocumentManager"),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs");

    function ReplPanel() {
        this.panel = null;
        this.panelElement = null;
        this.isShown = false;
        this.buffer = [];
        this.history = [];
        this.pointer = 0;
    }
    ReplPanel.prototype.update = function () {
        var val = $('.tty', this.panelElement).val();

        $('.tty', this.panelElement).val(val.substr(0, val.lastIndexOf(">") + 1) + this.buffer.reduce(function (prev, curr) {
            return prev + String.fromCharCode(curr);
        }, ""));
    };
    ReplPanel.prototype.init = function () {
        var template = require("text!../html/repl-panel.html"),
            html = Mustache.render(template, {
                S: ExtensionStrings
            });

        this.panelElement = $(html);
        this.panelContentElement = $('.resizable-content', this.panelElement);

        this.panel = WorkspaceManager.createBottomPanel(
            IDs.REPL_PANEL_ID,
            this.panelElement
        );

        EditorManager.on('activeEditorChange', function () {
            var doc = DocumentManager.getCurrentDocument(),
                lang = (doc ? doc.language : null),
                id = (lang ? lang.getId() : "");
            if (id !== "elm") {
                this.hide();
            }
        }.bind(this));

        CommandManager.register(ExtensionStrings.SHOW_REPL_PANEL, IDs.SHOW_REPL_PANEL_ID, function () {
            this.toggle();
        }.bind(this));

        $('.close', this.panelElement).on('click', function () {
            this.hide();
        }.bind(this));
        $('.tty', this.panelElement).keydown(function (event) {
            console.log(event.keyCode);
            if ((event.keyCode > 36 && event.keyCode < 41) || event.keyCode === 9) {
                if (this.history.length > 0) {
                    if (event.keyCode === 38) {
                        if (this.pointer > 0) {
                            this.pointer--;
                        }
                    }
                    if (event.keyCode === 40) {
                        if (this.pointer < this.history.length - 1) {
                            this.pointer++;
                        } else {
                            if (this.pointer === this.history.length) {
                                this.pointer--;
                            }
                        }
                    }

                    this.buffer = this.history[this.pointer];
                    this.update();
                }

                event.preventDefault();
            }

        }.bind(this));
        $('.tty', this.panelElement).keyup(function (event) {
            event.preventDefault();
            if (event.keyCode === 8) {
                this.buffer.pop();
                this.update();
            }
        }.bind(this));

        $('.tty', this.panelElement).keypress(function (event) {
            var code = event.which || event.keyCode;
            event.preventDefault();
            console.log(code);
            switch (code) {
            case 13:
                if (this.buffer.length > 0) {
                    CommandManager.execute(IDs.REPL_ID, this.buffer);
                    this.history.push(this.buffer);
                    this.pointer = this.history.length;
                }
                CommandManager.execute(IDs.REPL_ID, 13);
                this.buffer = [];
                break;
            default:
                console.log("push: " + code);
                this.buffer.push(code);
            }
            this.update();
        }.bind(this));


    };
    ReplPanel.prototype.show = function () {
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            this.panel.show();
            CommandManager.get(IDs.SHOW_REPL_PANEL_ID).setChecked(true);
            this.isShown = true;
            CommandManager.execute(IDs.REPL_ID, 13);
            $('.tty', this.panelElement).focus();
        } else {
            console.log(DocumentManager.getCurrentDocument().language.getId());
        }
    };
    ReplPanel.prototype.hide = function () {
        this.panel.hide();
        CommandManager.get(IDs.SHOW_REPL_PANEL_ID).setChecked(false);
        this.isShown = false;
    };
    ReplPanel.prototype.toggle = function () {
        if (this.isShown) {
            this.hide();
        } else {
            this.show();
        }
    };
    ReplPanel.prototype.appendOutput = function (text) {
        $('.tty', this.panelElement).val($('.tty', this.panelElement).val() + text);
        $('.tty').scrollTop($('.tty')[0].scrollHeight);

    };
    exports.ReplPanel = ReplPanel;
});
