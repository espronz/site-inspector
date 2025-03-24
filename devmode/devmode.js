function setMasterCheckbox () {
    browser.storage.local.get("uglification_status").then((fulfill) => {
	document.getElementById("uglification_master").checked = fulfill.uglification_status;
    });
}

function checkboxAction(e){
    e.target.checked ? uglifyMasterEnable(true)
	: uglifyMasterEnable(false);
}

function uglifyMasterEnable (status) {
    browser.storage.local.set({uglification_status: status})
	.then (browser.storage.local.get("uglification_status").then((fulfill) => {
	    console.log(fulfill);
	}));
}

function clearStorage() {
    browser.storage.local.get("uglification_status")
	.then((fulfill) => {
	    browser.storage.local.clear();
	    browser.storage.local.set({uglification_status: fulfill.uglification_status});
	    let object = {
		"www.autozone.com": {uglify: false},
		"www.t-mobile.com": {uglify: false},
		"account.t-mobile.com": {uglify: false},
		"www.svbconnect.com": {uglify: false},
		"www.svb.com": {uglify: false},
		"www.tiffany.com": {uglify: false},
		"www.cnb.com": {uglify: false},
		"www.cabelas.ca": {uglify: false},
		"www3.mtb.com": {uglify: false},
		"www.chewy.com": {uglify: false}
	    }
	    browser.storage.local.set(object);
	});
}

document.getElementById("uglification_master").onclick = checkboxAction;
document.getElementById("clear_storage").onclick = clearStorage;

setMasterCheckbox();
