/**
 * DraggableSitelink.js
 *
 * Easily add a Wikipedia as an "imported from" (P143) reference to any
 * statement - just drag the sitelink on to the sources for that claim
 *
 * Patches to: https://github.com/inductiveload/wikidata-gadgets
 * Release: 2013-03-11 v0.9
 * Author: User:Inductiveload
 * Licence: MIT/GPL
 */

var DraggableSitelinks = (function ($) {

	var importedFrom = { //hint to show when dragging, defaults to 'en'
		'de' : 'Datenvorlage',
		'en' : 'Imported from',
		'fr' : 'Importé de',
		'it' : 'Importato da',
		'nl' : 'Geimporteerd uit',
		'ru' : 'взято из',
		'sv' : 'Importerad från',
		'zh' : '导入自',
	},
	wikiProperties = { //list of Wikipedia item IDs
		'ar' : 199700,
		'da' : 181163,
		'de' : 48183,
		'en' : 328,
		'fi' : 175482,
		'fr' : 8447,
		'el' : 11918,
		'eo' : 190551,
		'es' : 8449,
		'he' : 199913,
		'it' : 11920,
		'ja' : 177837,
		'nl' : 10000,
		'pl' : 1551807,
		'pt' : 11921,
		'ru' : 206855,
		'tr' : 58255,
		'sv' : 169514,
		'uk' : 199698,
		'vi' : 200180,
		'zh' : 30239
	},

	importedFromProperty = 'p' + 143,
	claimPatt=/q[0-9]+\$[\-A-F0-9]+/,
	urlPatt=/[0-9]+$/,
	myLang = mw.config.get('wgUserLanguage'),

	//Private functions
	init = function () {
		
		//set up styles
		$("<style type='text/css'></style>")
			.append('.x-draggable-sitelink-target{ background-color:#6EDDA6;}')
			.appendTo("head");

		//make the sitelinks draggable
		$('table.wb-sitelinks tbody > tr').draggable({
			cursor: "move",
			cursorAt: { top: 5, left: -5 },
			start: function( event, ui ) {
				$('div.wb-statement-references-container')
					.addClass('x-draggable-sitelink-target')
					
					//make the targets droppable (they can appear after load, 
					//so can't do this at init time
					.droppable({
						drop: function( event, ui ) {
							var lang = $(ui.helper).data('lang');

							addImportedFrom($(event.target), lang);

							return false;
						}
					});
			},
			stop: function( event, ui ) {
				$('div.wb-statement-references-container')
					.removeClass('x-draggable-sitelink-target')
					.droppable('destroy');
			},
			helper: function( event ) {

				var langCode = $(event.target)
					.parent()
					.children('td.wb-sitelinks-siteid')
					.text(),

				draggedPage = $('td.wb-sitelinks-link-' + langCode + ' > a')
					.text(),

				prefixText = importedFrom[myLang];

				if (prefixText === undefined){
					prefixText = importedFrom['en'];
				}

				return $("<div>")
					.attr({"class": "ui-widget-header x-draggable-sitelink-helper"})
					.text(prefixText + ': ' + langCode + '.wikipedia (' + draggedPage + ')')
					.data('lang', langCode);
			}
		});
	},

	addImportedFrom = function(target, lang) {
		//isolate the
		var targetClaim = target.prev()
			.children('.wb-claim')
			.attr('class');

		targetClaim = claimPatt.exec(targetClaim);

		var sourceItem = wikiProperties[lang];

		if (sourceItem === undefined){ //we don't know this wiki, have to bail
			console.log("This Wiki does not have a known ID - add it!");
			return;
		}

		// construct the Snak
		var snaks = {importedFromProperty: [{
			"snaktype":"value",
			"property":importedFromProperty,
			"datavalue":{"type":"wikibase-entityid",
				"value":{"entity-type":"item","numeric-id":sourceItem}
				}
			}]
		};

		//construct POST data
		var params = { 'entity' : wgPageName,
			'statement': ''+targetClaim,
			'snaks': JSON.stringify(snaks),
			'token':wbRepoEditToken,
			'action':'wbsetreference'
		};

		//post the reference and reload
		var api = new mw.Api();

		api.post(params)
			.done( function ( data ) {
				document.location.reload(true);
			});
	}

	mw.loader.using( ['jquery.ui.draggable', 'jquery.ui.droppable'], function () {
		$(document).ready(function() {
			init();
		});
	});
}(jQuery));

