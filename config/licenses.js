/*global define*/
"use strict";
define(function (require, exports, module) {
    exports.licenses = ([
        {name: "MIT License"},
        {name: "Apache License 2.0"},
        {name: "GNU GPLv3"}
    ].sort(function (a, b) {
        return a.name > b.name;
    }));
});
