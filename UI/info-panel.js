/*global brackets,define,$*/
/* All functions related to panel and status */
define(function (require, exports) {
    "use strict";
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        DocumentManager = brackets.getModule("document/DocumentManager"),

        ExtensionStrings = require("../config/Strings"),
        IDs = require("../config/IDs"),

        preferences = PreferencesManager.getExtensionPrefs(ExtensionStrings.EXTENSION_PREFS);

    function InfoPanel() {
        this.panelElement = null;
        this.panelContentElement = null;
        this.panel = null;
        this.status = null;
        this.isShown = false;
    }

    InfoPanel.prototype.init = function () {
        var infoPanelHtmlTemplate = require("text!../html/output-panel.html"),
            infoPanelHtml = Mustache.render(infoPanelHtmlTemplate, {
                S: ExtensionStrings
            });

        this.panelElement = $(infoPanelHtml);
        this.panelContentElement = $('.table tbody', this.panelElement);

        this.panel = WorkspaceManager.createBottomPanel(
            IDs.PANEL_ID,
            this.panelElement
        );

        $("#status-language").before('<div class="' + ExtensionStrings.INACTIVE + '" id="elm-status" title="' + ExtensionStrings.STATUSBAR_NAME + '">' + ExtensionStrings.INACTIVE_MSG + '</div>');

        this.status = $('#elm-status');

        EditorManager.on('activeEditorChange', function () {
            var doc = DocumentManager.getCurrentDocument(),
                lang = (doc ? doc.language : null),
                id = (lang ? lang.getId() : "");
            if (id !== "elm") {
                this.hide();
            } else {
                CommandManager.execute(IDs.BUILD_AST_ID);
            }
        }.bind(this));

        CommandManager.register(ExtensionStrings.SHOW_PANEL, IDs.SHOW_PANEL_ID, function () {
            this.toggle();
        }.bind(this));

        $('.close', this.panelElement).on('click', function () {
            this.hide();
        }.bind(this));

        $('.build', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.BUILD_ID)
                .done(function (data) {
                    //console.log(data);
                    var error = data.substr(0, data.lastIndexOf("]") + 1),
                        message = data.substr(data.lastIndexOf("]") + 1, data.length - error.length).trim(),
                        errors = "";
                    this.clear();
                    if (error.length) {
                        //console.log ( error );
                        errors = JSON.parse(error);
                        if (preferences.get("warn") === false) {
                            errors = errors.filter(function (err) {
                                return err.type !== "warning";
                            });
                        }
                        errors.forEach(function (elem) {
                            this.appendOutput(elem.tag +
                                "\n" +
                                elem.overview +
                                "\n" +
                                elem.details,
                                elem.region.start.line,
                                elem.region.start.column);
                        }.bind(this));
                        this.updateStatus("error");
                    } else {
                        this.updateStatus("success");
                    }
                    if (message.length) {
                        this.appendOutput(message);
                    }
                }.bind(this))
                .fail(function (err) {
                    this.appendOutput(err);
                }.bind(this));
        }.bind(this));

        $('.pkg', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.PKG_INSTALL_ID)
                .done(function (data) {
                    this.appendOutput(data);
                }.bind(this))
                .fail(function (err) {
                    this.appendOutput(err);
                }.bind(this));
        }.bind(this));

        $('.format', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.FORMAT_ID)
                 .done(function (data) {
                    this.appendOutput(data);
                }.bind(this))
                .fail(function (err) {
                    this.appendOutput(err);
                }.bind(this));
        }.bind(this));

        $('.clear', this.panelElement).on('click', function () {
            this.clear();
        }.bind(this));

        $('.preferences', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.SHOW_PREFERENCES_DIALOG_ID);
        });

        $('.project', this.panelElement).on('click', function () {
            CommandManager.execute(IDs.SHOW_PROJECT_DIALOG_ID);
        });

        $(".repl", this.panelElement).on('click', function () {
            CommandManager.execute(IDs.SHOW_REPL_PANEL_ID);
        });

        this.status.on('click', function () {
            this.toggle();
        }.bind(this));

    };

    InfoPanel.prototype.show = function () {
        if (DocumentManager.getCurrentDocument().language.getId() === "elm") {
            this.panel.show();
            CommandManager.get(IDs.SHOW_PANEL_ID).setChecked(true);
            $('#elm-toolbar-icon').addClass("on");
            $('#elm-toolbar-icon').removeClass("off");
            this.isShown = true;
        } else {
            console.log(DocumentManager.getCurrentDocument().language.getId());
        }
    };

    InfoPanel.prototype.hide = function () {
        this.panel.hide();
        CommandManager.get(IDs.SHOW_PANEL_ID).setChecked(false);
        $('#elm-toolbar-icon').removeClass("on");
        $('#elm-toolbar-icon').addClass("off");
        this.isShown = false;
    };

    InfoPanel.prototype.toggle = function () {
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
        line = line || "0";
        column = column || "0";
        var tr = $("<tr data-line='" + line + "' data-column='" + column + "' style='display:table-row' class='elm-output'></tr>"),
            td = $("<td class='line-text'></td>"),
            pre = $("<pre class='elm-text'></pre>");
        pre.text(text);
        td.append(pre);
        tr.append(td);
        tr.click(function () {
            var editor = EditorManager.getActiveEditor();
            editor.setCursorPos(Number($(this).attr("data-line")) - 1, Number($(this).attr("data-column")) - 1, true);
            editor.focus();
        });

        $(this.panelContentElement).append(tr);

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
