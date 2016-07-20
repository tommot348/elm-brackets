(function () {
    "use strict";

    var _domainManager,
        child;

    function _execute(cmd, cwd, isWin) {

        var spawn = require("child_process").spawn,
            args,
            enddir = cwd,
            tempdir;

        cmd = cmd.trim();
        console.log(process.env);
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
            _domainManager.emitEvent("elmDomain", "stdout", data.toString());
        });

        child.stderr.on("data", function (data) {
            _domainManager.emitEvent("elmDomain", "stderr", data.toString());
        });

        child.on('exit', function (code) {
            _domainManager.emitEvent("elmDomain", "finished");
        });

        child.on('error', function (error) {
            _domainManager.emitEvent("elmDomain", "finished");
        });

    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function _init(domainManager) {

        if (!domainManager.hasDomain("elmDomain")) {
            domainManager.registerDomain("elmDomain", {
                major: 0,
                minor: 12
            });
        }

        domainManager.registerCommand(
            "elmDomain", // domain name
            "execute", // command name
            _execute, // command handler function
            true, // isAsync
            "Execute the given command and return the results to the UI",
            [
                {
                    name: "cmd",
                    type: "string",
                    description: "The command to be executed"
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

        domainManager.registerEvent("elmDomain",
            "stdout", [{
                name: "data",
                type: "string"
            }]);

        domainManager.registerEvent("elmDomain",
            "stderr", [{
                name: "err",
                type: "string"
            }]);

        domainManager.registerEvent("elmDomain",
            "finished", []);

        domainManager.registerEvent("elmDomain",
            "close", [{
                name: "enddir",
                type: "string"
            }]);

        domainManager.registerEvent("elmDomain",
            "clear", []);

        _domainManager = domainManager;
    }

    exports.init = _init;

}());