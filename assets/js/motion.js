/*
	Scroll motion for a static page.
	Skipped entirely when the visitor prefers reduced motion.
	The loader tracks same-origin images only, so a third-party
	form iframe cannot hold the page.
*/
(function () {
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var loader = document.getElementById("loader");
	var pctEl = document.getElementById("loader-pct");

	function removeLoader(animate) {
		if (!loader || !loader.parentNode) return;
		if (!animate) {
			loader.remove();
			return;
		}
		if (pctEl) pctEl.textContent = "100";
		loader.classList.add("is-done");
		window.setTimeout(function () {
			if (loader.parentNode) loader.remove();
		}, 420);
	}

	if (reduce) {
		removeLoader(false);
	} else if (loader) {
		var value = 8;
		if (pctEl) pctEl.textContent = "8";
		var local = Array.prototype.filter.call(document.images, function (img) {
			try {
				return img.currentSrc ? img.currentSrc.indexOf(location.host) !== -1 : (img.src || "").indexOf(location.host) !== -1;
			} catch (err) {
				return false;
			}
		});
		var done = 0;
		function tick() {
			var ratio = local.length ? done / local.length : 1;
			value = Math.max(value, Math.round(12 + ratio * 80));
			if (pctEl) pctEl.textContent = String(Math.min(value, 96));
			if (done >= local.length) removeLoader(true);
		}
		local.forEach(function (img) {
			if (img.complete) {
				done += 1;
			} else {
				img.addEventListener("load", function () { done += 1; tick(); }, { once: true });
				img.addEventListener("error", function () { done += 1; tick(); }, { once: true });
			}
		});
		tick();
		/* Never sit on the loader if an image stalls. */
		window.setTimeout(function () { removeLoader(true); }, 1200);
	}

	if (reduce || !("IntersectionObserver" in window)) return;

	document.documentElement.classList.add("js-motion");

	document.querySelectorAll(".skill-list li").forEach(function (li, index) {
		li.style.setProperty("--i", String(index));
	});

	var nodes = document.querySelectorAll(".reveal");
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			entry.target.classList.add("is-in");
			io.unobserve(entry.target);
		});
	}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

	nodes.forEach(function (el) {
		var rect = el.getBoundingClientRect();
		if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
			el.classList.add("is-in");
		} else {
			io.observe(el);
		}
		el.addEventListener("focusin", function () {
			el.classList.add("is-in");
		});
	});

	var bg = document.querySelector(".hero-bg");
	var allowParallax = bg && window.matchMedia("(min-width: 737px)").matches;
	if (!allowParallax) return;

	var frame = 0;
	function paint() {
		frame = 0;
		var y = Math.min(window.scrollY || 0, 700) * 0.16;
		bg.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)";
	}
	window.addEventListener("scroll", function () {
		if (frame) return;
		frame = window.requestAnimationFrame(paint);
	}, { passive: true });
	paint();
})();
