window.cliphistory = [];
var default_settings = {
  history_size:15,
  preview_size:30,
  refresh_ms:1000,
  no_cache:false,
  notification:false,
  custom_icon:false,
  keep_open:false
};


function getTextarea(text) {
  var textarea = window.cliptextarea || document.createElement('textarea');
  textarea.textContent = text;
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  return textarea;
}

function getClipboardText() {
    var result = '';
    var textarea = getTextarea('');
    if (document.execCommand('paste')) {
        return textarea.value;
    }
    return 'FAILED';
}

function setClipboardText(text) {
    var textarea = getTextarea(text);
    return (document.execCommand("copy") && (getClipboardText() == text));
}

function clearClipboardHistory() {
    window.lastclip = "";
    window.cliphistory = [];
    saveHistory();
    updatePopup();
    updateContext();
}

function removeFromClipboard(id) {
  window.cliphistory.splice(id, 1);
  saveHistory();
  // Update the popup menus, if any.
  updatePopup();
  // Update the right click menu
  updateContext();
}

function saveHistory() {
  chrome.storage.local.set({
    ["cliphistory"]: ((window.settings && window.settings.no_cache) ? [] : window.cliphistory)
  });
}

function saveSettings() {
  chrome.storage.local.set({
    ["settings"]: window.settings
  });
}


function updateClipboardHistory() {
  var cb = getClipboardText();
  if (cb && cb != window.lastclip) {
    window.lastclip = cb;
    window.cliphistory.push(cb);
    dedupe();
    saveHistory();
    // Update the popup menus, if any.
    updatePopup();
    // Update the right click menu
    updateContext();
  }
}

function initPopup(popup, selectId) {
  updatePopup(selectId);
  if (!selectId) {
    popup.show();
    popup.focus();
  }
}

// Load the popup window. If the selection id is provided, select and close.
function loadPopup(e, selectId) {
  popup = chrome.app.window.get('clipboard_popup');
  if (!popup) {
    options = {
      'innerBounds': {
        'width': 270,
        'height': 270
      },
      'id': 'clipboard_popup',
      'frame':'none',
      'hidden':true,  // Start hidden for using a popup to copy text.
      'focused': (selectId ? false : true)  // Must set for panel mode.
    };
    if (settings.custom_icon) {
      options.icon = settings.custom_icon;
    }
    chrome.app.window.create('popup.html', options, function(popup){
      popup.contentWindow.settings = window.settings;
      popup.contentWindow.onload = function () {
        initPopup(popup, selectId);
      };
      popup.innerBounds.top = window.screen.availHeight - popup.innerBounds.height;
    });
  } else {
    initPopup(popup, selectId);
  }
}

function showOptions(){
  chrome.app.window.create("options.html", {
    'innerBounds': {
      'width': 507,
      'height': 164
    }
  })
}

function dedupe() {
  let length = window.cliphistory.length, result = [], seen = new Set();
  let end = Math.max(length - window.settings.history_size, 0);
  outer:
  for (let index = length -1; index >= end; index--) {
    let value = window.cliphistory[index];
    if (seen.has(value)) continue outer;
    seen.add(value);
    result.push(value);
  }
  window.cliphistory = result.reverse();
}

function updatePopup(sel) {
  var popup = chrome.app.window.get('clipboard_popup');
  if (popup) {
    popup.contentWindow.postMessage([window.cliphistory, sel], "*");
  }
}

function updateContext() {
  if (!window.contextUpdate) {
    window.contextUpdate = true;
    chrome.contextMenus.removeAll(function() {
      let length = window.cliphistory.length;
      let end = Math.max(length - chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT, 0);
      for (var i = length - 1; i >= end; i--) {
        if (window.cliphistory[i]) {
          chrome.contextMenus.create({
            'type': 'radio',
            'checked': (i == length),
            'id': ("paste" + i),
            'title': (window.cliphistory[i]),
            'contexts': ['launcher'],
          });
        }
      }
      chrome.contextMenus.create({
        'type': 'separator',
        'id': ("pastesep"),
        'title': "-",
        'contexts': ['launcher'],
      });
      /*
      chrome.contextMenus.create({
        'type': 'checkbox',
        'id': ("pasteprivate"),
        'title': "Private Mode",
        'contexts': ['launcher'],
      });
      */
      chrome.contextMenus.create({
        'type': 'normal',
        'id': ("pasteclear"),
        'title': "Clear history",
        'contexts': ['launcher'],
      });
      chrome.contextMenus.create({
        'type': 'normal',
        'id': ("pasteoptions"),
        'title': "Settings",
        'contexts': ['launcher'],
      });
      window.contextUpdate = false;
    });
  }
}


chrome.contextMenus.onClicked.addListener(function(obj) {
  var id = obj.menuItemId.slice(5);
  switch (id) {
    case 'clear':
      clearClipboardHistory();
      break;
    case 'options':
      showOptions();
      break;
    case 'sep':
      break;
    default:
      if (!setClipboardText(window.cliphistory[id])){
        loadPopup(null, id);
      }
  }});


function init(callback) {
  if (!window.cliphistory || !window.settings) {
    // Load clipboard history and settings.
    chrome.storage.local.get(["cliphistory", "settings"], function(keys) {
      window.settings = (keys["settings"] !== undefined) ? keys["settings"] : default_settings;
      if (keys["cliphistory"] !== undefined) {
        window.cliphistory = keys["cliphistory"];
        updateClipboardHistory();
        updateContext();
      }
    });
  } else if (callback) {
    callback();
  }
  chrome.clipboard.onClipboardDataChanged.addListener(function(){ updateClipboardHistory(); });
}

// Keybindings.
chrome.commands.onCommand.addListener(function(command) {
    if (command == "show-clipboard-history") {
      init(loadPopup);
    }
});

chrome.app.runtime.onLaunched.addListener(function(){
  init(loadPopup);
});
// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
  init();
});
init(loadPopup);