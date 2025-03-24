"use strict";



var saved_details;
var security_info;
var dev_mode = false;

var tabdata = {};

const d = new Date();
let time = d.getTime();

function getDomainOwner (certificates, idlevel) {

    if (idlevel <= 1) return "unknown";

    let regex = /O=(.*?),[^\s]/;
    let subject = certificates[0].subject;

    return regex.exec(subject)[1].replaceAll("\"", "");
}

function getDomainName (url){
    let regex = /^(?:https?:\/\/)?(?:[^@\n]+@)??([^:\/\n]+)/im;
    return regex.exec(url)[1]    
}

function getCertLevel (security_info) {
    return security_info.state !== "secure" ? 0
	: security_info.isExtendedValidation ? 3
	: security_info.certificates[0].subject.includes("O=") ? 2
	: 1;
}

function certHandler(details){
console.log("Hello the listener has fired. Thank you.");
    saved_details = details;
    getSecurityInfo(details);
    let domain_name = getDomainName(details.url);

    let saveobject = {
	domain_name: domain_name,
	visited_before: true
    }

    browser.storage.local.set(saveobject);
}

function setIcon(certlevel){
    let icon = identityIconPath(certlevel);
    browser.browserAction.setIcon({
	path: "./" + icon
    });
}

function identityIconPath (certlevel) {
    switch (certlevel) {
    case 3:
	return "icons/id-shield.svg";
    case 2:
	return "icons/id-ov2.svg";
    case 1:
    case 0:
	return "icons/id-unknown5-blur.svg";
    }
}

function getSecurityInfo (details){

 

   let promise = new Promise ((resolve, reject) => {
	resolve(browser.webRequest.getSecurityInfo(details.requestId, {}));
    });

    promise.then(value => {
	security_info = value;
    });
}

browser.webRequest.onHeadersReceived.addListener (
    certHandler, {
	urls: ["<all_urls>"],
	types: ["main_frame"]
    }, ["blocking"]
);

function messageHandler (message) {

    let tabId = saved_details.tabId;
    let domain_name = getDomainName(saved_details.url);
    let domain_changed;

    if (!Object.keys(tabdata).includes(tabId.toString())) {
	
	tabdata[tabId] = {
	    domain_name: domain_name,
	    pos_left: null,
	    pos_top: null
	}
	domain_changed = false;
    }

    else {
	domain_changed = tabdata[tabId].domain_name !== domain_name;

	if (domain_changed) {
	    tabdata[tabId].pos_left = null;
	    tabdata[tabId].pos_top = null;
	}
	
	tabdata[tabId].domain_name = domain_name;
    }

    if (message.message_id === "content_script" || message.message_id === "popup"){

	let cert_level = getCertLevel(security_info);
	let domain_owner = getDomainOwner(security_info.certificates, cert_level);

	let return_message = {
	    domain_name: tabdata[tabId].domain_name,
	    cert_level: cert_level,
	    domain_owner: domain_owner,
	    domain_changed: domain_changed,
	    tabId: tabId,
	    box_position: {pos_left: tabdata[tabId].pos_left, pos_top: tabdata[tabId].pos_top}
	}

	if (message.message_id === "content_script") {
	    return_message.message_id = "certinfo_contentscript"
	    setIcon(getCertLevel(security_info));
	    browser.tabs.sendMessage (tabId, return_message);	
	}

	else if (message.message_id === "popup") {
	    return_message.message_id = "certinfo_popup"
	    browser.runtime.sendMessage(return_message);
	}
    }
    
    else if (message === "visited_before") {

	let visited_before = false;

	browser.storage.local.get(domain_name).then ((fulfill) => {

	    // if there is no previous entry for this domain
	    if (Object.keys(fulfill).length === 0){
		let object = {
		    [domain_name]: {uglify: false}
		}
		browser.storage.local.set(object);
	    }

	    // if there is a previous entry for this domain
	    else {
		visited_before = true;
	    }

	    let return_message = {
		message_id: "visited_before",
		visited_before: visited_before
	    }
	    browser.tabs.sendMessage (tabId, return_message);
	});
    }

    else if (message.message_id === "save_position"){
	tabdata[tabId].pos_top = message.top;
	tabdata[tabId].pos_left = message.left;
    }

}

function commandHandler (data) {
    // dev_mode = !dev_mode;
    // browser.runtime.sendMessage({message_id: "dev_mode", dev_mode: dev_mode});
    browser.tabs.create({url: 'devmode/devmode.html'});    
}

// disable uglification by default
browser.storage.local.set({uglification_status: false});

browser.commands.onCommand.addListener(commandHandler);
browser.runtime.onMessage.addListener(messageHandler);

// browser.tabs.create({url: 'popup/popup.html'});
