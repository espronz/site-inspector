function messageHandler (data){

    if (data.message_id === "certinfo_popup") {
	
	document.getElementById("checkbox_label").
	    textContent = "Disable 'uglification' for " + data.domain_name;

	document.addEventListener("click", function (e,g) {
	    checkboxAction (data, e);
	});

	document.getElementById ("siteinfo_yn_site_text").
	    textContent = data.domain_name;

	browser.storage.local.get("uglification_status")
	    .then((result) => {
		if (result.uglification_status && data.cert_level < 2) {
		    document.getElementById("uglify_stuff").classList.remove("hide");
		}

	    })

	if (data.cert_level < 2) {
	    setCheckbox(data.domain_name, "ugl_whitelist", "uglify_whitelist");
	}

	// site per site checkbox
	setCheckbox (data.domain_name, "siteinfo_yn_site", "disable_siteinfo");
	
	// set global checkbox
	setCheckbox ("disable_siteinfo_global", "siteinfo_yn_global", "");
	
    }
}

function setWhitelistCheckbox (domain_name) {
    browser.storage.local.get(domain_name).then((fulfill) => {
	let whitelist_enabled = fulfill[domain_name].uglify_whitelist;
	document.getElementById("ugl_whitelist").checked = whitelist_enabled;	
    });
}

function setCheckbox (search_term, elemId, property) {
    browser.storage.local.get(search_term).then((fulfill) => {
	property !== "" ? document.getElementById(elemId).checked = fulfill[search_term][property]
	    : document.getElementById(elemId).checked = fulfill[search_term]
    });
}

function checkboxAction(data, e){
    if (e.target.id === "ugl_whitelist") {
	// add to whitelist
	browser.storage.local.set({[data.domain_name]: {
	    uglify_whitelist: e.target.checked
	}});

	// send message to content script
	browser.tabs.sendMessage (data.tabId, {
	    message_id: "enable_uglification",
	    enable_uglification: !e.target.checked
	});
    }

    else if (e.target.id === "siteinfo_yn_global") {
	// add status to local storage
	browser.storage.local.set({disable_siteinfo_global: e.target.checked});

	let localbox = document.getElementById("siteinfo_yn_site").checked;
	browser.tabs.query({}).then((result) => {

	    for (tab of result) {
		browser.tabs.sendMessage(tab.id, {
		    message_id: "disable_siteinfo_global",
		    siteinfo: e.target.checked,
		    otherbox: localbox
		});
	    }
	});

	// send message to content script

    }

    else if (e.target.id === "siteinfo_yn_site") {
	// add status to local storage
	browser.storage.local.get(data.domain_name)
	    .then((result) => {
		result[data.domain_name].disable_siteinfo = e.target.checked;
		browser.storage.local.set(result);
	    });

	// send message to content script
	let globalbox = document.getElementById("siteinfo_yn_global").checked;
	browser.tabs.sendMessage(data.tabId, {
	    message_id: "disable_siteinfo_site",
	    siteinfo: e.target.checked,
	    otherbox: globalbox
	});
    }
}

browser.runtime.sendMessage({message_id: "popup"});
browser.runtime.onMessage.addListener(messageHandler);
