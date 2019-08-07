# Clipboard Manager

A simple clipboard history manager.

Similar to Parcellite, ClipMenu, Klipper and the Gnome Clipboard Indicator, but for ChromeOS.

![Clipboard Manager Promo Image](https://user-images.githubusercontent.com/387779/62663923-4d6af480-b92e-11e9-8836-ca5d9f9ff111.png)


## What it does

  * Keeps track of what you copy and allowing to you restore it to the clipboard.
  * History list survives between reboots, unless the cache is disabled.
  * Remove individual entries or clear the entire history.
  * Basic search.

Mostly made to meet my own needs, and doesn't require any dangerous permissions.

## Where it falls short

  * Keyboard shortcut configuration for Apps is [not currently working](chrome://extensions/shortcuts) on recent versions of ChromeOS.
    - The shortcut may still work if it was already configured, or you can follow [markstos's advice](https://github.com/rickybrent/clipboard-manager-chromeos/issues/3) for a workaround.
  * The selection isn't automatically pasted after being selected.
    - It would be nice to offer this as an option, but it's difficult for technical reasons.

Available on the [chrome store](https://chrome.google.com/webstore/detail/clipboard-manager/hlmagkbphobghocaimgijjjpmionjcnj).

## How to get it

The easiest way is to click here:
[![chrome store badge](https://user-images.githubusercontent.com/387779/62664073-f6195400-b92e-11e9-8998-6a4acc0f1962.png)](https://chrome.google.com/webstore/detail/clipboard-manager/hlmagkbphobghocaimgijjjpmionjcnj)

You could also clone this repo and add it as an unpacked extension.
