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
        InfoPanel = require("modules/info-panel").InfoPanel,
        panel = new InfoPanel(),
        buffer = "",
        menu = Menus.addMenu("Elm", "tommot348.elm"),
        LanguageManager = brackets.getModule("language/LanguageManager");
    require("modules/lint");

    ExtensionUtils.loadStyleSheet(module, "styles/style.css");

    panel.init();
    panel.show();

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
    
    menu.addMenuItem(require("modules/build").command_id);
    menu.addMenuItem(require("modules/package-install").command_id);
    menu.addMenuItem(require("modules/format").command_id);

    require("elm-mode");

    LanguageManager.defineLanguage("elm", {
        name: "Elm",
        mode: "elm",
        fileExtensions: ["elm"],
        blockComment: ["{-", "-}"],
        lineComment: ["--"]
    });
});
