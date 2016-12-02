/*jslint regexp: true*/
/*global brackets,define,$*/
define(function (require, exports, module) {
    "use strict";
    var DocumentManager = brackets.getModule("document/DocumentManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        ExtensionStrings = require("../config/Strings"),
        buildAstId = require("../config/IDs").BUILD_AST_ID,
        ast = null;

    function Node(name, type, children, annotation) {
        annotation = annotation || [];
        children = children || [];
        this.name = name;
        this.type = type;
        this.children = children;
        this.annotation = annotation;
    }

    function filterComments(str) {
        var results = [],
            newStr = str,
            stack = [],
            i = 0,
            j = 0;
        //block comments first
        while (i <= newStr.length - 1) {
            if (newStr[i] === "{" && newStr[i + 1] === "-") {
                stack.push(i);
                ++i;
            }
            if (newStr[i] === "-" && newStr[i + 1] === "}") {
                ++i;
                j = stack.pop();
                results.push(newStr.substr(j, (i - j) + 1));
                newStr = newStr.substr(0, j) +
                    "$comment" +
                    (results.length - 1) +
                    "$\n " +
                    newStr.substr(i + 1);
                i = j;
            }
            ++i;
        }
        //then line comments
        while ((stack = /--.*/.exec(newStr)) !== null) {
            results.push(stack[0]);
            newStr = newStr.substr(0, stack.index) +
                "$comment" +
                (results.length - 1) +
                "$\n " +
                newStr.substr(stack.index + stack[0].length);
        }
        return [newStr, results];
    }

    function filterLiterals(str) {
        //Strings, chars, booleans first
        var results = [],
            stack = [],
            newStr = str,
            tempStr = "",
            startIndex = 0;
        while ((stack = /"""[\w\W]*"""|"[\w\-]*"|"[\W]*"|'.'|\bTrue\b|\bFalse\b/.exec(newStr)) !== null) {
            results.push(stack[0]);
            newStr = newStr.substr(0, stack.index) +
                " $literal" +
                (results.length - 1) +
                "$ " +
                newStr.substr(stack.index + stack[0].length);
        }

        //then Numbers
        var numRe = /\b[0-9]+(?:\.[0-9]+)?/g;
        /*var numRe = /\$literal\$[0-9]+|\$comment\$[0-9]+|\b[0-9]+(?:\.[0-9]+)?/g;*/
        while ((stack = numRe.exec(newStr)) !== null) {
            var start = stack.index,
                end = numRe.lastIndex;
            if (stack[0].indexOf("$literal$") === -1 && stack[0].indexOf("$comment$") === -1) {
                results.push(newStr.substr(start, end - start));
                tempStr += newStr.substr(startIndex, start - startIndex) +
                    " $literal" +
                    (results.length - 1) +
                    "$ ";
                startIndex = end + 1;
            }
        }
        tempStr += newStr.substr(startIndex);
        newStr = tempStr;

        return [newStr, results];
    }

    function categorize(str) {
        if (/^(port )?module .*/g.test(str)) {
            return "module";
        }
        if (/^import .*/g.test(str)) {
            return "import";
        }
        if (/^type alias.*/g.test(str)) {
            return "alias";
        }
        if (/^type .*/g.test(str)) {
            return "union";
        }
        if (/^port .*/g.test(str)) {
            return "port";
        }
        if (/^[\w ]+:[\w \->]+/g.test(str)) {
            return "annotation";
        }
        if (/^[\w ]+=/g.test(str)) {
            return "function";
        }
        if (/^if /.test(str)) {
            return "if";
        }
        if (/^case /.test(str)) {
            return "case";
        }
        if (/^let /.test(str)) {
            return "let";
        }
        if (/^in /.test(str)) {
            return "in";
        }
        if (/^$comment$[0-9]+/.test(str)) {
            return "comment";
        }
        return "error";
    }

    function separateBlocks(str) {
        var lines = str.split(/\n/g),
            elements = [],
            buffer = "";
        lines.forEach(function (line, i) {
            if (/^\s.*$/.test(line)) {
                //begins with whitespace and has content
                if (buffer.length !== 0) {
                    buffer = buffer + line;
                } else {
                    //maybe error
                    console.error(line);
                }
            } else {
                if (/^\s*$/.test(line)) {
                    //only whitespace
                    if (buffer.length !== 0) {
                        buffer = buffer + line;
                    }
                } else {
                    //text at beginning of line

                    if (buffer.length !== 0) {
                        elements.push(buffer);
                        buffer = null;
                    }
                    buffer = line;
                }
            }

            if (i === lines.length - 1) {
                if (buffer.length) {
                    elements.push(buffer);
                }
            }
        });
        return elements;
    }

    function parseComplex(str, type) {
        var name = type + Math.floor(Math.random() * 10000),
            children = [],
            tempStr = "",
            stack = [],
            i = 0,
            shell = [];

        function parseComplexMember(str, type) {
            var chName = "",
                chBody = "",
                chChildren = [];
            switch (type) {
            case "record":
                chName = (str.substr(0, str.indexOf(":"))).trim();
                chBody = (str.substr(str.indexOf(":") + 1)).trim();
                break;
            case "tuple":
                chName = "tupleItem" + Math.floor(Math.random() * 10000);
                chBody = str.trim();
                break;
            case "list":
                chName = "listItem" + Math.floor(Math.random() * 10000);
                chBody = str.trim();
                break;
            }
            switch (chBody[0]) {
            case "{":
                //maybe record or record update field statement
                chChildren.push(parseComplex(chBody, "record"));
                break;
            case "(":
                //maybe tuple, or parethesized statement
                chChildren.push(parseComplex(chBody, "tuple"));
                break;
            case "[":
                chChildren.push(parseComplex(chBody, "list"));
                break;
            default:
                chChildren.push(chBody);
                break;
            }
            return new Node(chName, type + " member", chChildren);
        }

        switch (type) {
        case "record":
            shell = ["{", "}"];
            break;
        case "tuple":
            shell = ["(", ")"];
            break;
        case "list":
            shell = ["[", "]"];
            break;
        }

        str = str.substr(str.indexOf(shell[0]) + 1, (str.lastIndexOf(shell[1]) - str.indexOf(shell[0])) - 1);
        str = str.replace(/\n/g, "");
        str = str.replace(/\s+/g, " ");
        str = str.replace(/\s,\s/g, ",");
        for (i = 0; i < str.length; ++i) {
            switch (str[i]) {
            case ",":
                if (stack.length === 0) {
                    children.push(parseComplexMember(tempStr, type));
                    tempStr = "";
                } else {
                    tempStr += str[i];
                }
                break;
            case "{":
            case "(":
            case "[":
                tempStr += str[i];
                stack.push(i);
                break;
            case "}":
            case ")":
            case "]":
                tempStr += str[i];
                stack.pop();
                break;
            default:
                tempStr += str[i];
                break;
            }
        }
        if (tempStr.length !== 0) {
            children.push(parseComplexMember(tempStr, type));
        }
        console.log(str);
        return new Node(name, type, children);
    }



    function parseModule(str) {
        str = str.replace(/\s+/g, " ");
        var split = str.split(" ");
        var i = split[0] === "port" ? 2 : 1;
        var name = split[i];
        var children = [];
        if (split[i + 2]) {
            if (split[i + 2].indexOf(",") === -1) {
                children = split[i + 2].replace(/[\(\)]/g, "");
            } else {
                children = split[i + 2].replace(/[\(\)]/g, "").split(",").map(function (x) {
                    return x.trim();
                });
            }
        }
        return new Node(name, "module", children);
    }

    function parseImport(str) {
        str = str.replace(/\s+/g, " ");
        var split = str.split(" "),
            name = split[1],
            children = [],
            annotation = [],
            chStr = null;
        if (split[3] === "as") {
            annotation.push(split[4]);
            chStr = split[5];
        } else {
            chStr = split[3];
        }
        if (chStr) {
            if (chStr.indexOf(",") === -1) {
                children = chStr.replace(/[\(\)]/g, "");
            } else {
                children = chStr.replace(/[\(\)]/g, "").split(",").map(function (x) {
                    return x.trim();
                });
            }
        }
        return new Node(name, "import", children, annotation);
    }

    function parseAnnotation(str) {
        var split1 = str.split(":");
        var name = split1[0].trim();
        var IO = split1[1].trim();
        return new Node(name, "annotation", [IO]);
    }

    function parsePort(str) {
        str = str.replace(/\s+/g, " ");
        var split1 = str.split(":");
        var name = ((split1[0].trim()).split(" "))[1];
        var IO = split1[1].trim();
        return new Node(name, "annotation", [IO]);
    }

    function parseUnion(str) {
        str = str.replace(/\s+/g, " ");
        var split = str.split("=");
        split[0] = (split[0].trim().split(" "));
        var name = split[0][1];
        var annotation = [];
        if (split[0].length > 2) {
            annotation = split[0].slice(2, split[0].length);
        }
        var children = ((split[1].trim()).split("|")).map(function (i) {
            var split = i.trim().split(" ");
            var name = split[0];
            var children = split.slice(1, split.length);
            return new Node(name, "union member", children);
        });
        return new Node(name, "union", children, annotation);
    }

    function parseAlias(str) {
        str = str.replace(/\s+/g, " ");
        var split = str.split("=");
        split[0] = (split[0].trim().split(" "));
        var name = split[0][2];
        var body = split[1].trim();
        var children = [];
        if (body.startsWith("{")) {
            //is a record alias
            children.push(parseComplex(body, "record"));
        } else {
            //either a primitive or a tupel/list (?does this have any merrit?)
            if (body.startsWith("(")) {
                //tupel
                children.push(parseComplex(body, "tuple"));
            } else {
                if (body.startsWith("[")) {
                    //list
                    children.push(parseComplex(body, "list"));
                } else {
                    //primitive
                    children.push(body);
                }
            }
        }
        return new Node(name, "alias", children);
    }

    function buildAst() {
        var text = DocumentManager.getCurrentDocument().getText(),
            comments = [],
            literals = [],
            elements = [],
            tempComments = [],
            tempLiterals = [];
        tempComments = filterComments(text);
        text = tempComments[0];
        comments = tempComments[1];
        tempLiterals = filterLiterals(text);
        text = tempLiterals[0];
        literals = tempLiterals[1];
        elements = separateBlocks(text);
        ast = new Node("root", "root");
        elements.forEach(function (e) {
            var category = categorize(e),
                node;
            switch (category) {
            case "module":
                node = parseModule(e);
                break;
            case "import":
                node = parseImport(e);
                break;
            case "union":
                node = parseUnion(e);
                break;
            case "alias":
                node = parseAlias(e);
                break;
            case "annotation":
                node = parseAnnotation(e);
                break;
            case "port":
                node = parsePort(e);
                break;
            case "case":
                break;
            case "if":
                break;
            case "let":
                break;
            case "in":
                break;
            case "error":
                break;
            }
            if (node) {
                ast.children.push(node);
            }
        });

        console.log(JSON.stringify(ast, null, "\t"));
    }

    function buildFile() {

    }
    CommandManager.register("build ast", buildAstId, buildAst);
});
