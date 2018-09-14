(function () {

var header = document.querySelector('header');
var headerLinks = Array.prototype.slice.call(document.querySelectorAll('header a'));
var sectionEls = Array.prototype.slice.call(document.querySelectorAll('#intro, #projects, #etc, #contact'));
var sections = [];
var reversedSections = [];
var cache = {};
var videoDirectory = 'https://d2dm4a09rc5ve.cloudfront.net/';
var posterDirectory = './assets/video_covers/'
var projectMediaEls = document.querySelectorAll('.project-media[data-project-id]');
var projectMedia = [];
var videoMap = [
	{
		id : 'newseful',
		src : videoDirectory + 'newseful.mp4',
		poster : posterDirectory + 'newseful.jpg'
	},
	{
		id : 'ntype',
		src : videoDirectory + 'ntype.mp4',
		poster : posterDirectory + 'ntype.jpg'
	},
	{
		id : 'frerejones',
		src : videoDirectory + 'frerejones.mp4',
		poster : posterDirectory + 'frerejones.jpg'
	}
];
window.Easing = {
  // no easing, no acceleration
  linear: function (t) { return t },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t*t },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t) },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  // accelerating from zero velocity 
  easeInCubic: function (t) { return t*t*t },
  // decelerating to zero velocity 
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  // acceleration until halfway, then deceleration 
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  // accelerating from zero velocity 
  easeInQuart: function (t) { return t*t*t*t },
  // decelerating to zero velocity 
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  // acceleration until halfway, then deceleration 
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};

// start value, end value, duration, time, start time
window.Lerp = function (d, t, st) {
	return (t - st) / d;
}

window.AnimationManager = {
	loopCount : 0,
	periodicals : [],
	animationQueue : [],
	oneOffs : [],
	enqueue : function (fn) {
		this.animationQueue.push(fn);
	},
	enqueuePeriodical : function (fn) {
		this.periodicals.push(fn);
	},
	animate : function (el, prop, start, end, duration, easing) {
		this.oneOffs.push({
			el : el,
			prop : prop,
			duration : duration,
			startTime : new Date().getTime(),
			easing : easing,
			start : start,
			end : end,
			easing : easing
		});
	},
	frame : function (a) {
		var time = new Date().getTime();
		if (time > a.startTime + a.duration) {
			if (a.el == 'scroll' || a.prop == 'scroll') {
				window.scrollTo(0, a.end);
				return false;
			}
			a.el[a.prop] = a.end;
			return false;
		}

		var progress = window.Lerp(a.duration, new Date().getTime(), a.startTime);
		progress = a.easing(progress);
		var val = a.start + ((a.end - a.start) * progress);

		if (a.el == 'scroll' || a.prop == 'scroll') {
			window.scrollTo(0, val);
			return true;
		}

		a.el[a.prop] = val;
		return true;
	},
	loop : function () {
		for (var i = 0; i < this.animationQueue.length; i++) {
			this.animationQueue[i]();
		}

		for (var i = 0; i < this.oneOffs.length; i++) {
			if ( !this.frame(this.oneOffs[i]) ) {
				this.oneOffs.splice(i, 1);
				i--;
			}
		}

		this.animating = !!this.oneOffs.length;

		this.loopCount++;
		if (this.loopCount >= 100) {
			for (var i = 0; i < this.periodicals.length; i++) {
				this.periodicals[i]();
			}
			this.loopCount = 0;
		}

		window.requestAnimationFrame(window.AnimationManager.loop.bind(this));
	}
}

var cacheDimensions = function () {
	cache = {
		pageYOffset : window.pageYOffset,
		innerHeight : window.innerHeight,
		innerWidth : window.innerWidth
	}
}

var elementIsInView = function (el, proportion) {
	return (
		el.pos < (cache.pageYOffset + cache.innerHeight * (1-proportion)) &&
		(el.pos + el.rect.height * (1 - proportion)) > cache.pageYOffset
	)
}

var updateHeaderAppearance = function () {
	if (cache.pageYOffset > 0) {
		header.classList.add('fixed');
	} else {
		header.classList.remove('fixed');
	}
}

var showLoadingState = function () {
	document.querySelector('.loader').classList.add('shown');
}

var clearLoadingState = function () {
	document.querySelector('.loader').classList.remove('shown');
}

var videoElement = function (id) {
	var props = videoMap.find(function (i) {
		return i.id == id;
	});
	var el = document.createElement('video');
	var src = document.createElement('source');
	src.src = props.src;
	src.type = 'video/mp4'
	el.autoplay = true;
	el.poster = props.poster;
	el.loop = true;
	el.appendChild(src);

	el.addEventListener('waiting', function () { showLoadingState(); });
	el.addEventListener('canplay', function () { clearLoadingState(); });

	return el;
}

var updateMediaStates = function () {
	if ((window.innerWidth < 700) || window.AnimationManager.animating)
		return;

	var videosInDom = 0;	
	for (var i = 0; i < projectMedia.length; i++) {
		var currentMedia = projectMedia[i];
		var isInView = elementIsInView(currentMedia, .75);
		if (isInView && currentMedia.hasVideo == false) {
			currentMedia.hasVideo = true;
			var video = videoElement(currentMedia.el.dataset.projectId);
			currentMedia.el.appendChild(video);
			video.load();
			video.play();
		} else if (!isInView && currentMedia.hasVideo == true) {
			currentMedia.hasVideo = false;
			var video = currentMedia.el.querySelector('video');
			video.src = '';
			video.load();
			video.parentNode.removeChild(video);
		}

		if (currentMedia.hasVideo)
			videosInDom++;
	}

	if (videosInDom == 0) {
		clearLoadingState();
	}
}

var updateActiveHeaderLink = function () {

	for (var j = 0; j < headerLinks.length; j++) {
		headerLinks[j].classList.remove('active');
	}

	for (var i = 0; i < reversedSections.length; i++) {
		if (cache.pageYOffset < reversedSections[i].pos) {
			continue;
		} else {
			var activeLink = headerLinks.find(function (l) {
				return l.dataset.linkTo == reversedSections[i].id;
			});
			activeLink.classList.add('active');
			break;
		}
	}
}

var updateSectionPositions = function () {
	sections = [];
	reversedSections = [];
	for (var i = 0; i < sectionEls.length; i++) {
		var el = sectionEls[i];
		var rect = el.getBoundingClientRect();
		var pos = (function () {
			if (el.id == 'intro') {
				return 0;
			} else if (el.id == 'contact') {
				return document.documentElement.scrollHeight - cache.innerHeight - 100;
			} else {
				return cache.pageYOffset + rect.top - 58;
			}
		})();
		sections.push({
			el : el,
			pos : pos,
			id : el.id
		});
	}

	reversedSections = Array.prototype.slice.call(sections).reverse();
}

var updateMediaPositions = function () {
	projectMedia = [];
	for (var i = 0; i < projectMediaEls.length; i++) {
		var el = projectMediaEls[i];
		var rect = el.getBoundingClientRect();
		var pos = cache.pageYOffset + rect.top;
		projectMedia.push({
			el : el,
			rect : rect,
			pos : pos,
			hasVideo : !!el.querySelector('video')
		});
	}
}

var listenForSectionNavigation = function () {
	headerLinks.forEach(function (l, i) {
		l.addEventListener('click', function (e) {
			e.preventDefault();
			var targetPosition = sections[i].pos;
			window.AnimationManager.animate('scroll', 'scroll', cache.pageYOffset, targetPosition + 10, 1000, window.Easing.easeInOutQuart);
		});
	});
}

window.onbeforeunload = function () {
	document.querySelectorAll('video').forEach(function (video) {
		video.parentNode.removeChild(video);
	})
}

window.AnimationManager.enqueue(cacheDimensions);
window.AnimationManager.enqueue(updateHeaderAppearance);
window.AnimationManager.enqueue(updateActiveHeaderLink);
window.AnimationManager.enqueue(updateMediaStates);
window.AnimationManager.enqueuePeriodical(updateSectionPositions);
window.AnimationManager.enqueuePeriodical(updateMediaPositions);

listenForSectionNavigation();

window.AnimationManager.loop();

})();