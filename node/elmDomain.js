/*jslint node: true*/
(function () {
    "use strict";

    var _domainManager,
        os = require("os"),
        child;

    function _runCommand(cmd, args, cwd, prefix, errback) {
        var spawn = require("child_process").spawn,
            enddir = cwd,
            tempdir,
            buffer = "";
        cmd = cmd.trim();

        //console.log(JSON.stringify(args));
        child = spawn(cmd, args, {
            cwd: cwd,
            env: process.env,
            shell: true
        });

        child.stdout.on("data", function (data) {

            if (data.toString().indexOf("[Y") > -1) {
                //console.log("Prompt");
                try {
                    child.stdin.write("n" + os.EOL);
                    if (prefix === "lint") {
                        buffer = JSON.stringify([{
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
                        }]);
                    }
                    child.kill();
                } catch (e) {
                    console.log(e);
                }
            } else {
                buffer += data.toString();
            }
        });

        child.stderr.on("data", function (data) {
            buffer += data.toString();
        });

        child.on('exit', function (code) {
            errback(null, buffer);
        });

        child.on('error', function (error) {
            errback(prefix + " failed " + error, null);
        });
    }

    function _build(file, cwd, binaryPath, usePATH, yes, out, warn, errback) {
        var binpath = !usePATH ? binaryPath + "/" : "";
        var cmd = binpath + "elm-make";
        var args = [(yes ? "--yes " : ""),
            ((out.length > 0) ? ("--output " + out + " ") : ""),
            (warn ? "--warn " : ""),
                   "--report json",
                   file];
        _runCommand(cmd, args, cwd, "build", errback);
    }

    function _lint(file, cwd, isWin, binaryPath, usePATH, errback) {
        var binpath = !usePATH ? binaryPath + "/" : "",
            cmd = binpath + "elm-make",
            args = ["--warn",
                  "--report json",
                  "--output " + (isWin ? "nul" : "/dev/null"),
                file];
        _runCommand(cmd, args, cwd, "lint", errback);
    }

    function _codeHint(str, file, cwd, binaryPath, usePATH, errback) {
        var binpath = !usePATH ? binaryPath + "/" : "",
            cmd = binpath + "elm-oracle",
            args = [file, str];
        _runCommand(cmd, args, cwd, "hint", errback);
    }

    function _pkg_install(pkg, cwd, binaryPath, usePATH, errback) {
        var binpath = !usePATH ? binaryPath + "/" : "",
            cmd = binpath + "elm-package",
            args = ["install",
                   "-y",
                   pkg];
        _runCommand(cmd, args, cwd, "pkg_install", errback);
    }

    function _format(file, cwd, binaryPath, usePATH, out, yes, errback) {
        var binpath = !usePATH ? binaryPath + "/" : "",
            cmd = binpath + "elm-format",
            args = [(yes ? "--yes " : ""),
                   (out.length > 0 ? "--output " + out : ""),
                   file];
        _runCommand(cmd, args, cwd, "format", errback);
    }

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

    /**
     * Initializes the domain
     * @param {DomainManager} domainManager The DomainManager for the server
     */
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
                        name: "binaryPath",
                        type: "string",
                        description: "path to the elm binary"
                    },
                    {
                        name: "usePATH",
                        type: "boolean",
                        description: "use PATH or custom paths"
                    },
                    {
                        name: "yes",
                        type: "boolean",
                        description: "flag to set \"yes to all\" "
                    },
                    {
                        name: "out",
                        type: "string",
                        description: "output file name"
                    },
                    {
                        name: "warn",
                        type: "boolean",
                        description: "flag to activate warnings"
                    },
                    {
                        name: "errback",
                        type: "function",
                        description: "node style errback function"
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
                    },
                    {
                        name: "binaryPath",
                        type: "string",
                        description: "path to the elm binary"
                    },
                    {
                        name: "usePATH",
                        type: "boolean",
                        description: "use PATH or custom paths"
                    },
                    {
                        name: "errback",
                        type: "function",
                        description: "node style errback function"
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
                        name: "binaryPath",
                        type: "string",
                        description: "path to the elm binary"
                    },
                    {
                        name: "usePATH",
                        type: "boolean",
                        description: "use PATH or custom paths"
                    },
                    {
                        name: "errback",
                        type: "function",
                        description: "node style errback function"
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
                        name: "binaryPath",
                        type: "string",
                        description: "path to the elm binary"
                    },
                    {
                        name: "usePATH",
                        type: "boolean",
                        description: "use PATH or custom paths"
                    },
                    {
                        name: "errback",
                        type: "function",
                        description: "node style errback function"
                    }
                ]
            );
            domainManager.registerCommand(
                "elmDomain", // domain name
                "format", // command name
                _format, // command handler function
                true, // isAsync
                "Format source",
                [
                    {
                        name: "file",
                        type: "string",
                        description: "file to be formantted"
                    },
                    {
                        name: "cwd",
                        type: "string",
                        description: "Directory in which the command is executed"
                    },
                    {
                        name: "binaryPath",
                        type: "string",
                        description: "path to the elm binary"
                    },
                    {
                        name: "usePATH",
                        type: "boolean",
                        description: "use PATH or custom paths"
                    },
                    {
                        name: "out",
                        type: "string",
                        description: "output file name"
                    },
                    {
                        name: "yes",
                        type: "boolean",
                        description: "flag to set \"yes to all\""
                    },
                    {
                        name: "errback",
                        type: "function",
                        description: "node style errback function"
                    }
                ]
            );
        }
        _domainManager = domainManager;
    }

    exports.init = _init;

}());
