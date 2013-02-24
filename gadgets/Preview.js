// <nowiki>

// -------------------------------------------------------------------------------------------------------------
// Shows a "preview" button next to each linked article to get a preview of the article right next to the table.
// Much thanks to User:Denny/articlePreview.js, from which I got the idea.
//
// Usage: Enable the gadget Preview in your preferences.
// -------------------------------------------------------------------------------------------------------------

( function( mw, $ ) {
	"use strict";

	if( !mw.config.get( 'wbEntityId' ) || mw.config.get( 'wbEntityId' ).substr( 0, 1 ) !== 'q' ) {
		return;
	}

	switch ( mw.config.get( 'wgUserLanguage' ) ) {
	case 'de':
	case 'de-at':
	case 'de-ch':
	case 'de-formal':
		mw.messages.set( {
			'title':	'Artikelvorschau',
			'preview':	'Vorschau',
			'noarticle':'Du hast noch keinen Artikel ausgewählt.',
			'readmore':	'Weiterlesen',
			'hide':		'verstecken',
			'show':		'zeigen',
			'remove':	'entfernen',
			'translate':'übersetzen'
		} );
		break;
	case 'fa':
		mw.messages.set( {
			'title':	'پیش‌نمایش مقاله',
			'preview':	'پیش‌نمایش',
			'noarticle':'شما هنوز مقاله‌ای را انتخاب نکرده‌اید.',
			'readmore':	'مطالعهٔ بیشتر',
			'hide':		'پنهان',
			'show':		'نمایش',
			'remove':	'remove',
			'translate':'translate'
		} );
		break;
	case 'fi':
		mw.messages.set( {
			'title':	'Artikkelin esikatselu',
			'preview':	'esikatselu',
			'noarticle':'Et ole vielä valinnut artikkelia.',
			'readmore':	'Lue lisää',
			'hide':		'piilota',
			'show':		'näytä',
			'remove':	'poistaa',
			'translate':'kääntää'
		} );
		break;
	case 'hu':
		mw.messages.set( {
			'title':	'Cikk előnézete',
			'preview':	'előnézet',
			'noarticle':'Nem választottál cikket.',
			'readmore':	'Tovább',
			'hide':		'elrejt',
			'show':		'mutat',
			'remove':	'eltávolít',
			'translate':'fordít',
		} );
		break;
	default:
	case 'en':
		mw.messages.set( {
			'title':	'Article preview',
			'preview':	'preview',
			'noarticle':'You have not selected an article yet.',
			'readmore':	'Read more',
			'hide':		'hide',
			'show':		'show',
			'remove':	'remove',
			'translate':'translate'
		} );
	}

	/**
	 * The cached previews.
	 */
	var cache = {};

	/**
	 * Initialising the links.
	 */
	function init() {
		var lang = mw.config.get( 'wgUserLanguage' );

		if( $( '.wb-sitelinks-link-' + lang + ' a' ).text() ) {
			$( '#x-articlepreview-content p' )
			.append( '<br>&nbsp;&rarr;&nbsp;' )
			.append(
				$( '<a>' )
				.attr( 'href', '#' )
				.text( $( '.wb-sitelinks-link-' + lang + ' a' ).text() )
				.click( function() {
					preview( lang, $( '.wb-sitelinks-link-' + lang ).attr( 'dir' ) );
					return false;
				} ) // </a>
			);
		}

		$( '.wb-sitelinks tbody tr' ).each( function() {
			var $link, lang, dir;
			$link = $( this ).find( '.wb-sitelinks-link' );
			lang = $link.attr( 'lang' );
			dir = $link.attr( 'dir' );
			$link.hover( function () {
				$( this ).append(
					$( '<span>' )
					.append(
						$( '<a>' )
						.attr( 'href', '#x-articlepreview' )
						.css( 'float', $( this ).attr( 'dir' ) == 'ltr' ? 'right' : 'left' )
						.text( mw.msg( 'preview' ) )
						.click( function() {
							preview( lang, dir );
							//return false;
						} )
					)
				);
			}, function() {
				$( this ).find( 'span' ).remove();
			} );
		} );
	}

	function getTranslateLink(src, dest, url) {
		return '//translate.google.com/translate?sl='+src+'&tl='+dest+'&u='+url;
	}

	/**
	 * Showing the preview got by an http request. Requests are cached.
	 *
	 * @param lang the article's language
	 * @param dir the article's language direction
	 */
	function preview( lang, dir ) {
		var title = $( '.wb-sitelinks-link-' + lang + ' a:eq(0)' ).text();
		if( !title ) {
			return;
		}

		var previewRowClass = 'article-preview-'+lang;

		//add a new row below the language entry
		if ($('tr.' + previewRowClass).length === 0) {
			var cols = $('tr.wb-sitelinks-'+lang).children().length;

			$('tr.wb-sitelinks-'+lang).after(
				$('<tr>')
				.attr({
					'class': previewRowClass + ' ' +'article-preview' + ' ' + 'uneven',
					'lang': lang
				})
				.append($('<td>', {'class':previewRowClass, 'colspan':cols}))
			);
		}

		if ( cache.hasOwnProperty( lang ) ) {
			showPreview( cache[lang], previewRowClass );
		}
		else {

			var articleLink = '//' + lang + '.wikipedia.org/wiki/' + mw.util.wikiUrlencode( title );

			mw.loader.using( ['jquery.spinner'], function() {

				$.createSpinner( {
					size: 'large',
					type: 'block'
				} ).appendTo( 'td.' + previewRowClass );
				$.getJSON(
					'//' + lang + '.wikipedia.org/w/api.php?callback=?',
					{
						action: 'query',
						prop: 'extracts',
						exintro: true,
						exchars: 1000,
						titles: title,
						format: 'json'
					},
					function ( data ) {
						var $preview = $( '<span>' )
						.css( 'float', dir == 'ltr' ? 'right' : 'left' )
						.append( '[' )
						.append(
							$( '<a>' )
							.attr( {
								href: '#',
								'class': 'x-articlepreview-toggle'
							} )
							.text( mw.msg( 'hide' ) ) // </a>
						)
						.append( ']' )
						.append( '[' )
						.append(
							$( '<a>' )
							.attr( {
								href: '#',
								'class': 'x-articlepreview-remove'
							} )
							.text( mw.msg( 'remove' ) ) // </a>
						)
						.append( ']' )
						.append( '[' )
						.append(
							$( '<a>' )
							.attr( {
								href: getTranslateLink(lang, mw.config.get( 'wgUserLanguage' ), articleLink),
								'class': 'x-articlepreview-translate',
							})
							.text( mw.msg( 'translate' ) ) // </a>
						)
						.append( ']' )
						.after(
							$( '<div>' )
							.attr( {
								'class': 'mw-content-' + dir + ' ' + 'x-articlepreview-article',
								dir: dir,
								lang: lang
							} )
							.html( data.query.pages[Object.keys( data.query.pages )[0]].extract.replace( /<\/p>(…|...)/, '…</p>' ) )
							.append(
								$( '<p>' )
								.attr( {
									'class': 'x-articlepreview-readmore',
								})
								.append(
									$( '<a>' )
									.attr( 'href', articleLink )
									.text( mw.msg( 'readmore' ) )
								) // </a>
							) // </p>
						); // </span>
						cache[lang] = $preview;
    					showPreview( $preview, previewRowClass);
					}
				);
			} );
		}
	}

	/**
	 * Adds the preview to the document.
	 *
	 * @param preview the preview in html format
	 */
	function showPreview( preview, rowClass) {
		$( 'td.' + rowClass ).html( preview );
		// toggle link
		$( '.x-articlepreview-toggle' ).toggle( function() {
			$( this ).parent().siblings('.x-articlepreview-article' ).slideUp();
			$( this ).text( mw.msg( 'show' ) );
		}, function() {
			$( this ).parent().siblings('.x-articlepreview-article' ).slideDown();
			$( this ).text( mw.msg( 'hide' ) );
		} );

		$( '.x-articlepreview-remove' ).click( function(e) {
			$( this ).parents('tr.' + rowClass).remove();
			e.preventDefault();
		});
	}

	$( document ).ready( init );
} )( mediaWiki, jQuery );

// </nowiki>
