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
	var typeIds = [215627, 4167410, 43229, 1656682, 386724, 1969448, 618123];
	
	var countries = [
				['UK', 145], ['Germany', 183],	['France', 142],
				['Hungary', 28], ['Russia', 159] ]

	var properties = [];
	var changed = false;
	var buttonAccept = false;

	var propertyCount = function (propId) {
		return $('.wb-claim-section-p' + propId).length;
	}

	var saveProperties = function () {

		if (properties.length > 0){

			var api = new mw.Api(),

			property = properties.shift(),

			params = { 'entity' : wgPageName,
				'property': property['property'],
				'snaktype':'value',
				'value':JSON.stringify(property['value']),
				'token':wbRepoEditToken,
				'action':'wbcreateclaim'
			}

			api.post(params)
			.done( function ( data ) {
				changed = true;
				saveProperties(); //go back and do it again
			} )
		} else {
			//reload to see the changes
			if (changed) {
				document.location.reload(true);
			}
		}
	};

	var buttonFunction = function (props, i, div) {

		return function () {
			addItemProperty(props['id'], props['options'][i][1]);
			buttonAccept = true;
			div.dialog( "close" );
			props['followup']();
		};
	};

	// Ask a follow up question
	var additionalQuery = function (type) {

		var dialogDiv = $('<div>')
		.attr('class', 'x-entitypicker-query');

		buttonAccept = false;

		if (type === 'sex'){
			var title = "Sex",
			text = 'Sex of person',
			props = {'id': 21,
				'options': [ ['male', 44148], ['female', 43445], ['intersex', 1097630] ],
				'followup': function () { additionalQuery('countryofcit'); }
			};
		}

		if (type === 'countryofcit'){
			var title = "Country",
			text = 'Country of citizenship',
			props = {'id': 27,
				'options': countries,
				'followup': function () { saveProperties(); }
			};
		}
		
		if (type === 'countryofloc'){
			var title = "Country",
			text = 'Country where this located',
			props = {'id': 17,
				'options': countries,
				'followup': function () { saveProperties(); }
			};
		}

		//skip this property if it exists already
		if (propertyCount(props['id']) != 0) {
			props['followup']();
			return;
		}

		var buttons =  {};
		for (var i = 0; i < props['options'].length; i++){
			buttons[props['options'][i][0]] = buttonFunction(props, i, dialogDiv);
		}

		//and a skip option - you can still add items
		buttons['skip'] = function() {
			buttonAccept = true;
			dialogDiv.dialog( "close" );
			props['followup']();
			return;
		}

		dialogDiv.attr('title', title)
			.text(text);

		dialogDiv.dialog({
			modal: true,
			buttons: buttons,
			close: function () {
				if (! buttonAccept) {
					properties = []; //empty properties if a cancel is entered
				}
			}
		});

	}

	var addItemProperty = function (prop, id){
		properties.push({
			'property': 'P' + prop,
			'value': {"entity-type":"item","numeric-id": id }
		});
	}

	var addType = function (typeId) {
		addItemProperty(entityProperty, typeId );

		if (typeId === 215627){ //people
			additionalQuery('sex');
		} else if (typeId === 618123){ //place
			additionalQuery('countryofloc');
		} else { //nothing else to ask, save now
			saveProperties();
		}
	};

	var addLinksToPicker = function () {

		for (var i = 0; i < typeIds.length; i++) {
			$('.x-entitypicker')
			.append($('<span>')
				.append('[')
				.append( $('<a>')
					.text(typeNames[currLang][i])
					.attr('title', typeIds[i])
					.data('typeId', typeIds[i])
					//.attr('href', ')
					.click( function (e){
						addType($(this).data('typeId'));
					})
				)
				.append(']')
			)
		}
	};

	my.init = function () {

		if (wgNamespaceNumber === 0 && propertyCount(entityProperty) === 0){
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
