var join = require('path').join;
var cheerio = require('cheerio');
var instrument = require(join(__dirname, './instrument.js'));

function instrument_html(str, options) {
    if (str.length === 0) {
        return "";
    }

    //first checking if it is JSON
    try {
        JSON.parse(str);
        return str; //not instrumenting JSON
    } catch (ignore) {

    }
    //second checking and returning if its JS
    try {
       require("falafel-turbo/node_modules/esprima").parse(str);
       return str;
    } catch (err) {

    }

    var $ = cheerio.load(str, {
        xmlMode: false,
        recognizeCDATA: true
    });

    $('script').each(function (index) {
        if($(this).hasClass('dex-ignore')) {
            return;
        }
        var type = $(this).attr('type'),
            jsText = $(this).text(),
            temp = jsText;
        options.source = "ScriptTag";
        options.origin.scriptNum = index;
        if (type === undefined || type.toLowerCase() === 'text/javascript') {
            temp = instrument.instrument(jsText, options).toString();
        }
        $(this).text(temp);
    });

    //instrumenting other sources of js
    var eventAttributes = ["onafterprint", "onbeforeprint", "onbeforeunload", "onerror", "onhaschange", "onload", "onmessage", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onredo", "onresize", "onstorage", "onundo", "onunload", "onblur", "onchange", "oncontextmenu", "onfocus", "onformchange", "onforminput", "oninput", "oninvalid", "onreset", "onselect", "onsubmit", "onkeydown", "onkeypress", "onkeyup", "onclick", "ondbclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onscroll", "onabort", "oncanplay", "oncanplaythrough", "ondurationchange", "onemptied", "onended", "onerror", "onloadeddata", "onloadedmetadata", "onloadstart", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreadystatechange", "onseeked", "onseeking", "onstalled", "onsuspend", "ontimeupdate", "onvolumechange", "onwaiting"],
        text,
        prepend = "function I(){",
        append = "};",
        output = "";

    for (var i = 0; i < eventAttributes.length; i++) {
        $("[" + eventAttributes[i] + "]").each(function () {
            text = prepend + $(this).attr(eventAttributes[i]) + append;
            //instrumenting each attribute only once
            if (text.indexOf("iniFunction") != -1) {
                return;
            }
            text = text.trim();
            options.source = "EventAttribute";
            text = instrument.instrument(text, options).toString();
            text = text.substring(prepend.length, text.lastIndexOf("}"));
            $(this).attr(eventAttributes[i], text);
        });
    }

    return $.html(); //outer attributes will be missed
}

exports.instrument_html = instrument_html;