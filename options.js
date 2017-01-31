// ------------------ RegEx Formatting -----------------------------
function empty(string, mod) {
    // console.log("empty(" + string + ", " + mod + ")");
    var test = "This is a test string that will catch any empty regex.";
    var regx = new RegExp(string, mod);
    var matches = test.match(regx);
    if(matches) {
        for(var i=0; i<matches.length; i++) {
            if(matches[i]=="") {
                // console.log("  - Empty 2");
                return true;
            }
        }
    }
    // console.log("  - Not Empty");
    return false;
}


$(document).ready(function() {
	//----------- VARIABLES -------------------------
	var findWords = [], replaceWords = [], modifiers = []; // permanent replace pairs
	var table, headerCheckbox, boxes, headerCheckHandler;
	var mC; // bool to match case or not
    var wW; // bool for whole words or not
    var rX; // bool for regex or not

    mC = wW = rX = false;
    //----------- TABLE INITIALIZATION -------------------------
    // get current find/replace pairs from storage
	chrome.storage.local.get({"permanentF":[], "permanentR":[], "permanentM":[]}, function(data) {
        if((typeof data.permanentF == "undefined")||(typeof data.permanentR == "undefined")||(typeof data.permanentM == "undefined")) { // error
        }
        else {
            // save data locally
            findWords = data.permanentF;
            replaceWords = data.permanentR;
            modifiers = data.permanentM;
            // console.log("data retrieved");
            // console.log(findWords);
            // console.log(replaceWords);
            // console.log(modifiers);
            
            // load pairs into table
		    // console.log(findWords.length);
		    for(var i=0, length=findWords.length; i<length; i++) {
		    	// console.log("NEXT LOAD");
                var tblMC = (modifiers[i][0]?'<i class="material-icons">check</i>':'');
                var tblWW = (modifiers[i][1]?'<i class="material-icons">check</i>':'');
                var tblRX = (modifiers[i][2]?'<i class="material-icons">check</i>':'');
                var tblMod = (modifiers[i][2]?modifiers[i][3]:'');
		    	$("#data").append('<tr><td><label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row['+(i)+']"><input type="checkbox" id="row['+(i)+']" class="mdl-checkbox__input"></label></td><td class="mdl-data-table__cell--non-numeric">' + findWords[i] + '</td><td>' + replaceWords[i] + '</td><td>' + tblMC + '</td><td>' + tblWW + '</td><td>' + tblRX + '</td><td>' + tblMod + '</td></tr>');
			}
			var el = document.getElementById('data');
    		componentHandler.upgradeElements(el);
			
            // initialize table
			table = document.querySelector('table');
			headerCheckbox = table.querySelector('thead .mdl-data-table__select input');
			boxes = table.querySelectorAll('tbody .mdl-data-table__select');
			headerCheckHandler = function(event) {
				if(event.target.checked) {
					for(var i=0, length=boxes.length; i<length; i++) {
						boxes[i].MaterialCheckbox.check();
					}
				}
				else {
					for(var i=0, length=boxes.length; i<length; i++) {
						boxes[i].MaterialCheckbox.uncheck();
					}	
				}
			};
			headerCheckbox.addEventListener('change', headerCheckHandler);
        }
    });

    // Deactivate button if find text is nonempty
    $("#findT").keyup(function(ev) {
        $("#status").text("");
        $("#status").removeClass("error");
        if($("#findT").val()=="") {
            $("#saveButton").addClass("mdl-button--disabled");
            $("#saveButton").prop("disabled", true);
        }
        else {
            $("#saveButton").removeClass("mdl-button--disabled");
            $("#saveButton").prop("disabled", false);
        }
    });

    //----------- OPTIONS -------------------------
    // Match Case
    $("#matchCase").click(function() {
        // console.log("Option: Match Case");
        mC = !mC;
    });

    // Whole Words
    $("#wholeWords").click(function() {
        // console.log("Option: Whole Words");
        wW = !wW;
    });

    // Use RegEx
    $("#regex").click(function() {
        // console.log("Option: use RegEx");
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
    });

    //----------- MODIFIERS (REGEX ONLY) -------------------------
    // Use g
    $("#global-toggle").click(function() {
    });

    // Use i
    $("#case-toggle").click(function() {
    });

    // Use m
    $("#multiline-toggle").click(function() {
    });

    //----------- BUTTONS -------------------------
    // save new pair
    $("#saveButton").click(function() {
    	// console.log("saveClicked");
    	var curF = $("#findT").val();
    	var curR = $("#replaceT").val();
        var curM="";
        if(rX) {
            if($("#global-toggle").is(":checked")) curM+="g";
            if($("#case-toggle").is(":checked")) curM+="i";
            if($("#multiline-toggle").is(":checked")) curM+="m";

            try {
                new RegExp(curF);
            } catch(e) {
                // console.log("Invalid Regular Expression");
                $("#status").text("Error");
                $("#status").addClass("error");
                return;
            }

            if(empty(curF, curM)) {
                // console.log("Empty Regular Expression");
                $("#status").text("Infinite");
                $("#status").addClass("error");
                return;
            }
        }
        else {
            curM = "g";
            if(!mC) curM += "i";
        	if(findWords.indexOf(curF)>=0) {
        		// console.log("Repeat Error");
                $("#status").text("Repeat");
                $("#status").addClass("error");
                return;
        	}
        }
	
		findWords.push(curF);
		replaceWords.push(curR);
        modifiers.push([mC, wW, rX, curM]);
		
        // console.log("SAVING");
		// console.log(curF);

        var i = modifiers.length-1;
        var tblMC = (modifiers[i][0]?'<i class="material-icons">check</i>':'');
        var tblWW = (modifiers[i][1]?'<i class="material-icons">check</i>':'');
        var tblRX = (modifiers[i][2]?'<i class="material-icons">check</i>':'');
        var tblMod = (modifiers[i][2]?modifiers[i][3]:'');
        $("#data").append('<tr><td><label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row['+(i)+']"><input type="checkbox" id="row['+(i)+']" class="mdl-checkbox__input"></label></td><td class="mdl-data-table__cell--non-numeric">' + findWords[i] + '</td><td>' + replaceWords[i] + '</td><td>' + tblMC + '</td><td>' + tblWW + '</td><td>' + tblRX + '</td><td>' + tblMod + '</td></tr>');
		boxes = table.querySelectorAll('tbody .mdl-data-table__select');
		var el = document.getElementById('data');
		componentHandler.upgradeElements(el);
		chrome.storage.local.set({
			'permanentF': findWords,
			'permanentR': replaceWords,
            'permanentM': modifiers
		}, function() {
    		chrome.runtime.sendMessage({type: "permSet"});
		});
		$("#findT").val('');
		$("#replaceT").val('');	
        $("#findT").focus();
    });

    $("#deleteButton").click(function() {
    	for(var i=boxes.length-1; i>=0; i--) {
    		if($(boxes[i]).hasClass('is-checked')) {
    			// console.log("CHECKED");
    			$("#data").children().eq(i).remove();
    			findWords.splice(i,1);
    			replaceWords.splice(i,1);
                modifiers.splice(i,1);
    		}
    	}
    	table.querySelector('thead .mdl-data-table__select').MaterialCheckbox.uncheck();
    	chrome.storage.local.set({
			'permanentF': findWords,
			'permanentR': replaceWords,
            'permanentM': modifiers
		}, function() {
    		chrome.runtime.sendMessage({type: "permSet"});
		});
    });
});