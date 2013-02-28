// ClassifyEntity.js
//
// Simple gadget to classify items into the six major entities
//
// Author: Inductiveload
// Version: 1.0.0

var ClassifyEntity = (function ($) {
	var my = {};
	var currLang = mw.config.get( 'wgUserLanguage' );
	var entityProperty = 107;
	var typeNames = {
		'en':['person', 'name', 'organisation', 'event', 'work', 'term', 'place'],
		'de':['Person', 'Name', 'Organisation', 'Veranstaltung', 'Werk', 'Sachbegriff', 'Geografikum'], 
	};
	var typeIds = [215627, 4167410, 43229, 1656682, 386724, 1969448, 618123] 

	var addType = function (typeIndex) {
		var api = new mw.Api(),
		params = { 'entity' : wgPageName,
			'property': 'P' + entityProperty,
			'snaktype':'value',
			'value':'{"entity-type":"item","numeric-id":' + typeIds[typeIndex] + '}',
			'token':wbRepoEditToken,
			'action':'wbcreateclaim'
		}
		
		// ugly - should do it without a reload
		api.post(params)
		.done( function ( data ) {
			document.location.reload(true);
		} )
		
		
	}

	var addLinksToPicker = function () {
		
		for (var i = 0; i < typeIds.length; i++) {
			$('.x-entitypicker')	
			.append($('<span>')
				.append('[')
				.append( $('<a>')
					.text(typeNames[currLang][i])
					.attr('title', typeIds[i])
					.data('index', i)
					//.attr('href', ')
					.click( function (e){
						addType($(this).data('index'));	
					})
				)
				.append(']')
			)
		}
	};
	
	my.init = function () {

		if (wgNamespaceNumber === 0 && $('.wb-claim-section-p' + entityProperty).length === 0){
			$('.wb-claimlistview').prepend(
				$('<span>')
				.attr({'class': 'x-entitypicker'})
			);

			addLinksToPicker();
		}
	};

	return my;
}(jQuery));


$(document).ready(function() {
	ClassifyEntity.init();
});
