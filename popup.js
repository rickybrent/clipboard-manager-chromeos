'use strict';

window.addEventListener("message", receiveMessage, false);
window.activeLi = 0;
/*globals chrome */

function closePopup(e) {
  // Retain window to help with debugging.
  if (e && e.type == "blur" && window.settings && window.settings.keep_open) {
    // console.log("Window not closed", e);
    return;
  }
  chrome.app.window.current().hide();
  // window.close();
}

function receiveMessage(event) {
  if (event.isTrusted) {
	document.getElementsByTagName("body")[0].setAttribute("data-theme", window.settings["theme"]);

    var previewSize = window.settings ? (window.settings.preview_size -1) : 30;
    var cliplist = window.cliplist;
    window.activeLi = 0;
    while (cliplist.hasChildNodes()) {
      cliplist.removeChild(cliplist.lastChild);
    }
    var hist = event.data[0],
      length = hist.length;
    for (var i = length - 1; i >= 0; i--) {
      var li = document.createElement("li");
      if (i == length - 1) {
        li.classList.add('active');
      }
      var preview = document.createElement("span");
      preview.textContent = hist[i].slice(0, previewSize);
      var textarea = document.createElement("textarea");
      textarea.value = hist[i];
      var clearbtn = document.createElement("a");
      clearbtn.className = "clearbtn";
      clearbtn.dataset.id = i;
      
      li.appendChild(preview);
      li.appendChild(clearbtn);
      li.appendChild(textarea);
      cliplist.appendChild(li);
      if (event.data[1] && event.data[1] == i) {
        copyElement(li.lastElementChild);
        closePopup();
      }
    }
    if (!event.data[1]) {
      //syncSettings();
      document.getElementById('clipsearch').lastElementChild.focus();
      //window.getComputedStyle(cliplist);
      sizeWindow(true);
    }
  }
}

function syncSettings(){
  chrome.runtime.getBackgroundPage(function(o) {
    window.settings = o.settings;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  window.cliplist = document.getElementById('cliplist');
  window.clipsearch = document.getElementById('clipsearch');
  window.managelinks = document.getElementById('managelinks');
  document.getElementById('close').addEventListener('click', function(e) {
    closePopup(e);
  });
  document.getElementById('clear').addEventListener('click', function(e) {
    chrome.runtime.getBackgroundPage(function(o) {
      o.clearClipboardHistory();
      closePopup(e);
    });
  });
  document.getElementById('options').addEventListener('click', function(e) {
    chrome.runtime.getBackgroundPage(function(o) {
      o.showOptions();
      closePopup(e);
    });
  });
  chrome.app.window.current().onBoundsChanged.addListener(sizeWindow);

  var cliplistClickCallback = function(e) {
    if (e.target.tagName == "A") {
      chrome.runtime.getBackgroundPage(function(o) {
        o.removeFromClipboard(e.target.dataset.id);
      });
      return;
    }
    for (var idx = 0; idx < e.path.length; idx++) {
      var elm = e.path[idx];
      if (elm.tagName == "LI") {
        var txt = elm.lastElementChild.value;
        // Workaround for background execCommand('copy') failing:
        copyElement(elm.lastElementChild);
        // Check to make sure we were able to copy it before closing.
        chrome.runtime.getBackgroundPage(function(o) {
          if (o.getClipboardText() == txt) {
            closePopup(e);
          }
        });
      }
    }
  };
  window.cliplist.addEventListener('click', cliplistClickCallback);
});

function sizeWindow(requested){
  window.screen.availHeight;
  var sWidth = window.screen.availWidth, sHeight = window.screen.availHeight,
      appwindow = chrome.app.window.current(),
      barbottom = document.getElementById('managelinks'),
      bartop = document.getElementById('clipsearch'),
      middle = document.getElementById('cliphistory'),
      body = document.body;
  middle.clientHeight;
  middle.scrollHeight;
  var origBottom = sHeight - (appwindow.innerBounds.top + appwindow.innerBounds.height);
  // Size:
  appwindow.innerBounds.height = document.body.clientHeight;
  var dist = {
    right: sWidth - (appwindow.innerBounds.width + appwindow.innerBounds.left),
    left: appwindow.innerBounds.left,
    bottom: sHeight - (appwindow.innerBounds.top + appwindow.innerBounds.height)
  };
  // Snap:
  if (dist.right < 32 && dist.right < dist.left) {
    appwindow.innerBounds.left += dist.right
  } else if (dist.left < 32) {
    appwindow.innerBounds.left = 0
  }
  // Fall:
  if (origBottom < 32 || (window.resizeQueue && window.distBottom < 50)) {
    appwindow.innerBounds.top += dist.bottom;
  }
  window.resizeQueue = window.resizeQueue || 0;
  if (requested) {
    window.resizeQueue = window.resizeQueue + requested;
  } else if (window.resizeQueue) {
    window.resizeQueue--;
  } else {
    window.distBottom = dist.bottom;
  }
}

function copyElement(input) {
  input.select();
  input.focus();
  return document.execCommand('copy', true);
}

function applyKeyboardSelection(e) {
  var li = document.getElementsByTagName("li");
  for (var i = 0; i < li.length; i++) {
    if (li[i].classList.contains("active")) {
      li[i].classList.remove("active");
    }
    if (i == window.activeLi) {
      li[i].classList.add("active");
    }
  }
}

window.addEventListener("blur", function(e){
  closePopup(e);
});

window.addEventListener("focus", function(e){
  document.getElementById('clipsearch').lastElementChild.focus();
});


document.addEventListener('keyup', function(e) {
  if (e.code == "KeyC" && e.ctrlKey) {
    closePopup(e);
  }
  if (e.code == "Escape" || e.code == "BrowserBack") {
    closePopup(e);
  } else if (e.code == "ArrowUp") {
    window.activeLi = findVisible(-1);
    e.preventDefault();
    applyKeyboardSelection(e);
  } else if (e.code == "ArrowDown") {
    window.activeLi = findVisible(1);
    e.preventDefault();
    applyKeyboardSelection(e);
  } else if (e.code == "Return" || e.code == "Enter") {
    var elm = document.getElementsByTagName("li")[window.activeLi];
    elm.click(e);
  } else {
    applySearchFilter();
  }
});

function findVisible(dir) {
  var i, check, li = document.getElementsByTagName("li");
  i = window.activeLi + dir;
  if (dir >= 0) {
    check = function() { return i < li.length; }
  } else {
    check = function() { return i >= 0; }
  }
  for (i; check(); i += dir) {
    if (li[i] && li[i].style.display === "") {
      return i;
    }
  }
  return window.activeLi;
}


function applySearchFilter() {
  var appwindow = chrome.app.window.current(),
    input = window.clipsearch.lastElementChild,
    filter = input.value.toLowerCase(),
    li = window.cliplist.getElementsByTagName("li"),
    textarea, i, found = -1;
  if (input.value == window.lastsearch)
    return;
  window.distBottom = window.screen.availHeight - (appwindow.innerBounds.top + appwindow.innerBounds.height);
  for (i = 0; i < li.length; i++) {
    textarea = li[i].getElementsByTagName("textarea")[0];
    if (textarea.value.toLowerCase().indexOf(filter) > -1) {
      li[i].style.display = "";
      found = found >= 0 ? found : i;
    } else {
      li[i].style.display = "none";
    }
  }
  if (found >= 0) {
    window.activeLi = found;
    applyKeyboardSelection();
  }
  window.lastsearch = input.value;
  //window.getComputedStyle(document.body);
  sizeWindow(true);
}
