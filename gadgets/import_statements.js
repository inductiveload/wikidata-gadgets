if ( typeof ( $ ) === 'undefined' ) $ = $j ;

function ucFirst(string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}

//importScriptURI("//toolserver.org/~magnus/ts2/js/common.js");

var wd_import_statements = {

	infobox2statement : {
		'Taxobox' : [
			{ key:'regnum' , statement:'kingdom' , type:'item' , pid:75 } ,
			{ key:'phylum' , statement:'phylum' , type:'item' , pid:76 } ,
			{ key:'classis' , statement:'class' , type:'item' , pid:77 } ,
			{ key:'ordo' , statement:'order' , type:'item' , pid:70 } ,
			{ key:'familia' , statement:'family' , type:'item' , pid:71 } ,
			{ key:'genus' , statement:'genus' , type:'item' , pid:74 } ,
			{ key:'species' , statement:'species' , type:'item' , pid:89 } ,
			{ key:'image' , statement:'image' , type:'media' , pid:18 }
		] ,
		'Persondata' : [
			{ key:'PLACE OF BIRTH' , statement:'place of birth' , type:'item' , pid:19 } ,
			{ key:'PLACE OF DEATH' , statement:'place of death' , type:'item' , pid:20 }
		] ,
		'Infobox scientist' : [
			{ key:'alma_mater' , statement:'alma mater' , type:'item' , pid:69 } ,
			{ key:'field' , statement:'field of work' , type:'item' , pid:101 }
		],
		'Infobox French commune' : [
			{ key:'canton' , statement:'is in the administrative unit' , type:'item' , pid:131 } ,
			{ key:'arrondissement' , statement:'is in the administrative unit' , type:'item' , pid:131 } ,
			{ key:'department' , statement:'is in the administrative unit' , type:'item' , pid:131 } ,
			{ key:'region' , statement:'is in the administrative unit' , type:'item' , pid:131 } ,
		],
	} ,

	running : false ,

	init : function () {
		var self = this ;

		var portletLink = mw.util.addPortletLink( 'p-tb', '#', 'Import statements','t-wd_import_statements');
		$(portletLink).click ( function () {
			self.run() ;
			return false ;
		} ) ;
	} ,

	run : function () {
		var self = this ;
		if ( self.running ) return ;
		self.running = true ;
		var q = mw.config.get('wgPageName').toLowerCase() ;
		self.q = q ;

		$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
			action : 'wbgetentities' ,
			ids : q ,
			format : 'json' ,
			sites : 'sites' ,
			props : 'sitelinks'
		} , function ( data ) {
			if ( undefined === data.entities[q] || undefined === data.entities[q].sitelinks || undefined === data.entities[q].sitelinks.enwiki ) {
				alert ( "Could not find en.wikipedia page, aborting" ) ;
				return ;
			}
			var title = data.entities[q].sitelinks.enwiki.title ;
			self.loadStatements ( 'en.wikipedia' , title ) ;
		} ) ;
	} ,

	prepareStatements : function () {
		var self = this ;
		self.queue = [] ;
		self.imported = 0 ;
		$.each ( self.templates , function ( k1 , v1 ) {
			if ( undefined === self.infobox2statement[v1.name] ) return ;
			$.each ( self.infobox2statement[v1.name] , function ( k2 , v2 ) {
				if ( undefined === v1.params[v2.key] ) return ;
				self.queue.push ( { type:v2.type , statement:v2.statement , value:v1.params[v2.key] , prop_id:v2.pid } ) ;
			} ) ;
		} ) ;
		self.processNextQueueItem() ;
	} ,

	processNextQueueItem : function () {
		var self = this ;
		if ( self.queue.length == 0 ) {
			alert ( "Infoboxes scanned, " + self.imported + " statements imported" ) ;
			return ;
		}
		var q = self.queue.shift() ;
		if ( q.type == 'item' ) {
			self.setStatementItem ( q.statement , q.value , q.prop_id ) ;
		} else if ( q.type == 'media' ) {
			console.log ( "TODO : Media" ) ;
			self.processNextQueueItem() ;
		} else {
			console.log ( "Undefined type " + v2.type ) ;
			console.log ( v1 ) ;
			console.log ( v2 ) ;
			self.processNextQueueItem() ;
		}
	} ,

	setStatementItem : function ( statement , value , pid ) {
		var self = this ;
		value = value.replace(/^\s+/,'').replace(/\s+$/,'') ;
		var m = value.match ( /\[\[(.+?)(\||\]\])/ ) ;
		if ( m === null ) {
			value = value.replace(/^'+/,'').replace(/'+$/,'') ;
		} else {
			value = self.standardizeTemplateName ( m[1] ) ;
		}
		value = value.replace(/^\s+/,'').replace(/\s+$/,'') ;
		if ( value == '' ) {
			self.processNextQueueItem() ;
			return ;
		}

		self.resolveRedirect ( value , function ( value ) {

			$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
				action : 'wbgetentities' ,
				format : 'json' ,
				sites : 'enwiki' ,
				titles : value ,
				props : 'info|claims'
			} , function ( data ) {
				if ( undefined !== data.entities['-1'] ) {
					self.processNextQueueItem() ;
					return ;
				}
				$.each ( data.entities , function ( id , v ) {

					if ( undefined !== v.claims ) {
						var p = 'p'+pid ;
						if ( undefined !== v.claims[p] ) { // Claim already exists
							self.processNextQueueItem() ;
							return ;
						}
					}

					var val = '{"entity-type":"item","numeric-id":' + id.replace(/\D/g,'') + '}' ;
					self.tryCreateClaim ( self.q , pid , val ) ;
					return false ;
				} ) ;
			} ) ;
		} ) ;
	} ,

	resolveRedirect : function ( title , callback ) {
		$.getJSON ( '//en.wikipedia.org/w/api.php?callback=?' , {
			action : 'query' ,
			titles : title ,
			format : 'json' ,
			redirects : '1'
		} , function ( data ) {
			if ( undefined !== data.query.pages ) {
				$.each ( data.query.pages , function ( k , v ) {
					title = v.title ;
				} ) ;
			}
			callback ( title ) ;
		} ) ;
	} ,

	claimAlreadyExists : function ( entity, property, valueId ) {

		if ( undefined !== entity
			&& undefined !== entity.claims
			&& undefined !== entity.claims['p'+property] ) {

			var thisPropClaims = entity.claims['p'+property];

			for (var i=0; i < thisPropClaims.length; i++){

				if (valueId === thisPropClaims[i].mainsnak.datavalue.value['numeric-id']){

					console.log ( "p"+property+' exists with value q' + valueId + ' for ' + entity ) ;
					self.processNextQueueItem() ;
					return true;
				}

			}
		}

		return false;
	} ,

	tryCreateClaim : function ( entity , property , value ) {
		var self = this ;
		entity = entity.toLowerCase() ;
		$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
			action : 'wbgetentities' ,
			format : 'json' ,
			ids : entity ,
			props : 'info|claims'
		} , function ( data ) {

			var valueJSON = JSON.parse(value);

			if (valueJSON['entity-type'] === 'item' && ('q' + valueJSON['numeric-id']) === entity){
				console.log ( "Self-referential claim: " + entity ) ;
				return;
			}

			if (self.claimAlreadyExists(data.entities[entity], property, valueJSON['numeric-id']) ){
				return;
			}

			self.createClaim ( entity , property , value ) ;
		} ) ;
	} ,


	createClaim : function ( entity , property , value ) {
		var self = this ;
		$.post ( '//www.wikidata.org/w/api.php' , {
			action : 'query' ,
			prop : 'info' ,
			intoken : 'edit' ,
			titles : entity ,
			format : 'json'
		} , function ( data ) {
			var token , lastrevid ;
			$.each ( (data.query.pages||[]) , function ( k , v ) {
				token = v.edittoken ;
				lastrevid = v.lastrevid ;
			} ) ;

			if ( undefined === token ) {
				console.log ( "Cannot get edit token for " + entity ) ;
				self.processNextQueueItem() ;
				return ;
			}

			$.post ( '//www.wikidata.org/w/api.php' , {
				action : 'wbcreateclaim' ,
				entity : entity ,
				snaktype : 'value' ,
				property : 'p'+property ,
				value : value ,
				token : token ,
				baserevid : lastrevid ,
				format : 'json'
			} , function ( data ) {
				self.imported++ ;
				self.processNextQueueItem() ;
			} , 'json' ) ;



		} , 'json' ) ;

	} ,

	loadStatements : function ( wiki , title ) {
		var self = this ;
		$.getJSON ( '//' + wiki + '.org/w/api.php?callback=?' , {
			action : 'parse' ,
			page : title ,
			format : 'json' ,
			prop : 'wikitext|categories'
		} , function ( data ) {
			if ( undefined === data.parse.wikitext ) {
				return ;
			}
			self.categories = [] ;
			$.each ( data.parse.categories , function ( k , v ) {
				self.categories.push ( v['*'] ) ;
			} ) ;
			self.tree = { type : 'page' , children : [] } ;
			var text = data.parse.wikitext['*'].replace(/\n/gm,' ') ;
			self.growTree ( text , self.tree ) ;
			self.templates = [] ;
			self.parseTemplatesFromTree ( self.tree ) ;
			self.prepareStatements () ;
		} ) ;
	} ,

	standardizeTemplateName : function ( s ) {
		return ucFirst ( s.replace(/^\s+/,'').replace(/\s+$/,'').replace(/_/g,' ') ) ;
	} ,

	parseTemplatesFromTree : function ( tree ) {
		var self = this ;
		$.each ( (tree.children||[]) , function ( k , v ) {
			self.parseTemplatesFromTree ( v ) ;
		} ) ;

		if ( tree.type != '{{' ) return ;

		var t = { name : '' , params : {} , orig:self.renderTree(tree) } ;
		var pcnt = 1 ;
		var is_new_field = false ;
		$.each ( tree.children , function ( k , v ) {
			if ( k == 0 ) {
				t.name = self.standardizeTemplateName ( v.text ) ;
				return ;
			}

			if ( v.newfield ) {
				is_new_field = true ;
				return ;
			}

			if ( is_new_field ) {
				is_new_field = false ;
				var nt = v.text ;
				var m = nt.match ( /^\s*([^=]+?)\s*=(.+)$/ ) ;
				var p = {} ;
				if ( m == null ) {
					p.key = pcnt++ ;
					p.value = nt ;
				} else {
					p.key = m[1] ;
					p.value = m[2] ;
				}
				last_key = p.key ;
				t.params[p.key] = p.value ;
			} else {
				t.params[last_key] += self.renderTree ( v ) ;
			}

		} ) ;

		self.templates.push ( t ) ;
	} ,

	renderTree : function ( tree ) {
		var self = this ;
		var ret = (tree.type||'') ;
		if ( undefined !== tree.text ) ret += tree.text ;
		$.each ( (tree.children||[]) , function ( k , v ) {
//			if ( tree.type == '{{' && k > 0 ) ret += "|" ;
			ret += self.renderTree ( v ) ;
		} ) ;
		return ret + (tree.close||'') ;
	} ,

	growTree : function ( text , tree ) {
		var self = this ;
		var p = 0 ;
		var t = '' ;
		while ( p < text.length ) {
			var s = text.substr ( p , 2 ) ;
			if ( s == '{{' || s == '{|' || s == '[[' ) {
				if ( t != '' ) { tree.children.push ( { text:t } ) ; t = '' ; }
				var node = { type : s , children : [] } ;
				text = self.growTree ( text.substr ( p+2 ) , node ) ;
				p = 0 ;
				tree.children.push ( node ) ;
			} else if ( s == '}}' || s == '|}' || s == ']]' ) {
				if ( t != '' ) { tree.children.push ( { text:t } ) ; t = '' ; }
				tree.close = s ;
				return text.substr ( p+2 ) ;
			} else if ( tree.type == '{{' && text[p] == '|' ) {
				if ( t != '' ) tree.children.push ( { text:t } ) ;
				t = '' ;
				tree.children.push ( { text:t , newfield:true } ) ;
				p++ ;
			} else {
				t += text[p] ;
				p++ ;
			}
		}
		if ( t != '' ) tree.children.push ( { text:t } ) ;
		return '' ;
	} ,

	the_end : ''
} ;

addOnloadHook ( function() {
	wd_import_statements.init () ;
});
