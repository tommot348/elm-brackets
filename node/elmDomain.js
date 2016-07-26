/*jslint node: true*/
(function () {
    "use strict";

    var _domainManager,
        os = require("os"),
        child;

    function _runCommand(cmd, cwd, isWin, prefix) {
        var spawn = require("child_process").spawn,
            args,
            enddir = cwd,
            tempdir;
        cmd = cmd.trim();
        if (isWin) {
            args = ["/c", cmd];
            cmd = "cmd.exe";
        } else {
            args = ["-c", cmd];
            cmd = process.env.SHELL;
        }

        child = spawn(cmd, args, {
            cwd: cwd,
            env: process.env
        });

        child.stdout.on("data", function (data) {
            console.log(data.toString());
            if (data.toString().indexOf("[Y") > -1) {
                try {
                    child.stdin.write("n" + os.EOL);
                    if (prefix === "lint") {
                        _domainManager.emitEvent("elmDomain", prefix + "out", JSON.stringify([{
                            tag: "warning",
                            type: "warning",
                            overview: "Not all dependencies are satisfied",
                            details: "Please run elm-package install or build the file",
                            region: {
                                start: {
                                    line: 0,
                                    column: 0
                                },
                                end: {
                                    line: 0,
                                    column: 0
                                }
                            }
                        }]));
                    }
                    child.kill();
                } catch (e) {
                    console.log(e);
                }
            } else {
                _domainManager.emitEvent("elmDomain", prefix + "out", data.toString());
            }
        });

        child.stderr.on("data", function (data) {
            //console.log(data.toString());
            _domainManager.emitEvent("elmDomain", prefix + "err", data.toString());
        });

        child.on('exit', function (code) {
            _domainManager.emitEvent("elmDomain", prefix + "finished");
            //console.log("exit");
        });

        child.on('error', function (error) {
            _domainManager.emitEvent("elmDomain", prefix + "finished");
            //console.log("error");
        });
    }

    function _build(file, cwd, isWin) {
        var cmd = "elm-make --yes --report json " + file;
        _runCommand(cmd, cwd, isWin, "build");
    }

    function _lint(file, cwd, isWin) {
        var cmd = "elm-make --prepublish-core --report json " + file;
        _runCommand(cmd, cwd, isWin, "lint");
    }

    function _codeHint(str, file, cwd, isWin) {
        var cmd = "elm-oracle " + file + " " + str;
        _runCommand(cmd, cwd, isWin, "hint");
    }

    function _pkg_install(pkg, cwd, isWin) {
        var cmd = "elm-package install -y " + pkg;
        _runCommand(cmd, cwd, isWin, "pkg_install");
    }
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function registerEvents(domainManager, prefix) {
        console.info("register " + prefix);
        domainManager.registerEvent("elmDomain",
            prefix + "out", [{
                name: "data",
                type: "string"
            }]);

        domainManager.registerEvent("elmDomain",
            prefix + "err", [{
                name: "err",
                type: "string"
            }]);

        domainManager.registerEvent("elmDomain",
            prefix + "finished", []);
    }

    function _init(domainManager) {

        if (!domainManager.hasDomain("elmDomain")) {
            domainManager.registerDomain("elmDomain", {
                major: 0,
                minor: 12
            });


            domainManager.registerCommand(
                "elmDomain", // domain name
                "build", // command name
                _build, // command handler function
                true, // isAsync
                "Build file and create index.html",
                [
                    {
                        name: "file",
                        type: "string",
                        description: "File which is executed"
                    },
                    {
                        name: "cwd",
                        type: "string",
                        description: "Directory in which the command is executed"
                    },
                    {
                        name: "isWin",
                        type: "boolean",
                        description: "Is Windows System ?"
                    }
                ]
            );

            domainManager.registerCommand(
                "elmDomain", // domain name
                "lint", // command name
                _lint, // command handler function
                true, // isAsync
                "Lint file",
                [
                    {
                        name: "file",
                        type: "string",
                        description: "File which is executed"
                    },
                    {
                        name: "cwd",
                        type: "string",
                        description: "Directory in which the command is executed"
                    },
                    {
                        name: "isWin",
                        type: "boolean",
                        description: "Is Windows System ?"
                    }
                ]
            );

            domainManager.registerCommand(
                "elmDomain", // domain name
                "hint", // command name
                _codeHint, // command handler function
                true, // isAsync
                "get codehint",
                [
                    {
                        name: "str",
                        type: "string",
                        description: "part to complete"
                    },
                    {
                        name: "file",
                        type: "string",
                        description: "File which is executed"
                    },
                    {
                        name: "cwd",
                        type: "string",
                        description: "Directory in which the command is executed"
                    },
                    {
                        name: "isWin",
                        type: "boolean",
                        description: "Is Windows System ?"
                    }
                ]
            );

            domainManager.registerCommand(
                "elmDomain", // domain name
                "pkg_install", // command name
                _pkg_install, // command handler function
                true, // isAsync
                "Install packages and dependencies",
                [
                    {
                        name: "pkg",
                        type: "string",
                        description: "package to be installed"
                    },
                    {
                        name: "cwd",
                        type: "string",
                        description: "Directory in which the command is executed"
                    },
                    {
                        name: "isWin",
                        type: "boolean",
                        description: "Is Windows System ?"
                    }
                ]
            );
            registerEvents(domainManager, "build");
            registerEvents(domainManager, "lint");
            registerEvents(domainManager, "hint");
            registerEvents(domainManager, "pkg_install");
        }
        _domainManager = domainManager;
    }

    exports.init = _init;

}());
