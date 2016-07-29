
/*global brackets,define,$*/
/* All functions related to panel and status */
define(function (require, exports) {
    "use strict";
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        CommandManager = brackets.getModule("command/CommandManager"),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        EditorManager =  brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache");

    function InfoPanel() {
        this.panelElement = null;
        this.panelContentElement = null;
        this.panel = null;
        this.status = null;
        this.isShown = false;
    }

    InfoPanel.prototype.init = function () {
        var infoPanelHtmlTemplate = require("text!../html/output-panel.html"),
            infoPanelHtml = Mustache.render(infoPanelHtmlTemplate, {S: ExtensionStrings});

        this.panelElement = $(infoPanelHtml);
        this.panelContentElement = $('.table tbody', this.panelElement);

        this.panel = WorkspaceManager.createBottomPanel(
            IDs.PANEL_ID,
            this.panelElement
        );

        $("#status-language").before('<div class="' + ExtensionStrings.INACTIVE + '" id="brackets-build-sys-status" title="' + ExtensionStrings.STATUSBAR_NAME + '">' + ExtensionStrings.INACTIVE_MSG + '</div>');

        this.status = $('#brackets-build-sys-status');

        CommandManager.register(ExtensionStrings.SHOW_PANEL, IDs.SHOW_PANEL_ID, function () {
            this.toggle();
        }.bind(this));

        $('.close', this.panelElement).on('click', function () {
            this.hide();
        }.bind(this));

        $('.build', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.BUILD_ID);
        });

        $('.pkg', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.PKG_INSTALL_ID);
        });

        $('.format', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.FORMAT_ID);
        });

        $('.clear', this.panelElement).on('click', function () {
            this.clear();
        }.bind(this));

        $('.preferences', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.SHOW_PREFERENCES_DIALOG_ID);
        }.bind(this));

        this.status.on('click', function () {
            this.toggle();
        }.bind(this));

    };

    InfoPanel.prototype.show = function () {
        this.panel.show();
        CommandManager.get(IDs.SHOW_PANEL_ID).setChecked(true);
        /*preferences.set('showPanel', true);
        preferences.save();*/
        this.isShown = true;
    };

    InfoPanel.prototype.hide = function () {
        this.panel.hide();
        CommandManager.get(IDs.SHOW_PANEL_ID).setChecked(false);
        /*preferences.set('showPanel', false);
        preferences.save();*/
        this.isShown = false;
    };

    InfoPanel.prototype.toggle = function () {
       /* var isShown = preferences.get('showPanel');*/

        if (this.isShown) {
            this.hide();
        } else {
            this.show();
        }
    };

    InfoPanel.prototype.clear = function () {
        $(this.panelContentElement).html("");
        $(this.status).attr("class", ExtensionStrings.INACTIVE).attr("title", "Build System Status").text(ExtensionStrings.INACTIVE_MSG);
    };

    InfoPanel.prototype.appendOutput = function (text, line, column) {
        var newElem = $("<tr data-line='" + line + "' data-column='" + column + "' style='display:table-row' class='build-sys-output'><td class='line-text'><pre class='build-sys-output-text'>" + text + "</pre><td></tr>");
        line = line || "0";
        column = column || "0";
        newElem.click(function () {
            var editor = EditorManager.getActiveEditor();
            editor.setCursorPos(Number($(this).attr("data-line")) - 1, Number($(this).attr("data-column")) - 1, true);
            editor.focus();
        });

        $(this.panelContentElement).append(newElem);

        this.scrollToBottom();
    };

    InfoPanel.prototype.scrollToBottom = function () {
        this.panelElement[0].scrollTop = this.panelElement[0].scrollHeight;
    };

    InfoPanel.prototype.updateStatus = function (status) {
        this.status.attr("class", status);
        if (status === "Inactive") {
            this.status.text(ExtensionStrings.INACTIVE_MSG);
        } else {
            this.status.text(status);
        }
    };

    exports.InfoPanel = InfoPanel;
});
