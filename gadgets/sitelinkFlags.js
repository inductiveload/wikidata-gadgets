// siteLinkFlags.js
//
// Simple gadget to add flags to sitelinks to indicate language.
// Yes, I know flags are not a good way to show language, but it could 
// help visually locate languages you are interested in.
//
// Author: Inductiveload
// Version: 1.0.0

$.getScript( 'http://wsjs/wikidata/jslib/md5-min.js' );

var SiteLinkFlags = (function ($) {
	var my = {};
	
	var getFlagURL = function (cc) {
		var basicName = 'Icons-flag-' + cc + '.png'
		var md5 = hex_md5(basicName);
		return url = '//upload.wikimedia.org/wikipedia/commons/' + md5[0] + '/' + md5.slice(0,2) +'/' + basicName;
	}
	
	// a language doesn't always translate to a country
	// so we need to catch some stragglers
	var lang2CountryCode = { 'zh' : 'cn',
		'da':'dk',
		'simple':'gb-eng',
		'en':'gb-eng',
		'he':'il',
		'ja':'jp',
		'fa':'ir',
		'ko':'kr',
		'ka':'ge',
		'nn':'no',
		'el':'gr',
		'sq':'al',
		'aa':'er',
		'uk':'ua'};
	
	var insertFlag = function (i, v) {
		var cc = $(v).attr('lang');
		
		//translate if needed
		if (cc in lang2CountryCode){
			cc = lang2CountryCode[cc];
		}
		
		var imgSrc = getFlagURL(cc);
		
		var img = $('<img>', {'src':imgSrc});
		
		$(v).prepend(img);
	}
	
	my.addFlags = function() {
		$('.wb-sitelinks tbody .wb-sitelinks-sitename').each( insertFlag );
	}

	return my;
}(jQuery));


$(document).ready(function() {
	SiteLinkFlags.addFlags();
});
