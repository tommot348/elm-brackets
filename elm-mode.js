/*
Copyright (c) 2012-2013 Evan Czaplicki

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials provided
      with the distribution.

    * Neither the name of Evan Czaplicki nor the names of other
      contributors may be used to endorse or promote products derived
      from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*global define,brackets*/
define(function (require, exports) {
    "use strict";

    var cm = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    cm.defineMode("elm", function () {

        function switchState(source, setState, f) {
            setState(f);
            return f(source, setState);
        }

        // These should all be Unicode extended, as per the Haskell 2010 report
        var smallRE = /[a-z_]/;
        var largeRE = /[A-Z]/;
        var digitRE = /[0-9]/;
        var hexitRE = /[0-9A-Fa-f]/;
        var octitRE = /[0-7]/;
        var idRE = /[a-z_A-Z0-9\']/;
        var symbolRE = /[\-!#$%&*+.\/<=>?@\\\^|~:\u03BB\u2192]/;
        var specialRE = /[\(\),;\[\]`\{\}]/;
        var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer
        
        var normal;
        var markdown;
        var stringLiteral;
        var stringGap;
        var ncomment;
        
        ncomment = function (type, nest) {
            if (nest === 0) {
                return normal(false);
            }
            return function (source, setState) {
                var currNest = nest;
                while (!source.eol()) {
                    var ch = source.next();
                    if (ch === '{' && source.eat('-')) {
                        ++currNest;
                    } else if (ch === '-' && source.eat('}')) {
                        --currNest;
                        if (currNest === 0) {
                            setState(normal(false));
                            return type;
                        }
                    }
                }
                setState(ncomment(type, currNest));
                return type;
            };
        };

        normal = function (interpolate) {
            return function (source, setState) {
                if (source.eatWhile(whiteCharRE)) {
                    return null;
                }
                var t;
                var ch = source.next();
                if (specialRE.test(ch)) {
                    if (ch === '{' && source.eat('-')) {
                        t = "comment";
                        if (source.eat('#')) {
                            t = "meta";
                        }
                        return switchState(source, setState, ncomment(t, 1));
                    }
                    if (interpolate && ch === '}' && source.eat('}')) {
                        return switchState(source, setState, markdown);
                    }
                    if (ch === '[' &&
                                source.eat('m') &&
                                source.eat('a') &&
                                source.eat('r') &&
                                source.eat('k') &&
                                source.eat('d') &&
                                source.eat('o') &&
                                source.eat('w') &&
                                source.eat('n') &&
                                source.eat('|')) {
                        setState(markdown);
                        return null;
                    }
                    return null;
                }

                if (ch === '\'') {
                    if (source.eat('\\')) {
                        source.next(); // should handle other escapes here
                    } else {
                        source.next();
                    }
                    if (source.eat('\'')) {
                        return "string";
                    }
                    return "error";
                }

                if (ch === '"') {
                    return switchState(source, setState, stringLiteral);
                }

                if (largeRE.test(ch)) {
                    source.eatWhile(idRE);
                    if (source.eat('.')) {
                        return "qualifier";
                    }
                    return "variable-2";
                }

                if (smallRE.test(ch)) {
                    var isDef = source.pos === 1;
                    source.eatWhile(idRE);
                    return isDef ? "variable-3" : "variable";
                }

                if (digitRE.test(ch)) {
                    if (ch === '0') {
                        if (source.eat(/[xX]/)) {
                            source.eatWhile(hexitRE); // should require at least 1
                            return "integer";
                        }
                        if (source.eat(/[oO]/)) {
                            source.eatWhile(octitRE); // should require at least 1
                            return "number";
                        }
                    }
                    source.eatWhile(digitRE);
                    t = "number";
                    if (source.eat('.')) {
                        t = "number";
                        source.eatWhile(digitRE); // should require at least 1
                    }
                    if (source.eat(/[eE]/)) {
                        t = "number";
                        source.eat(/[\-+]/);
                        source.eatWhile(digitRE); // should require at least 1
                    }
                    return t;
                }

                if (symbolRE.test(ch)) {
                    if (ch === '-' && source.eat(/-/)) {
                        source.eatWhile(/-/);
                        if (!source.eat(symbolRE)) {
                            source.skipToEnd();
                            return "comment";
                        }
                    }
                    source.eatWhile(symbolRE);
                    return "builtin";
                }

                return "error";
            };
        };

        markdown = function (source, setState) {
            while (!source.eol()) {
                var ch = source.next();
                if (ch === '{' && source.eat('{')) {
                    setState(normal(true));
                    return "string";
                }
                if (ch === '|' && source.eat(']')) {
                    setState(normal(false));
                    return null;
                }
            }
            setState(markdown);
            return "string";
        };

        stringLiteral = function (source, setState) {
            while (!source.eol()) {
                var ch = source.next();
                if (ch === '"') {
                    setState(normal(false));
                    return "string";
                }
                if (ch === '\\') {
                    if (source.eol() || source.eat(whiteCharRE)) {
                        setState(stringGap);
                        return "string";
                    }
                    if (!source.eat('&')) {
                        source.next(); // should handle other escapes here
                    }
                }
            }
            setState(normal(false));
            return "error";
        };

        stringGap = function (source, setState) {
            if (source.eat('\\')) {
                return switchState(source, setState, stringLiteral);
            }
            source.next();
            setState(normal(false));
            return "error";
        };


        var wellKnownWords = (function () {
            var wkw = {};
            var i;
            var keywords = [
                    "as", "case", "class", "data", "default", "deriving", "do", "else", "export", "foreign",
                    "hiding", "jsevent", "if", "import", "in", "infix", "infixl", "infixr", "instance", "let",
                    "module", "newtype", "of", "open", "then", "type", "where", "_",
                    "..", "|", ":", "=", "\\", "\"", "->", "<-", "\u2192", "\u03BB", "port"
                ];

            for (i = keywords.length; i >= 0; i--) {
                wkw[keywords[i]] = "keyword";
            }

            return wkw;
        }());



        return {
            startState: function () {
                return {
                    f: normal(false)
                };
            },
            copyState: function (s) {
                return {
                    f: s.f
                };
            },

            token: function (stream, state) {
                var t = state.f(stream, function (s) {
                    state.f = s;
                });
                var w = stream.current();
                return (wellKnownWords.hasOwnProperty(w)) ? wellKnownWords[w] : t;
            }
        };

    });
});