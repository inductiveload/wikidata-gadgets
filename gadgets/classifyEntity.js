// ClassifyEntity.js
//
// Simple gadget to classify items into the six major entities
//
// Author: Inductiveload
// Version: 1.0.0

var ClassifyEntity = (function ($) {
	var my = {};
	var entityProperty = 'p107';

	my.init = function () {

		if (wgNamespaceNumber === 0 && $('.wb-claim-section-'+entityProperty).length === 0){
			$('.wb-claimlistview').append(
				$('<div>')
				.attr({'class', 'x-entitypicker'});
			);
		}
	};

	return my;
}(jQuery));


$(document).ready(function() {
	ClassifyEntity.init();
});
