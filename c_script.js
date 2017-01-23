// ------------------ CHECK IF CONTENT SCRIPT IS LOADED -------------------
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if(request.ping) {
//         console.log("Message from background caught in content");
//         sendResponse({pong: true});
//     }
// });

// ------------------ State of Matches -----------------------------
var numMatches; // number of matches; set by highlightText, replaceText
var curPos; // current position of focus; modified by all functions

// setValues: Set the current values into memory
function setValues() {
    if(numMatches==0) curPos=0;

    console.log(curPos.toString() + " of " + numMatches.toString());

    chrome.storage.local.set({
        'numMatches':numMatches,
        'curPos':curPos
    }, function() {
        chrome.runtime.sendMessage({type: "setValues"});
    });
}

// ------------------ Visibility Functions -----------------------------
// isElementInViewport: determines whether el is currently in the viewport
function isElementInViewport (el) {
    el = el[0];
    var rect = el.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= $(window).height() &&
        rect.right <= $(window).width() &&
        rect.top<rect.bottom &&
        rect.left<rect.right
    );
}

// isElementVisible: determines whether el is visible on page
function isElementVisible (el) {
    var o = el.offset();
    
    return (
        el.is(":visible") &&
        !(el.css("visibility") == "hidden") &&
        !(el.css("visibility") == "collapse") &&
        el.height()>0 &&
        el.width()>0 &&
        o.left+el.width()>0 &&
        o.top+el.height()>0
    );
}

// countMatches: counts the number of visible matches and puts them into numMatches
function countMatches() {
    $("span.foundLELELEL").each(function() {
        if(isElementVisible($(this))) numMatches++;
    });
}

// ------------------ Helper Functions -----------------------------
// testUHL(): unhighlights all matches
function testUHL() {
    console.log("testUHL called");
    $("span.foundLELELEL").each(function() {
        var pNode = this.parentNode;
        pNode.replaceChild(this.firstChild, this);
        pNode.normalize();
    });
}

// ------------------ Button Functions -----------------------------
// fAll(): finds all matches and focuses on the first one
function fAll(reg, mod) {
    var toFind = new RegExp(reg, mod);
    console.log("fAll(" + reg + ", " + mod + ") called: " + toFind.toString())
    
    numMatches=0;

    testUHL(); // unhighlights previous matches
    $("body *").not("style").not("script").not("noscript").highlightText(toFind); // highlights new matches
    focusFirst(); // sets focus on the first one

    countMatches();
    setValues();
}

// rAll(): unhighlights all previous matches and replaces everything (including tab title)
function rAll(reg, mod, rep) {
    var toFind = new RegExp(reg, mod);
    console.log("rAll() called: " + toFind.toString() + " -> " + rep);
    
    testUHL(); // unhighlights previous matches
    $("*").not("style").not("script").replaceText(toFind, rep); // replaces everything
    $("input, textarea, select").each(function() {
        if($(this).val()=="") {
            var new_val = $(this).attr("placeholder");
            if(typeof new_val === 'string') new_val = new_val.replace(toFind, rep);
            $(this).attr("placeholder", new_val);
        }
    });

    numMatches=0;
    curPos=0;
    setValues();
}

// rInput(): unhighlights all previous matches and replaces everything inside an input field
function rInput(reg, mod, rep) {
    var toFind = new RegExp(reg, mod);
    console.log("rInput() called: " + toFind.toString() + " -> " + rep);

    testUHL(); // unhighlight previous matches (just in case)
    
    $("input, textarea, select").each(function() {
        if($(this).val()=="") {
            console.log("  - Placeholder");
            var new_val = $(this).attr("placeholder");
            if(typeof new_val === 'string') new_val = new_val.replace(toFind, rep);
            $(this).attr("placeholder", new_val);
        }
        else {
            console.log("  - Value");
            var old_val = $(this).val();
            var new_val;
            if(typeof old_val === 'string') new_val = old_val.replace(toFind, rep);
            else if(Array.isArray(old_val)) {
                $.each(old_val, function() {
                    if($.type($(this)) === 'string') new_val.push(this.replace(toFind, rep));
                    else new_val.push(this);
                });
            }
            $(this).val(new_val);
        }
    });
    // value text of button, email, number, range, search, submit, tel, text, url, week
}

// focusFirst(): focuses on first match
function focusFirst() {
    curPos=0;
    console.log("focusFirst called");
    $("span.foundLELELEL").each(function() {
        if(isElementVisible($(this))) {
            curPos++;
            $(this).addClass("curLELELEL");
            //$("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            return false;
        }
    });
}

// focusLast(): focuses on last match
function focusLast() {
    curPos=numMatches+1;
    console.log("focusLast called");
    $($("span.foundLELELEL").get().reverse()).each(function() {
        if(isElementVisible($(this))) {
            curPos--;
            $(this).addClass("curLELELEL");
            // $("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            return false;
        }
    });
    if(numMatches==0) curPos=0;
}

// focusNext(): focuses on next match
function focusNext() {
    console.log("focusNext called");
    var next=false;
    $("span.foundLELELEL").each(function() {
        if(next && isElementVisible($(this))) {
            curPos++;
            $(this).addClass("curLELELEL");
            // $("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            next=false;
            return false;
        }
        if($(this).hasClass("curLELELEL")) {
            $(this).removeClass("curLELELEL");
            next=true;
        }
    });
    if(next) focusFirst();
    setValues();
}

// focusPrev(): focuses on previous match
function focusPrev() {
    console.log("focusPrev called");
    var next=false;
    $($("span.foundLELELEL").get().reverse()).each(function() {
        if(next && isElementVisible($(this))) {
            curPos--;
            $(this).addClass("curLELELEL");
            // $("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            next=false;
            return false;
        }
        if($(this).hasClass("curLELELEL")) {
            next=true;
            $(this).removeClass("curLELELEL");
        }
    });
    if(next) focusLast();
    setValues();
};

// replacePrev(): replaces current match and focuses on previous
function replacePrev(rstr) {
    console.log("replacePrev called");
    var next=false;
    var node;
    $($("span.foundLELELEL").get().reverse()).each(function() {
        if(next && isElementVisible($(this))) {
            curPos--;
            $(this).addClass("curLELELEL");
            // $("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            next=false;
            return false;
        }
        if($(this).hasClass("curLELELEL")) {
            numMatches--;
            node=this;
            next=true;
            $(this).removeClass("curLELELEL");
        }
    });
    if(next) focusLast();
    if(node) {
        var pNode = node.parentNode;
        pNode.replaceChild(document.createTextNode(rstr), node);
        pNode.normalize();
    }
    setValues();
}

// replaceNext(): replaces current match and focuses on next
function replaceNext(rstr) {
    console.log("replaceNext called");
    var next=false;
    var node;
    $("span.foundLELELEL").each(function() {
        if(next && isElementVisible($(this))) {
            $(this).addClass("curLELELEL");
            // $("html, body").scrollTop($(this).offset().top);
            if(!isElementInViewport($(this))) $("html, body").scrollTop(-0.5*($(window).height()) + $(this).offset().top)
            next=false;
            return false;
        }
        if($(this).hasClass("curLELELEL")) {
            numMatches--;
            node = this;
            $(this).removeClass("curLELELEL");
            next=true;
        }
    });
    if(next) focusFirst();
    if(node) {
        var pNode = node.parentNode;
        pNode.replaceChild(document.createTextNode(rstr), node);
        pNode.normalize();
    }
    setValues();
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

function unescapeHTML(s) {
    return s.replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
}

// ------------------ Replacement Plugins -----------------------------
// $(...).highlightText(): highlights all instances of 'search' in the given elements - only considers text nodes
$.fn.highlightText = function (search) {
    return this.each(function () {
        // if(isElementVisible($(this))) {
            // this.normalize(); // ******* CHECK IF THIS IS NECESSARY *******
            var node = this.firstChild,
              val,
              new_val,
              remove = [];
            if (node) {
                do {
                    if (node.nodeType === 3) {
                        val = node.nodeValue;
                        //val = escapeHTML(val);
                        //numMatches += ((val.match(search)||[]).length);
                        // var notmatch = val.split(search);
                        // new_val = val.replace(search, function(match) {
                        //     return '<span class="foundLELELEL">' + escapeHTML(match) + '</span>';
                        // });
                        new_val = val.replace(search, 'foundLELELEL_s$&foundLELELEL_e');
                        new_val = escapeHTML(new_val);
                        new_val = new_val.replace(/foundLELELEL_s/g, '<span class="foundLELELEL">').replace(/foundLELELEL_e/g, "</span>");
                        if (new_val !== val) {
                            $(node).before((new_val));
                            remove.push(node);
                        }
                    }
                } while (node = node.nextSibling);
            }
            remove.length && $(remove).remove();
            // this.normalize(); // ******* CHECK IF THIS IS NECESSARY *******
        // }
    });
};

// $(...).replaceText(): replaces all instances of 'search' with 'replace' in the given elements - only considers text nodes
$.fn.replaceText = function (search, replace) {
    return this.each(function () {
        var node = this.firstChild,
          val,
          new_val;
        if (node) {
            do {
                if (node.nodeType === 3) {
                    val = node.nodeValue;
                    // val = escapeHTML(val);
                    new_val = val.replace(search, replace);
                    if (new_val !== val) {
                        node.nodeValue = new_val;
                    }
                }
            } while (node = node.nextSibling);
        }
    });
};