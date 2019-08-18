'use strict';

/*globals chrome */

function saveSettings() {
    chrome.runtime.getBackgroundPage(function(o) {
        o.settings = window.settings;
        document.getElementsByTagName("body")[0].setAttribute("data-theme", o.settings["theme"]);
        o.saveSettings();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.getBackgroundPage(function(o) {
        window.settings = o.settings;
        document.getElementsByTagName("body")[0].setAttribute("data-theme", o.settings["theme"]);
        var table = document.getElementById("options");
        var keys = Object.keys(o.settings);
        for (var i in keys) {
            var val = o.settings[keys[i]],
                input = document.getElementsByName(keys[i]);
            if (input.length) {
                input[0].value = val;
                if (input[0].type == "checkbox") {
                    input[0].checked = val;
                }
                input[0].addEventListener('change', function(e) {
                    window.settings[e.target.name] = (e.target.type == "checkbox" ? e.target.checked : e.target.value);
                    saveSettings();
                });
            }
        }
    });
});