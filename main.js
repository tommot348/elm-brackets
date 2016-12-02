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
        ReplPanel = require("UI/repl-panel").ReplPanel,
        panel = new InfoPanel(),
        repl = new ReplPanel(),
        buffer = "",
        LanguageManager = brackets.getModule("language/LanguageManager"),
        preferenceDialog = require("UI/preferenceDialog").preferenceDialog,
        projectSettingsDialog = require("UI/projectSettingsDialog").projectSettingsDialog,
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
    require("modules/repl");
    require("modules/ast");

    require("config/preferences");


    ExtensionUtils.loadStyleSheet(module, "styles/style.css");
    ExtensionUtils.loadStyleSheet(module, "styles/icon.less");
    ExtensionUtils.loadStyleSheet(module, "styles/project.less");

    repl.init();

    panel.init();
    preferenceDialog.init();

    projectSettingsDialog.init();

    ElmDomain.on("replout", function (event, data) {
        repl.appendOutput(data);
    });
    ElmDomain.on("replerr", function (event, err) {
        repl.appendOutput(err);
    });
    ElmDomain.on("replfinished", function (event, data) {
        console.log("repl finished with: " + data);
    });
    LanguageManager.defineLanguage("elm", {
        name: "Elm",
        mode: "elm",
        fileExtensions: ["elm"],
        blockComment: ["{-", "-}"],
        lineComment: ["--"]
    });
});
