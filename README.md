# Site Inspector
Site Inspector is a tool that communicates website identity and connection integrity in a user-friendly manner. It checks the website’s X.509 certificate on page load and visually indicates the certificate’s details through intuitive icons and text.

A research paper on Site Inspector, which includes a user study, will be published in the January 2025 edition of the ACM Transactions on Privacy and Security. 

## Certificate Types
The tool distinguishes between:
- Domain Validation (DV)
- Organization Validation (OV)
- Extended Validation (EV)
- No certificate or self-signed certificate

## Connection Security
It indicates whether the connection is encrypted (HTTPS) or not.
	
## Detailed Explanations
Rows with a `+` icon can be expanded to reveal easy-to-understand explanations of technical mechanisms and processes.

# How It Works

1.	Certificate Reading:
Upon page load, Site Inspector reads the website’s X.509 certificate.
2.	Icon & Text Updates:
Based on the certificate details and connection encryption status, the tool updates its icons and text to reflect the website’s security posture.
3.	Expandable Details:
Clickable rows (indicated with a +) provide additional technical information in plain language.

# Usage

Simply open any website with Site Inspector enabled, and the tool will automatically display the relevant identity and connection security information based on the site’s certificate and connection type.

# Install
Site Inspector is available on the Firefox Add-ons website:

https://addons.mozilla.org/en-US/firefox/addon/site-inspector/

# For Development
To set up a development environment using `web-ext`, follow these steps:

1. `git clone https://github.com/speroe/site-inspector.git && cd site-inspector/`
2. Install Node/npm
3. `npm install --save-dev web-ext`

Test the extension:
`web-ext run`

Build a package:
`web-ext build`
