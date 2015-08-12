//========================================================
//	jquery.socialshare.js 		[Jeremy J Paris - 2014]
//	-- Social media sharing functionality suite
//	
//	DEPENCENCIES
//		-- jQuery 1.7+
//
//========================================================


;(function( $ ){

	var defaults = {
		networkAttr : 'data-network',
		actionAttr : 'data-ss-action',
		facebook : 
			{
				link: window.location.href,											//-- URL
				name: $('meta[property="og:title"]').attr("title"),					//-- Link title
				caption: null,														//-- caption for the link that goes underneath the link title
				description: $('meta[property="og:description"]').attr("content"),	//-- share description
				picture: $('meta[property="og:image"]').attr("content"),			//-- full URL of image
				onSuccess: function() {},											//-- callback hook for successful share
				onFail: function() {}												//-- callback hook for faled share
			},
		twitter :
			{
				url: window.location.href,											//-- URL
				txt: null,															//-- text
				hashtags: null,														//-- comma-delimited list
				related: null,														//-- related usernames
				via: null,															//-- via username (eg "via @weduinc" in tweet, "weduinc" in variable)
				in_reply_to: null,													//-- tweet id (for tweet replies),
				follow_user: null													//-- username w/o the @ (eg weduinc) of the targeted account for Follow links
			},
		linkedin : 
			{
				url: window.location.href,											//-- URL
				title: $('meta[property="og:title"]').attr("title"),				//-- Title of article
				source: null,														//-- source of article
				summary: $('meta[property="og:description"]').attr("content")		//-- Summary of article
			}, 
		pinterest :
			false,	//-- whether or not to load Pinterest's on hover button for images
	}

	$.fn.socialshare = function( options ){
		//-- setup options
		var settings = $.extend(true, {}, defaults, options);
		// console.log(settings);

		//-- load pinterest in needed
		if(settings.pinterest){ _load_pinterest(); }

		return this.each(function(){
			var elObj = $(this);

			//-- only use on valid <a> tags
			if(elObj.is('a')) {
				//-- what network are we setting up?
				switch( elObj.attr( settings.networkAttr ) ){
					//-- FACEBOOK-------------------------
					case 'facebook':
						//-- pull from metadata if there is any
						if($('meta[property="fb:app_id"]').length > 0 && $('meta[property="fb:app_id"]').attr("content") != '')
						{
							_facebookAPPID = $('meta[property="fb:app_id"]').attr("content");
						}

						switch(elObj.attr( settings.actionAttr )){
							case "share":
							default:
								if(_facebookAPPID != '' && _facebookAPPID != null && _facebookAPPID != undefined)
								{
									_load_facebook();
									elObj.off("click");
									elObj.on("click", function(e){
										e.preventDefault();
										_share_facebook(settings.facebook);
									});	
								}
								//-- no APP ID? falback to plain jane sharer link that just opens in a new tab
								else
								{
									elObj.attr( "href", _get_facebook_URL(settings.facebook) );
									elObj.attr( "target", "_blank" );
								}	
								break;

						}											
						break;
					//-- TWITTER-------------------------
					case 'twitter':
						_load_twitter();
						switch(elObj.attr( settings.actionAttr )){
							case "follow":
								elObj.attr( "href", _get_twitter_follow_URL(settings.twitter) );	
								break;
							case "share":
							default:
								elObj.attr( "href", _get_twitter_URL(settings.twitter) );
								break;

						}
						break;
					//-- LINKEDIN-------------------------
					case 'linkedin':
						switch(elObj.attr( settings.actionAttr )){
							case "share":
							default:
								elObj.off("click", _share_linkedin);
								elObj.attr( "href", _get_linkedin_URL(settings.linkedin) );
								elObj.on("click", _share_linkedin);
								break;

						}
						
						break;
				}
			}
		});
	};

	//==================================================
	//=============== FACEBOOK DIALOG FEED =============
	//==================================================
	//-- https://developers.facebook.com/docs/javascript/quickstart
	var _facebookAPPID = '';	//-- FB requires an APP ID for their dialog feed
	var _facebookScriptSrc = "//connect.facebook.net/en_UK/all.js";
	var _facebookShareURL = "https://www.facebook.com/sharer/sharer.php";

	//-- _share_facebook( o )
	//--		Takes in object (o) of settings and opens share dialog feed
	function _share_facebook(o)
	{
		FB.ui({
			method: 'feed',
			link: o.link,
			name: o.name,
			caption: o.caption,
			description: o.description,
			picture: o.picture
		}, function(response){
			if (response && response.post_id){
				o.onSuccess.call(this);
			}
			else{
				o.onFail.call(this);
			}
		});	
	}
	//-- _load_facebook( )
	//--		Utility function loads the necessary JS files and HTML for Facebook
	function _load_facebook()
	{
		if($('#fb-root').length == 0){
			$('body').prepend('<div id="fb-root"></div>');
			$.ajaxSetup({ cache: true });
			$.getScript(_facebookScriptSrc, function(){
				FB.init({
					appId: _facebookAPPID,
				});
			});
		}
	}
	//-- _get_facebook_URL( o )
	//--		Takes in object (o) of settings and builds tweet URL based on them
	function _get_facebook_URL(o)
	{
		var qStr = [];
		qStr.push('u='+encodeURI(o.link));
		qStr.push('u='+encodeURI(o.link));

		return _facebookShareURL+'?'+qStr.join("&");
	}

	//==================================================
	//=============== TWITTER ==========================
	//==================================================
	//-- https://dev.twitter.com/docs/intents
	var _twitterScriptSrc = "//platform.twitter.com/widgets.js";
	var _twitterIntentTweetURL = "//twitter.com/intent/tweet";
	var _twitterIntentUserURL = "//twitter.com/intent/user";

	//-- _load_twitter( )
	//--		Utility function loads the necessary JS files for Twitter
	function _load_twitter()
	{
		if(!$('body').hasClass('ssTwitterLoaded')){
			$.ajaxSetup({ cache: true });
			$.getScript(_twitterScriptSrc);
			$('body').addClass('ssTwitterLoaded');
		}
	}
	//-- _get_twitter_URL( o )
	//--		Takes in object (o) of settings and builds tweet URL based on them
	function _get_twitter_URL(o)
	{
		var qStr = [];
		qStr.push('url='+encodeURI(o.url));
		if(o.txt != null){  qStr.push('text='+encodeURI(o.txt));  }
		if(o.hashtags != null){  qStr.push('hashtags='+encodeURI(o.hashtags));  }
		if(o.related != null){  qStr.push('related='+encodeURI(o.related));  }
		if(o.via != null){  qStr.push('via='+encodeURI(o.via));  }
		if(o.in_reply_to != null){  qStr.push('in_reply_to='+o.in_reply_to);  }

		return _twitterIntentTweetURL+'?'+qStr.join("&");
	}
	//-- _get_twitter_follow_URL(o)
	//-- 		Takes in object (o) of username to build the follow link
	function _get_twitter_follow_URL(o)
	{
		var qStr = [];
		if(o.follow_user!=null){
			qStr.push('screen_name='+encodeURI(o.follow_user));
			return _twitterIntentUserURL+'?'+qStr.join("&");
		}
		return "#";
	}



	//==================================================
	//=============== LINKEDIN =========================
	//==================================================
	//-- https://developer.linkedin.com/documents/share-linkedin
	var _linkedinShareURL = "https://www.linkedin.com/shareArticle";

	//-- _share_linkedin( e )
	//--		Takes in event (e) from click event, and opens link up into a new window
	function _share_linkedin(e)
	{
		e.preventDefault();
		var target = $(e.currentTarget);
		window.open(target.attr("href"), '_blank', 'height=570,width=520,menubar=0,resizable=0,scrollbars=0');
	}
	//-- _get_linkedin_URL( o )
	//--		Takes in object (o) of settings and builds a sharing URL based on them
	function _get_linkedin_URL(o)
	{
		var qStr = ['mini=true'];
		qStr.push('url='+encodeURI(o.url));
		if(o.title != null){  qStr.push('title='+encodeURI(o.title));  }
		if(o.source != null){  qStr.push('source='+encodeURI(o.source));  }
		if(o.summary != null){  qStr.push('summary='+encodeURI(o.summary));  }

		return _linkedinShareURL+'?'+qStr.join("&");
	}



	//==================================================
	//=============== PINTEREST ========================
	//==================================================
	//-- https://developers.pinterest.com/on_hover_pin_it_buttons/

	//-- _load_pinterest( )
	//--		Utility function loads the necessary JS files for Pinterest
	function _load_pinterest()
	{
		if(!$('body').hasClass('ssPinterestLoaded')){
			$('body').append('<script type="text/javascript" async  data-pin-hover="true" src="//assets.pinterest.com/js/pinit.js"></script>')
			$('body').addClass('ssPinterestLoaded');
		}
	}


})( jQuery );

