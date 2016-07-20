/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    
    //console.log(process.env);
    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus");
    
    var DocumentManager     = brackets.getModule("document/DocumentManager");
    
    var ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    
    var NodeDomain     = brackets.getModule("utils/NodeDomain"),
        ShellDomain    = new NodeDomain("elmDomain",
                                     ExtensionUtils.getModulePath(module,
                                                    "node/command"));
        
    ExtensionUtils.loadStyleSheet(module, "styles/style.css");
    
    var InfoPanel = require("modules/info-panel").InfoPanel;
    var panel = new InfoPanel();
    panel.init();
    panel.show();
    
    var buffer = "";
    $(ShellDomain).on("stdout", function (evt, data) {
        buffer += data;
        panel.updateStatus("Success");
    });

    $(ShellDomain).on("stderr", function (evt, data) {
        buffer += data;
        panel.updateStatus("Error");
    });
    
    $(ShellDomain).on("finished", function (evt, data) {
        panel.appendOutput(buffer);
        buffer = "";
    });


    $(ShellDomain).on("clear", function () {
        
    });



    function handleBuild() {
        var curOpenDir  = DocumentManager.getCurrentDocument().file._parentPath;
        var curOpenFile = DocumentManager.getCurrentDocument().file._path;
        CommandManager.execute("file.saveAll");
        ShellDomain.exec("execute",
                                 "elm-make --yes " + curOpenFile,
                                 curOpenDir,
                                 brackets.platform === "win");
    }


    var build = "elm.buid";   // package-style naming to avoid collisions
    CommandManager.register("elm-make current file", build, handleBuild);

    var menu = Menus.addMenu("Elm", "foobarcode.elm");
    menu.addMenuItem(build);
    
    
    require("elm-mode");
    
    var LanguageManager = brackets.getModule("language/LanguageManager");

    LanguageManager.defineLanguage("elm", {
        name: "Elm",
        mode: "elm",
        fileExtensions: ["elm"],
        blockComment: ["{-", "-}"],
        lineComment: ["--"]
    });
});
