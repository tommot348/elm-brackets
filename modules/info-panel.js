"use strict";
/*global brackets,define,$*/
/* All functions related to panel and status */
define(function (require, exports) {

    var WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager');

    var ExtensionStrings = require("./Strings");

    var preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS);

    function InfoPanel() {
        this.panelElement = null;
        this.panelContentElement = null;
        this.panel = null;
        this.status = null;
    }

    InfoPanel.prototype.init = function () {
        var self = this;
        var infoPanelHtml = require("text!../html/output-panel.html");
        var debug = CommandManager.get(ExtensionStrings.DEBUG_ID);

        this.panelElement = $(infoPanelHtml);
        this.panelContentElement = $('.table tbody', this.panelElement);

        this.panel = WorkspaceManager.createBottomPanel(
            ExtensionStrings.PANEL_ID,
            this.panelElement
        );

        $("#status-language").before('<div class="' + ExtensionStrings.INACTIVE + '" id="brackets-build-sys-status" title="Build System Status">' + ExtensionStrings.INACTIVE_MSG + '</div>');

        this.status = $('#brackets-build-sys-status');

        CommandManager.register(ExtensionStrings.SHOW_PANEL, ExtensionStrings.SHOW_PANEL_ID, function () {
            self.toggle();
        });

        $('.close', this.panelElement).on('click', function () {
            self.hide();
        });

        $('.build', this.panelElement).on('click', function () {
            CommandManager.execute(ExtensionStrings.BUILD_ID);
        });

        $('.run', this.panelElement).on('click', function () {
            CommandManager.execute(ExtensionStrings.RUN_ID);
        });

        $('.config', this.panelElement).on('click', function () {
            CommandManager.execute(ExtensionStrings.CONFIG_ID);
        });

        $('.clear', this.panelElement).on('click', function () {
            self.clear();
        });

        this.status.on('click', function () {
            self.toggle();
        });

    };

    InfoPanel.prototype.show = function () {
        this.panel.show();
        CommandManager.get(ExtensionStrings.SHOW_PANEL_ID).setChecked(true);
        preferences.set('showPanel', true);
        preferences.save();
    };

    InfoPanel.prototype.hide = function () {
        this.panel.hide();
        CommandManager.get(ExtensionStrings.SHOW_PANEL_ID).setChecked(false);
        preferences.set('showPanel', false);
        preferences.save();
    };

    InfoPanel.prototype.toggle = function () {
        var isShown = preferences.get('showPanel');

        if (isShown) {
            this.hide();
        } else {
            this.show();
        }
    };

    InfoPanel.prototype.clear = function () {
        $(this.panelContentElement).html("");
        $(this.status).attr("class", ExtensionStrings.INACTIVE).attr("title", "Build System Status").text(ExtensionStrings.INACTIVE_MSG);
    };

    InfoPanel.prototype.appendText = function (text) {
        var currentHtml = $(this.panelContentElement).html();
        $(this.panelContentElement).html(currentHtml + text);
        this.scrollToBottom();
    };

    InfoPanel.prototype.appendOutput = function (text) {
        var currentHtml = $(this.panelContentElement).html();

        $(this.panelContentElement).html(currentHtml + "<tr style='display:table-row' class='build-sys-output'><td class='line-text'><pre class='build-sys-output-text'>" + text + "</pre><td></tr>");

        this.scrollToBottom();
    };

    InfoPanel.prototype.scrollToBottom = function () {
        this.panelElement[0].scrollTop = this.panelElement[0].scrollHeight;
    };

    InfoPanel.prototype.setTitle = function (title) {
        $('.title', this.panelElement).html(ExtensionStrings.EXTENSION_NAME + " — " + title);
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