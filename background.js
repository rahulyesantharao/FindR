// ---------------- Utility functions ---------
function spaces(string) {
    return string.replace(/ /g, "(?: |\u00a0)");
}

function quotes(string) {
    return string.replace(/"/g, "\\\"");
}

function escapeLit(string) {
	return string.replace(/\\/g, "\\\\\\$&").replace(/[.*+?^${}()|[\]]/g, "\\\\$&");
}

function escapeRegExp(string){
	return string.replace(/\\/g, "\\$&");
}
// chrome.runtime.onInstalled.addListener(function() {
// 	chrome.tabs.query({"url":["<all_urls>"]}, function(tabs) {
// 		for(var i=0; i < tabs.length; i++) {
// 			// chrome.tabs.sendMessage(tabs[i].id, {ping: true}, function(response) {
// 				// if(!response.pong) {
// 					chrome.tabs.executeScript(tabs[i].id, {file: "c_script.js"}, function() {
// 						if(chrome.runtime.lastError) {
// 							console.log(i);
// 							console.error(chrome.runtime.lastError);
// 						}
// 					});
// 				// }
// 			// });
// 		}
// 	});
// });

// ----------------------------- START BACKGROUND REPLACEMENTS -----------------------------
var findWords = [], replaceWords = [], modifiers = [];

chrome.storage.local.get({"permanentF":[], "permanentR":[], "permanentM":[]}, function(data) {
    if((typeof data.permanentF == "undefined")||(typeof data.permanentR == "undefined")||(typeof data.permanentM == "undefined")) { // error
    }
    else {
        //console.log(data.curPos.toString() + " of " + data.numMatches.toString());
        findWords = data.permanentF;
        replaceWords = data.permanentR;
        modifiers = data.permanentM;
        console.log("permanent data retrieved");
        console.log(findWords);
        console.log(replaceWords);
        console.log(modifiers);
    }
});

chrome.runtime.onMessage.addListener(function(message) {
	if(message.type=="permSet") {
		chrome.storage.local.get({"permanentF":[], "permanentR":[], "permanentM":[]}, function(data) {
		    if((typeof data.permanentF == "undefined")||(typeof data.permanentR == "undefined")||(typeof data.permanentM == "undefined")) { // error
		    }
		    else {
		        //console.log(data.curPos.toString() + " of " + data.numMatches.toString());
		        findWords = data.permanentF;
		        replaceWords = data.permanentR;
		        modifiers = data.permanentM;
		        console.log("permanent data updated");
		        console.log(findWords);
		        console.log(replaceWords);
		        console.log(modifiers);
		    }
		});
	}
});

chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
	for (var i = findWords.length - 1; i >= 0; i--) {
		var mod = modifiers[i][3];
		var reg;
		if(modifiers[i][2]) reg = quotes(escapeRegExp(findWords[i]));
		else {
			if(modifiers[i][1]) reg = "\\\\b" + quotes(spaces(escapeLit(findWords[i]))) + "\\\\b";
			else reg = quotes(spaces(escapeLit(findWords[i])));
		}
		var str = replaceWords[i];
		console.log("perm replacing:"+reg+", "+mod);
		chrome.tabs.executeScript(tabId, {code: 'rAll("' + reg + '", "' + mod + '", "' + str + '");'});
	}
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	for (var i = findWords.length - 1; i >= 0; i--) {
		var mod = modifiers[i][3];
		var reg;
		if(modifiers[i][2]) reg = quotes(escapeRegExp(findWords[i]));
		else {
			if(modifiers[i][1]) reg = "\\\\b" + quotes(spaces(escapeLit(findWords[i]))) + "\\\\b";
			else reg = quotes(spaces(escapeLit(findWords[i])));
		}
		var str = replaceWords[i];
		console.log("perm replacing: "+reg+", "+mod+" in tab " + tabId + " because " + changeInfo.status + " at " + changeInfo.url);
		chrome.tabs.executeScript(tabId, {code: 'rAll("' + reg + '", "' + mod + '", "' + str + '");'});
	}
});
// ----------------------------- END BACKGROUND REPLACEMENTS -----------------------------

chrome.runtime.onConnect.addListener(function(port) {
	// port.postMessage({myProp:"LOL"});
	if(port.name=="listenForUnload") {
		// port.postMessage({})
		port.onDisconnect.addListener(function(port) {
			console.log("Disconnected");
			chrome.tabs.executeScript({code: 'testUHL();'});
		});
	}
});