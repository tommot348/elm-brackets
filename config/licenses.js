/*global define*/
"use strict";
define(function (require, exports, module) {
    exports.licenses = ([
        {name: "MIT License", short: "MIT"},
        {name: "Apache License 2.0", short: "Apache-2.0"},
        {name: "GNU General Public License v3.0 only", short: "GPL-3.0"},
        {name: "BSD 3-clause \"New\" or \"Revised\" License", short: "BSD-3-Clause"}
    ].sort(function (a, b) {
        return a.name > b.name;
    }));
});
