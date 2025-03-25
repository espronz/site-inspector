browser.runtime.sendMessage({message_id: "content_script"});
browser.runtime.sendMessage({message_id: "get_position"})
browser.runtime.onMessage.addListener(messageHandler);

const EXTRA_INFO_LABEL_ID =
      ["What is owner verification?", "Who performs owner verification?"];
const EXTRA_INFO_TEXT_ID =
      ["<p> Website owners can opt to undergo a background check to help demonstrate to visitors that they are a legitimate organization." +
       "<p style='margin-bottom: 4px'> There are two levels of background checks. " +
       "<ul><li><b>Basic</b> checks ensure that the organization is valid and in good standing. " +
       "<li><b>Enhanced</b> checks add further steps. These include verifying the legal status and physical location of the owning organization.</ul>",
       "<p> Website owner verification is done by trusted third party organizations called <b>Certificate Authorities (CAs)</b>." +
       "<p> Web browsers (e.g. Google Chrome, Microsoft Edge, Mozilla Firefox) accept verification results only from a select number of CAs."];

const EXTRA_INFO_LABEL_ENC = ["What is encryption?"];

const EXTRA_INFO_TEXT_ENC =
      ["<h4>In general:</h4> <br> Encryption is a means of securing data by making it unreadable to anyone except those who possess a particular secret key (basically a special password)." + " <p>The keys cannot be randomly guessed." + "<p> <h4>In web browsing:</h4>" +
       "<br> A new secret key is created every time you connect to the website. This key is destroyed when the connection ends. <p>The data you exchange with the website is encrypted before it is sent, and decrypted at its destination."];

function messageHandler (data) {
    if (data.message_id === "certinfo_contentscript"){
		
		makeBox(data);

		let global_disable_search = browser.storage.local.get("disable_siteinfo_global");
		let site_disable_search = browser.storage.local.get(data.domain_name);

		Promise.all ([global_disable_search, site_disable_search]).then ((values) => {
			let site_disable = values[1][data.domain_name].disable_siteinfo;
			let global_disable = values[0].disable_siteinfo_global;

			if (!site_disable && !global_disable) {
				document.getElementById("wrapper_box").classList.remove("hidebox");
			}
		})

		if (data.cert_level < 4){
			let master_status = browser.storage.local.get("uglification_status");
			let whitelist_status = browser.storage.local.get(data.domain_name);

			Promise.all ([master_status, whitelist_status]).then((values) => {
				if (values[0].uglification_status && !values[1][data.domain_name].uglify_whitelist) {
					document.body.classList.add("invert_colours");
 					document.getElementById("wrapper_box").classList.add("invert_colours");
				}
			});
		}
    }

    else if (data.message_id === "enable_uglification") {

		if (!data.enable_uglification){
			document.body.classList.remove("invert_colours");
			document.getElementById("wrapper_box").classList.remove("invert_colours");
		} else if (data.enable_uglification){
			document.body.classList.add("invert_colours");
			document.getElementById("wrapper_box").classList.add("invert_colours");
		}
    }
    
    else if (data.message_id === "visited_before"){
		if (!data.visited_before) {
			document.getElementById("alert_box").classList.remove("hidebox");
		}
    }

    else if (data.message_id === "disable_siteinfo_site"){
		!data.siteinfo && !data.otherbox ? document.getElementById("wrapper_box").classList.remove("hidebox")
			: document.getElementById("wrapper_box").classList.add("hidebox")
    }

    else if (data.message_id === "disable_siteinfo_global"){
		!data.siteinfo && !data.otherbox ? document.getElementById("wrapper_box").classList.remove("hidebox")
			: document.getElementById("wrapper_box").classList.add("hidebox")
    }
}


function encryptionIcon (data) {
    return data.cert_level > 0 ? "icons/lock-small.svg"
		: "icons/lock-un-small.svg";
}

function identityIcon (data) {
    switch (data.cert_level) {
    case 3:
		return "icons/id-shield.svg";
    case 2:
		return "icons/id-ov2.svg";
    case 1:
    case 0:
		return "icons/id-unknown5-blur.svg";
    }
}

function getEncryptionStatusText (data) {
    return data.cert_level > 0 ? "Connection encrypted" : "Connection <b>not</b> encrypted";
}

function getEncryptionMainText (data) {
    return data.cert_level > 0 ?
		"The data you exchange with <i>" + data.domain_name + "</i> can only be read by you and the owners of <i>" + data.domain_name + " </i>(<b>" + data.domain_owner +"</b>)." :
		"The data you exchange with <i>" + data.domain_name + "</i> can be intercepted by attackers.";
}

function getIdentityStatusText (data) {
    return "Owner: <b> " + data.domain_owner + "</b>";
}

function getIdentityText (data) {
    switch (data.cert_level) {
    case 3:
		return "An enhanced background check has verified that <b>" + data.domain_owner + " </b> is a legitimate organization."
    case 2:
		return "A basic background check has verified that <b>" + data.domain_owner + " </b> is a legitimate organization."
    case 1:
    case 0:
		return "The owners of <i>" + data.domain_name + "</i> have <b>not</b> undergone a background check to verify their identity.";
    }
}

function createMainPanel (maintext, extraInfoLabels, divID) {
    let div = document.createElement("div");
    div.classList.add("textcontainer");

    let textdiv = document.createElement("div");
    textdiv.classList.add("textbody");
    
    let para = document.createElement("div");
    para.innerHTML = DOMPurify.sanitize(maintext);

    textdiv.appendChild(para);
    div.appendChild(textdiv);

    let extrainfodiv = document.createElement("div");
    extrainfodiv.classList.add("extrainfodiv");

    extraInfoLabels.forEach(function(curval, index, arr){

		let acchead = document.createElement("button");
		acchead.classList.add("accordion");
		acchead.innerHTML = DOMPurify.sanitize(extraInfoLabels[index]);
		acchead.onclick = function () { toggleAccordionPanel(this) };
		
		let panel = document.createElement("div");
		panel.classList.add("extrainfopanel");
		panel.style.maxHeight = "0px";
		panel.innerHTML = DOMPurify.sanitize(divID === "identity_div" ? EXTRA_INFO_TEXT_ID[index] : EXTRA_INFO_TEXT_ENC [index]);

		extrainfodiv.appendChild(acchead);
		extrainfodiv.appendChild(panel);
    });
    div.appendChild(extrainfodiv);
    return(div);    
}

function toggleAccordionPanel (element) {
    element.classList.toggle("activeextrainfo");

    let panel = element.nextElementSibling;
    let textbox = element.offsetParent;
    let divID = textbox.firstChild.id;
    let div = document.getElementById(divID);

    let divheight = textbox.scrollHeight;

    // If growing  panel
    if (isHidden(panel)) {
		panel.style.maxHeight = panel.scrollHeight + "px";
		divheight += panel.scrollHeight;
		div.style.maxHeight = divheight  + "px";

		panels = document.getElementById(divID).getElementsByClassName("extrainfopanel");
		for (let x of panels){
			// Shrink panels other than the selected one
			let showing = x.style.maxHeight !== "0px";
			if (x != panel && showing){
				x.previousSibling.classList.toggle("activeextrainfo");
				x.style.maxHeight = "0px";
				divheight -= x.scrollHeight;
			}
		}
    }
    
    // If shrinking panel
    else {
		panel.style.maxHeight = "0px";
		divheight -= panel.scrollHeight;
		
		textbox.addEventListener("webkitTransitionEnd", function (event) {
			div.style.maxHeight = divheight  + "px";    
			this.removeEventListener("webkitTransitionEnd", arguments.callee);
		});
    }
    textbox.style.maxHeight = divheight + "px";
}

function isHidden (div) {
    return div.style.maxHeight === "0px";
}

function toggleAccordionMain (element){

    element.classList.toggle("iconactive");
    let textbox = element.lastChild;

    let identity_div = document.getElementById("identity_div");
    let textbox_id = identity_div.firstChild.offsetParent;

    let encryption_div = document.getElementById("encryption_div");
    let textbox_enc = encryption_div.firstChild.offsetParent;
    
    // Clicking "encryption"
    if (element.id === "encryption_box"){
		// if ENC is showing
		isHidden(encryption_div) ?
			// if ID is showing vs hidden
	    isHidden(identity_div) ? openTextArea(encryption_div) : openCloseTextArea(encryption_div, identity_div)
		// if ENC is hidden
		: closeTextArea(encryption_div);
    }
    
    // Clicking "identity"
    else {
		//if ID is showing
		isHidden(identity_div) ?
			//if ENC is showing vs hidden
	    isHidden(encryption_div) ? openTextArea(identity_div) : openCloseTextArea(identity_div, encryption_div)
		// if ID is hidden
		: closeTextArea(identity_div);
    }
}

function openTextArea (div) {
    div.style.maxHeight = div.scrollHeight + "px";
    div.style.opacity = "1";
    let textbox = div.offsetParent;
    textbox.style.maxHeight = div.scrollHeight + "px";
}

function closeTextArea (div){
    closeAccordions(div);
    let textbox = div.offsetParent;
    textbox.style.maxHeight = "0px";
    div.addEventListener ('webkitTransitionEnd', function (event) {
		this.style.maxHeight = "0px";
		this.removeEventListener('webkitTransitionEnd', arguments.callee);
    });

    div.style.opacity = "0";
}

function openCloseTextArea (divOpen, divClose){
    divClose.addEventListener("webkitTransitionEnd", function (event) {
		divClose.style.maxHeight = "0px";
		this.removeEventListener("webkitTransitionEnd", arguments.callee);
    })

    closeAccordions(divClose);
    divOpen.style.maxHeight = divOpen.scrollHeight + "px";

    let textbox_open = divOpen.offsetParent;
    let textbox_close = divClose.offsetParent;

    textbox_close.previousSibling.classList.toggle("iconactive");
    textbox_close.style.maxHeight = "0px";    
    textbox_open.style.maxHeight = divOpen.scrollHeight + "px";

    divClose.style.opacity = "0";
    divOpen.style.opacity = "1";

}

function closeAccordions (div) {
    elements = div.getElementsByClassName("accordion");
    for (let x of elements) if (x.classList.contains("activeextrainfo")) toggleAccordionPanel(x)
}

// Make the DIV element draggable:
function dragElement(mover, elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    mover.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;

		browser.runtime.sendMessage({
			message_id: "save_position",
			top: elmnt.style.top,
			left: elmnt.style.left
		})
    }
}

function makeBox (data) {

    // URL box
    let box_a = document.createElement("div");
    box_a.id = "wrapper_boxheader";
    box_a.classList.add("box_siteinsp");
    box_a.classList.add("domainbox");
    box_a.innerHTML = DOMPurify.sanitize("Site information for <b>" + data.domain_name + "</b>");

    let alertbox = document.createElement("div");
    alertbox.id = "alert_box";
    alertbox.classList.add("box_siteinsp");
    alertbox.classList.add("hidebox");
    browser.runtime.sendMessage("visited_before")
    alertbox.textContent = "ⓘ You have never visited this domain before";

    // Create icon buttons
    let box_b = createIconButton(true)
    let box_c = createIconButton(false);

    // Create main text areas
    let textbox_id = createTextArea("textbox_id");
    let textbox_enc = createTextArea("textbox_enc");

    // Create text divs
    let identity_div = createTextDiv("identity_div");
    let encryption_div = createTextDiv("encryption_div");

    // Add text divs to text area
    textbox_id.appendChild (identity_div);
    textbox_enc.appendChild (encryption_div);

    // Putting it all together
    wrapper = document.createElement("div");
    wrapper.id = "wrapper_box";
    wrapper.classList.add("hidebox");

    // Add boxes to main box
    wrapper.appendChild(box_a);
    wrapper.appendChild(alertbox);
    wrapper.appendChild(box_b);
    wrapper.appendChild(textbox_id);
    wrapper.appendChild(box_c);
    wrapper.appendChild(textbox_enc);

    dragElement(box_a, wrapper);

    if (data.box_position.pos_top){
		wrapper.classList.remove("defaultpos");
		wrapper.style.top = data.box_position.pos_top;
		wrapper.style.left = data.box_position.pos_left;
    }
    else {
		wrapper.style.top="0px";
		wrapper.style.left = "0%"
    }

    document.body.appendChild(wrapper);

    // FUNCTIONS
    function createIconButton (isID) {

		let urlFunc, textFunc, id;
		
		if (isID) {
			urlFunc = identityIcon;
			textFunc = getIdentityStatusText;
			id = "identity_box";
		} else {
			urlFunc = encryptionIcon;
			textFunc = getEncryptionStatusText;
			id = "encryption_box";
		}
		
		let button = document.createElement("button");
		button.id = id;
		button.classList.add("box_siteinsp");
		button.classList.add("iconbox");

		let fullurl = browser.runtime.getURL(
			urlFunc(data)
		);

		let icon = document.createElement("img");
		icon.src = fullurl;

		let span = document.createElement("span");
		span.classList.add("buttonspan")
		span.innerHTML = DOMPurify.sanitize(textFunc(data));

		button.appendChild(icon);
		button.appendChild(span);

		button.onclick = function () {
			toggleAccordionMain(this);
		};
		
		return button;
    }

    function createTextArea (textboxID) {
		textbox = document.createElement("div");
		textbox.id = textboxID;
		textbox.classList.add("textareadiv");
		return textbox;
    }

    function createTextDiv (divID){

		let bodyText, extraInfoLabels = "";
		
		if (divID === "encryption_div") {
			bodyText = getEncryptionMainText(data);
			extraInfoLabels = EXTRA_INFO_LABEL_ENC;
		} else {
			bodyText = getIdentityText(data);
			extraInfoLabels = EXTRA_INFO_LABEL_ID;
		}

		let div = document.createElement("div");
		div.id = divID;
		div.classList.add("contentdiv");
		div.style.maxHeight = "0px";

		let newdiv = createMainPanel (bodyText, extraInfoLabels, divID);
		div.appendChild (newdiv) ;	

		return div;
    }
}
