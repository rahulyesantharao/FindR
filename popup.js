//---------------------- Listen For Unload --------------------
// Connect to background page to listen for unload
chrome.runtime.connect({name:"listenForUnload"});

// set number of matches and current position
// chrome.storage.onChanged.addListener(function(changes) {
chrome.runtime.onMessage.addListener(function(message) {
    // console.log("Values Changed");
    // if(changes.numMatches || changes.curPos) {
    if(message.type=="setValues") {
        chrome.storage.local.get({"numMatches":-1, "curPos":-1}, function(data) {
            if((typeof data.numMatches == "undefined")||(typeof data.curPos == "undefined")) { // error
            }
            else {
                console.log(data.curPos.toString() + " of " + data.numMatches.toString());
                if(curWord!="") {
                    if(data.curPos==0) $("#status").addClass("error");
                    else $("#status").removeClass();
                    $("#status").text(data.curPos.toString() + " of " + data.numMatches.toString());
                }
            }
        });
    }
});

// ------------------ Variables -----------------------------
var mC; // bool to match case or not
var wW; // bool for whole words or not
var rX; // bool for regex or not
var iF; // bool for input fields
var curWord; // current search word
var curReplaceText; // current replace text

// ------------------ RegEx Formatting -----------------------------
function spaces(string) {
    return string.replace(/ /g, "(?: |\u00a0)");
}

function quotes(string) {
    return string.replace(/"/g, "\\\"");
}

function escapeHTML(s) {
    return s.replace(/[&"<>]/g, function(c) {
        return {
            '&': '&amp;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        }[c];
    });
}

function escapeLit(string) {
	return string.replace(/\\/g, "\\\\\\$&").replace(/[.*+?^${}()|[\]]/g, "\\\\$&");
}

function escapeRegExp(string){
	return string.replace(/\\/g, "\\$&");
}

function empty(string, mod) {
	console.log("empty(" + string + ", " + mod + ")");
	var test = "This is a test string that will catch any empty regex.";
	var regx = new RegExp(string, mod);
	var matches = test.match(regx);
	if(matches) {
		for(var i=0; i<matches.length; i++) {
			if(matches[i]=="") {
				console.log("  - Empty 2");
				return true;
			}
		}
	}
	console.log("  - Not Empty");
	return false;
}

// ------------------ Button Functions -----------------------------
// UHLAll: unhighlights all matches
function UHLAll() {
	$("#status").text(""); $("#status").removeClass();
    // ----- unhighlights all matches -----
    chrome.tabs.executeScript({code: 'testUHL();'});
}

// findAll: highlights all matches, focuses on first
function findAll() {
    // $("#status").text(""); $("#status").removeClass();
    // ----- build search regex -----
    var reg;
    var mod;
    if(rX) {
    	// build mod
    	mod="";
    	if($("#global-toggle").is(":checked")) mod+="g";
    	if($("#case-toggle").is(":checked")) mod+="i";
    	if($("#multiline-toggle").is(":checked")) mod+="m";
    	
    	// check inputted regex
    	try {
    		new RegExp(curWord);
    	} catch(e) {
    		console.log("Invalid Regular Expression");
            UHLAll();
    		$("#status").text("Error");
            $("#status").addClass("error");
    		return;
    	}

    	if(empty(curWord, mod)) {
    		console.log("Empty Regular Expression");
            UHLAll();
    		$("#status").text("Infinite");
            $("#status").addClass("error");
    		return;
    	}
    	reg = quotes(escapeRegExp(curWord));
    }
    else {
    	mod="g";
        if(wW) {
            reg = "\\\\b" + quotes(spaces(escapeLit(curWord))) + "\\\\b";
        }
        else {
            reg = quotes(spaces(escapeLit(curWord)));
        }
        if(!mC) mod+="i";
    }
    console.log("findAll("+reg+", "+mod+")");
    // ----- find and focus -----
    chrome.tabs.executeScript({code: 'fAll("'+ reg+ '", "' + mod + '");'});
}

// replaceAll: unhighlights all the matches and replaces all of them (including tab title)
function replaceAll(str) {
    console.log("replaceAll called");
    // ----- build search regex -----
    // $("#status").text(""); $("#status").removeClass();
    var reg;
    var mod;
    if(rX) {
    	// build mod
    	mod="";
    	if($("#global-toggle").is(":checked")) mod+="g";
    	if($("#case-toggle").is(":checked")) mod+="i";
    	if($("#multiline-toggle").is(":checked")) mod+="m";
    	
    	// check inputted regex
    	try {
    		new RegExp(curWord);
    	} catch(e) {
    		console.log("Invalid Regular Expression");
    		$("#status").text("Error");
            $("#status").addClass("error");
    		return;
    	}

    	if(empty(curWord, mod)) {
    		console.log("Empty Regular Expression");
    		$("#status").text("Infinite");
            $("#status").addClass("error");
    		return;
    	}
    	reg = quotes(escapeRegExp(curWord));
    }
    else {
    	mod="g";
        if(wW) {
        	// reg = "(?:\\\\W|^)" + escapeLit(curWord) + "(?:\\\\W|$)";
            reg = "\\\\b" + quotes(spaces(escapeLit(curWord))) + "\\\\b";
        }
        else {
            reg = quotes(spaces(escapeLit(curWord)));
        }
        if(!mC) mod+="i";
    }
        
    // ----- unhighlight and replace all -----
    if(!iF) chrome.tabs.executeScript({code: 'rAll("' + reg + '", "' + mod + '", "' + str + '");'});
    else chrome.tabs.executeScript({code: 'rInput("' + reg + '", "' + mod + '", "' + str + '");'});
}

// findNext: moves focus to the next match
function findNext() {
    chrome.tabs.executeScript({code: 'focusNext();'});
}

// findPrev: moves focus to the previous match
function findPrev() {
    chrome.tabs.executeScript({code: 'focusPrev();'});
}

// replaceNext: replaces the current match and moves focus to next
function replaceNext(str) {
    chrome.tabs.executeScript({code: 'replaceNext("' + str + '");'});
}

// replacePrev: replaces the current match and moves focus to previous
function replacePrev(str) {
    chrome.tabs.executeScript({code: 'replacePrev("' + str + '");'});
}

// ------------------ Event Handlers -----------------------------

$(document).ready(function () {
    chrome.storage.local.get({"curWord":""}, function(data) {
        $("#find").val(data.curWord);
        $("#find").select();
        // curWord = data.curWord;
        // $("#find").keyup();
        console.log("GOT CURWORD: " + data.curWord);
    });
    curReplaceText="";
    // $("#find").focus();
    iF = mC = wW = rX = false;

    //----------- Text Fields -------------------------
    // Find text field changed
    $("#find").keyup(function(ev) {
    	if(iF) {
    		curWord = $("#find").val();
    		if(curWord=="") { // if its empty, unhighlight matches and disable all buttons
                // disable button
                $("#replaceButton").addClass("mdl-button--disabled");
                $("#replaceButton").prop("disabled", true);
            }
            else {
            	$("#replaceButton").removeClass("mdl-button--disabled");
	            $("#replaceButton").prop("disabled", false);
            }
    	}
    	else {
	        if(ev.which === 13) {
	            if(ev.shiftKey) {
	                console.log("Shift+Enter = findPrev");
	                findPrev();
	            }
	            else {
	                console.log("Enter = findNext");
	                findNext();   
	            }
	        }
	        else {
	            console.log("find value changed");
	            if(curWord != $("#find").val()) { // if this value is different, reset
	                curWord = $("#find").val()
	                if(curWord=="") { // if its empty, unhighlight matches and disable all buttons
	                    UHLAll();
	                    // disable buttons
	                    $("#findNext").addClass("mdl-button--disabled");
	                    $("#findNext").prop("disabled", true);
	                    $("#findPrev").addClass("mdl-button--disabled");
	                    $("#findPrev").prop("disabled", true);
	                    $("#replaceNext").addClass("mdl-button--disabled");
	                    $("#replaceNext").prop("disabled", true);
	                    $("#replacePrev").addClass("mdl-button--disabled");
	                    $("#replacePrev").prop("disabled", true);
	                    $("#replaceButton").addClass("mdl-button--disabled");
	                    $("#replaceButton").prop("disabled", true);
	                }
	                else { // find the matches and enable the buttons if needed
	                    findAll();
	                    // enable buttons
	                    if($("#findNext").hasClass("mdl-button--disabled")) { // enable all the find buttons
	                        $("#findNext").removeClass("mdl-button--disabled");
	                        $("#findNext").prop("disabled", false);
	                        $("#findPrev").removeClass("mdl-button--disabled");
	                        $("#findPrev").prop("disabled", false);
	                    }
	                    if(/*curReplaceText!="" && */$("#replaceNext").hasClass("mdl-button--disabled")) { // if replace has text and replace buttons are disabled
	                        // enable replace buttons
	                        $("#replaceNext").removeClass("mdl-button--disabled");
	                        $("#replaceNext").prop("disabled", false);
	                        $("#replacePrev").removeClass("mdl-button--disabled");
	                        $("#replacePrev").prop("disabled", false);
	                        $("#replaceButton").removeClass("mdl-button--disabled");
	                        $("#replaceButton").prop("disabled", false);
	                    }
	                }
	            }
	        }
    	}
        chrome.storage.local.set({"curWord":curWord});
    });

    $("#replace").keyup(function(ev) {
    	if(iF) {
    		curReplaceText = $("#replace").val();
    		// if(curReplaceText=="") {
    		// 	$("#replaceButton").addClass("mdl-button--disabled");
      //           $("#replaceButton").prop("disabled", true);
    		// }
    		// else if(curWord!="") {
    		// 	$("#replaceButton").removeClass("mdl-button--disabled");
	     //        $("#replaceButton").prop("disabled", false);
    		// }
    	}
    	else {
	        if(ev.which === 13) {
	            if(ev.shiftKey) {
	                console.log("Shift+Enter = replacePrev");
	                replacePrev(curReplaceText);
	            }
	            else {
	                console.log("Enter = replaceNext");
	                replaceNext(curReplaceText);   
	            }
	        }
	        else {
	            console.log("replace value changed");
	            curReplaceText = $("#replace").val();
	            // if(!iF && curReplaceText=="") { // replace text empty
	            //     // disable all the replace buttons
	            //     $("#replaceNext").addClass("mdl-button--disabled");
	            //     $("#replaceNext").prop("disabled", true);
	            //     $("#replacePrev").addClass("mdl-button--disabled");
	            //     $("#replacePrev").prop("disabled", true);
	            //     $("#replaceButton").addClass("mdl-button--disabled");
	            //     $("#replaceButton").prop("disabled", true);
	            // }
	            // else if(!iF && curWord!="" && $("#replaceNext").hasClass("mdl-button--disabled")) { // if find has text and replace buttons are disabled
	            //     // enable replace buttons
	            //     $("#replaceNext").removeClass("mdl-button--disabled");
	            //     $("#replaceNext").prop("disabled", false);
	            //     $("#replacePrev").removeClass("mdl-button--disabled");
	            //     $("#replacePrev").prop("disabled", false);
	            //     $("#replaceButton").removeClass("mdl-button--disabled");
	            //     $("#replaceButton").prop("disabled", false);
	            // }
	        }
    	}
    });
    //----------- BUTTONS -------------------------
    // Replace All
    $("#replaceButton").click(function() {
        console.log("replaceButton clicked");
        // if(curWord=="") UHLAll();
        /*else */replaceAll(curReplaceText);
    });
    
    // Find Next clicked
    $("#findNext").click(function() {
        console.log("findNext Clicked");
        findNext();
    });
    
    // Find Previous clicked
    $("#findPrev").click(function() {
        console.log("findPrev Clicked");
        findPrev();
    });

    // Replace Next clicked
    $("#replaceNext").click(function() {
        console.log("replaceNext clicked");
        replaceNext(curReplaceText);
    });
    
    // Replace Previous clicked
    $("#replacePrev").click(function() {
        console.log("replacePrev clicked");
        replacePrev(curReplaceText);
    });

    $("#settingsButton").click(function() {
        console.log("settingsButton clicked");
        chrome.runtime.openOptionsPage();
    })
    //----------- OPTIONS -------------------------
    // Match Case
    $("#matchCase").click(function() {
        console.log("Option: Match Case");
        mC = !mC;
        if(!iF && curWord!="") findAll();
    });

    // Whole Words
    $("#wholeWords").click(function() {
        console.log("Option: Whole Words");
        wW = !wW;
        if(!iF && curWord!="") findAll();
    });

    // Use RegEx
    $("#regex").click(function() {
        console.log("Option: use RegEx");
        rX = !rX;
        if(rX) { // disables match case, whole words; enables modifiers
    		document.querySelector("#matchCase").parentElement.MaterialCheckbox.disable();
    		document.querySelector("#wholeWords").parentElement.MaterialCheckbox.disable();

        	document.querySelector("#global-toggle").parentElement.MaterialIconToggle.enable();
        	document.querySelector("#case-toggle").parentElement.MaterialIconToggle.enable();
        	document.querySelector("#multiline-toggle").parentElement.MaterialIconToggle.enable();
        }
        else {
        	document.querySelector("#matchCase").parentElement.MaterialCheckbox.enable();
        	document.querySelector("#wholeWords").parentElement.MaterialCheckbox.enable();
        	
            document.querySelector("#global-toggle").parentElement.MaterialIconToggle.disable();
        	document.querySelector("#case-toggle").parentElement.MaterialIconToggle.disable();
        	document.querySelector("#multiline-toggle").parentElement.MaterialIconToggle.disable();
        }
        if(!iF && curWord!="") findAll();
    });

    // Input Fields
    $("#inputFields").click(function() {
    	console.log("Option: Input Fields")
    	iF = !iF;
    	if(iF) {
    		UHLAll();
        	$("#findNext").addClass("mdl-button--disabled");
            $("#findNext").prop("disabled", true);
            $("#findPrev").addClass("mdl-button--disabled");
            $("#findPrev").prop("disabled", true);
            $("#replaceNext").addClass("mdl-button--disabled");
            $("#replaceNext").prop("disabled", true);
            $("#replacePrev").addClass("mdl-button--disabled");
            $("#replacePrev").prop("disabled", true);
    	}
    	else {
    		if(curWord!="") {
    			$("#findNext").removeClass("mdl-button--disabled");
            	$("#findNext").prop("disabled", false);
            	$("#findPrev").removeClass("mdl-button--disabled");
            	$("#findPrev").prop("disabled", false);
            	// if(curReplaceText!="") {
            		$("#replaceNext").removeClass("mdl-button--disabled");
    	        	$("#replaceNext").prop("disabled", false);
	            	$("#replacePrev").removeClass("mdl-button--disabled");
        	    	$("#replacePrev").prop("disabled", false);
            	// }
            	findAll();
    		}
    	}
    });
    //----------- MODIFIERS (REGEX ONLY) -------------------------
    // Use g
    $("#global-toggle").click(function() {
    	console.log("Regex: use g");
    	if(!iF && curWord!="") findAll();
    });

    // Use i
    $("#case-toggle").click(function() {
    	console.log("Regex: use i");
    	if(!iF && curWord!="") findAll();
    });

    // Use m
    $("#multiline-toggle").click(function() {
    	console.log("Regex: use m");
    	if(!iF && curWord!="") findAll();
    });
});