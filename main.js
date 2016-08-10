/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";

    //console.log(process.env);
    var Menus = brackets.getModule("command/Menus"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ElmDomain = new NodeDomain("elmDomain",
            ExtensionUtils.getModulePath(module,
                "node/elmDomain")),
        InfoPanel = require("UI/info-panel").InfoPanel,
        panel = new InfoPanel(),
        buffer = "",
        LanguageManager = brackets.getModule("language/LanguageManager"),
        preferenceDialog = require("UI/preferenceDialog").preferenceDialog,
        icon = $("<a id='elm-toolbar-icon' href='#'></a>")
            .attr("title", "elm")
            .addClass("off")
            .appendTo($("#main-toolbar .buttons"))
            .click(function () {
                panel.toggle();
            });

    require("modules/lint");
    require("modules/codeHint");
    require("modules/build");
    require("modules/package-install");
    require("modules/format");
    require("config/preferences");

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");
    ExtensionUtils.loadStyleSheet(module, "styles/icon.less");

    panel.init();
    preferenceDialog.init();


    //panel.show();

    $(ElmDomain).on("buildout", function (evt, data) {
        buffer += data;

        panel.updateStatus("Success");
    });

    $(ElmDomain).on("builderr", function (evt, data) {
        buffer += data;

        ///TODO mark errors in code
        panel.updateStatus("Error");
    });

    $(ElmDomain).on("buildfinished", function (evt, data) {
        var error = buffer.substr(0, buffer.lastIndexOf("]") + 1),
            message = buffer.substr(buffer.lastIndexOf("]") + 1, buffer.length - error.length).trim(),
            errors = "";
        panel.clear();
        if (error.length) {
            //console.log ( error );
            errors = JSON.parse(error);
            errors.forEach(function (elem) {
                panel.appendOutput(elem.tag +
                    "\n" +
                    elem.overview +
                    "\n" +
                    elem.details,
                    elem.region.start.line,
                    elem.region.start.column);
            });
            panel.updateStatus("error");
        } else {
            panel.updateStatus("success");
        }
        if (message.length) {
            panel.appendOutput(message);
        }

        buffer = "";
    });

    $(ElmDomain).on("pkg_installout", function (evt, data) {
        buffer += data;
    });

    $(ElmDomain).on("pkg_installerr", function (evt, data) {
        buffer += data;
    });

    $(ElmDomain).on("pkg_installfinished", function (evt, data) {
        panel.appendOutput(buffer);
        buffer = "";
    });
    
    $(ElmDomain).on("formatout", function (evt, data) {
        buffer += data;
    });

    $(ElmDomain).on("formaterr", function (evt, data) {
        buffer += data;
    });

    $(ElmDomain).on("formatfinished", function (evt, data) {
        panel.appendOutput(buffer);
        buffer = "";
    });

    require("elm-mode");

    LanguageManager.defineLanguage("elm", {
        name: "Elm",
        mode: "elm",
        fileExtensions: ["elm"],
        blockComment: ["{-", "-}"],
        lineComment: ["--"]
    });
});
