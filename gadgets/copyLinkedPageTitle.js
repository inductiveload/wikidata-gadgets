// copyLinkedPageTitle.js
//
// Simple gadget to use an linked page title as the item label
//
// Author: Inductiveload
// Version: 1.0.0

var CopyLinkedPageTitle = (function ($) {
	var my = {};
	
	var insertLink = function (i, v) {
		$(v).append( $('<span>')
				.append( $('<img>', {
					'src':'//upload.wikimedia.org/wikipedia/commons/1/1d/Tag_blue.png', 
					'title':'Use for the item label'})
				.click(useLabel)
				)
			);
	}
	
	var useLabel = function (e){
		var label = $(e.target).parents('.wb-editsection').siblings('.wb-sitelinks-link').children('a').text();
		
		var labelBox = $('.wb-ui-labeledittool input');
		
		labelBox.val(label).trigger('keydown',  [45] );
	}
	
	
	my.addLinks = function () {
		
		if (wgNamespaceNumber === 0 && $('.wb-ui-labeledittool input').length > 0){
			$('.wb-sitelinks tbody .wb-editsection .wb-ui-toolbar').each( insertLink );
		}
	};
	
	return my;
}(jQuery));


$(document).ready(function() {
	CopyLinkedPageTitle.addLinks();
});
