var Helpers = (function () {
    //Useful function to add events to onload queue, may want to edit out typeof
    function addLoadEvent(func) {
        "use strict";
        var oldOnload = window.onload;
        if (typeof window.onload !== "function") {
            window.onload = func;
        } else {
            window.onload = function () {
                oldOnload();
                func();
            };
        }
    }
    
    return {
        addLoadEvent: addLoadEvent
    };
}());