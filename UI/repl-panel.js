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
    }

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

        $('.tty', this.panelElement).keypress(function (event) {
            event.preventDefault();
            console.log(event.keyCode);
            CommandManager.execute("sendToREPL", (String.fromCharCode(event.keyCode)));
        });


    };
    ReplPanel.prototype.show = function () {
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            this.panel.show();
            CommandManager.get(IDs.SHOW_REPL_PANEL_ID).setChecked(true);
            this.isShown = true;
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
    };
    exports.ReplPanel = ReplPanel;
});
