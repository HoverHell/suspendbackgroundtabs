/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

let {WindowObserver} = require("windowObserver");
new WindowObserver({
  applyToWindow: function(window)
  {
    if (!("gBrowser" in window) || !("browsers" in window.gBrowser))
      return;

    let browsers = window.gBrowser.browsers;
    for (let i = 0; i < browsers.length; i++)
      suspendBrowser(browsers[i], browsers[i] != window.gBrowser.selectedBrowser);

    window.gBrowser.tabContainer.addEventListener("TabOpen", onTabModified, false);
    window.gBrowser.tabContainer.addEventListener("TabClose", onTabModified, false);
    window.gBrowser.tabContainer.addEventListener("TabAttrModified", onTabModified, false);
  },

  removeFromWindow: function(window)
  {
    if (!("gBrowser" in window) || !("browsers" in window.gBrowser))
      return;

    let browsers = window.gBrowser.browsers;
    for (let i = 0; i < browsers.length; i++)
      suspendBrowser(browsers[i], false);

    window.gBrowser.tabContainer.removeEventListener("TabOpen", onTabModified, false);
    window.gBrowser.tabContainer.removeEventListener("TabClose", onTabModified, false);
    window.gBrowser.tabContainer.removeEventListener("TabAttrModified", onTabModified, false);
  }
});

let Observer =
{
  topic : "content-document-global-created",

  init: function()
  {
    Services.obs.addObserver(this, this.topic, true);
    onShutdown.add(function() {
      Services.obs.removeObserver(this, this.topic);
    }.bind(this));
  },

  observe: function(subject, topic, data)
  {
    if (topic != this.topic || !(subject instanceof Ci.nsIDOMWindow))
      return;

    // We need top-level windows only
    if (subject.parent != subject)
      return;

    // Try to get the <browser> element for that window
    let window = subject.QueryInterface(Ci.nsIInterfaceRequestor)
                        .getInterface(Ci.nsIWebNavigation)
                        .QueryInterface(Ci.nsIDocShellTreeItem)
                        .rootTreeItem
                        .QueryInterface(Ci.nsIInterfaceRequestor)
                        .getInterface(Ci.nsIDOMWindow);
    if (window.document.readyState != "complete" || !("gBrowser" in window))
      return;

    let browser = window.gBrowser.getBrowserForDocument(subject.document);
    if (!browser || !("__sbtSuspended" in browser))
      return;

    // New document loaded into a suspended tab, suspend it
    suspendBrowser(browser, true, true);
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver, Ci.nsISupportsWeakReference])
};
Observer.init();

function onTabModified(event)
{
  let tab = event.target;
  let window = tab.ownerDocument.defaultView;
  suspendBrowser(window.gBrowser.getBrowserForTab(tab), event.type != "TabClose" && tab != window.gBrowser.selectedTab);
}

function suspendBrowser(browser, suspend, force)
{
  if (!force && ("__sbtSuspended" in browser) == suspend)
    return;   // Nothing to do

  let utils = browser.contentWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                     .getInterface(Components.interfaces.nsIDOMWindowUtils);
  if (suspend)
  {
    utils.suppressEventHandling(true);
    utils.suspendTimeouts();
    browser.__sbtSuspended = true;
  }
  else
  {
    utils.suppressEventHandling(false);
    utils.resumeTimeouts();
    delete browser.__sbtSuspended;
  }
}

