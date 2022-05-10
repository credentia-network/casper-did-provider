# Contributing to casper-did-resolver

The following is a set of rules and guidelines for contributing to this repo. Please feel free to propose changes to this document in a pull request.

## Submitting issues

If you have questions about how to set up your account to use casper-did-driver, and how it would be seen on [Casper.Credentia.me](https://casper.credentia.me/), please direct these to following email *s@credentia.me*

### Guidelines
* Please search the existing issues first, it's likely that your issue was already reported or even fixed.
  - Go to the main page of the repository, click "issues" and type any word in the top search/command bar.
  - You can also filter by appending e. g. "state:open" to the search string.
  - More info on [search syntax within GitHub](https://help.github.com/articles/searching-issues)

## Contributing to casper-did-driver

All contributions to this repository from June 11, 2021 on are considered to be licensed under MIT License.

Workflow for contributions:
* Check open issues and unmerged pull requests to make sure the topic is not already covered elsewhere
* Create an Enhancement Proposal issue by filling in the relevant parts of the template
* Revise your proposal based on the feedback from the discussions
* After reaching reasonable consensus, create a pull request to incorporate your proposal to the standard

### Sign your work

We use the Developer Certificate of Origin (DCO) as a additional safeguard
for the casper-did-driver project. This is a well established and widely used
mechanism to assure contributors have confirmed their right to license
their contribution under the project's license.
Please read [developer-certificate-of-origin](https://github.com/make-software/casper-did-driver/blob/master/.github/developer-certificate-of-origin).
If you can certify it, then just add a line to every git commit message:

````
  Signed-off-by: Random J Developer <random@developer.example.org>
````

Use your real name (sorry, no pseudonyms or anonymous contributions).
If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`. You can also use git [aliases](https://git-scm.com/book/tr/v2/Git-Basics-Git-Aliases)
like `git config --global alias.ci 'commit -s'`. Now you can commit with
`git ci` and the commit will be signed.
