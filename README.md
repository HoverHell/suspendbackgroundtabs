Suspend Background Tabs
=======================

Suspend Background Tabs is a proof-of concept Firefox and SeaMonkey extension, it will suspend all delayed actions in background tabs. This helps saving CPU time which is all left to the active tab. There are significant drawbacks however, e.g. suspending tabs which actually do something useful in background, also some websites will process all queued up actions at once when unsuspended which will cause hangs. The source code here is provided for historical reasons, use at your own risk.

Prerequisites
-------------
* [Python 2.7](https://www.python.org/downloads/)
* [Jinja2 module for Python](http://jinja.pocoo.org/docs/intro/#installation)

How to build
------------

Run the following command:

    python build.py build

This will create a development build with the file name like `suspendbackgroundtabs-1.2.3.nnnn.xpi`. In order to create a release build use the following command:

    python build.py build --release

How to test
-----------

Testing your changes is easiest if you install the [Extension Auto-Installer extension](https://addons.mozilla.org/addon/autoinstaller/). Then you can push the current repository state to your browser using the following command:

    python build.py autoinstall 8888

Suspend Background Tabs will be updated automatically, without any prompts or browser restarts.
