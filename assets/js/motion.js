/*
	Page motion.

	The live site looked static for two reasons:
	1. GSAP, ScrollTrigger, and Lenis were loaded from jsDelivr. If that CDN
	   is blocked or slow, this file bails out and nothing animates. They are
	   now local.
	2. assets/js/motion.js kept the same URL as the earlier subtle version, and
	   GitHub Pages caches it for 10 minutes. The HTML/CSS could update while
	   the browser kept the old script. Local CSS and JS now use ?v=3.

	Lenis is not started in Safari. Its smooth-wheel handling fights trackpad
	scrolling there, so ScrollTrigger pins never advance. Chrome still gets Lenis.
	ScrollTrigger is created only after the intro lock is released, so pins are
	measured against the real page height.
*/
(function () {
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var loader = document.getElementById("loader");
	var root = document.documentElement;
	var safari = /Safari\//.test(navigator.userAgent) && !/Chrome\/|Chromium\/|Edg\/|OPR\//.test(navigator.userAgent);

	function dropLoader() {
		root.classList.remove("is-loading");
		if (loader && loader.parentNode) loader.remove();
	}

	if (reduce || !window.gsap || !window.ScrollTrigger) {
		var fallback = document.querySelector("[data-rotate]");
		if (fallback && !fallback.textContent.trim()) fallback.textContent = "BI Engineer";
		dropLoader();
		return;
	}

	var gsap = window.gsap;
	gsap.registerPlugin(window.ScrollTrigger);
	var started = false;

	function splitChars(el) {
		var text = el.textContent;
		el.setAttribute("aria-label", text.trim());
		el.textContent = "";
		text.split(" ").forEach(function (word, wi, words) {
			var mask = document.createElement("span");
			mask.className = "word-mask";
			word.split("").forEach(function (ch) {
				var span = document.createElement("span");
				span.className = "char";
				span.setAttribute("aria-hidden", "true");
				span.textContent = ch;
				mask.appendChild(span);
			});
			el.appendChild(mask);
			if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
		});
	}

	function maskHeading(el) {
		if (!el || el.dataset.masked) return;
		el.dataset.masked = "1";
		var inner = document.createElement("span");
		inner.className = "line-mask-inner";
		while (el.firstChild) inner.appendChild(el.firstChild);
		var mask = document.createElement("span");
		mask.className = "line-mask";
		mask.appendChild(inner);
		el.appendChild(mask);
		gsap.from(inner, {
			yPercent: 120,
			duration: 0.9,
			ease: "power4.out",
			immediateRender: false,
			scrollTrigger: { trigger: el, start: "top 88%", once: true }
		});
	}

	document.querySelectorAll("[data-split='chars']").forEach(splitChars);

	root.classList.add("is-loading");
	var pctEl = document.getElementById("loader-pct");
	var barEl = document.getElementById("loader-bar");
	var count = { n: 0 };
	var countTime = window.matchMedia("(min-width: 700px)").matches ? 1.25 : 0.85;
	var intro = gsap.timeline({ onComplete: beginScrollMotion });

	intro.to(count, {
		n: 100,
		duration: countTime,
		ease: "power1.inOut",
		onUpdate: function () {
			var n = Math.round(count.n);
			if (pctEl) pctEl.textContent = String(n);
			if (barEl) barEl.style.width = n + "%";
		}
	});
	intro.to(loader, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, countTime);

	var chars = document.querySelectorAll(".name .char");
	if (chars.length) {
		gsap.set(chars, { yPercent: 120 });
		intro.to(chars, { yPercent: 0, duration: 0.85, stagger: 0.03, ease: "power4.out" }, countTime + 0.05);
	}
	intro.from(".kicker, .lede, .cta-row .btn, .scroll-cue", {
		y: 40,
		autoAlpha: 0,
		duration: 0.65,
		stagger: 0.07,
		ease: "power3.out",
		immediateRender: true
	}, countTime + 0.28);
	if (document.querySelector(".portrait-wrap")) {
		intro.from(".portrait-wrap", {
			scale: 0.84,
			autoAlpha: 0,
			duration: 1,
			ease: "power3.out",
			immediateRender: true
		}, countTime + 0.02);
	}

	var roleEl = document.querySelector("[data-rotate]");
	if (roleEl) {
		var roles = (roleEl.getAttribute("data-rotate") || "").split("|").map(function (s) { return s.trim(); }).filter(Boolean);
		var ri = 0;
		function cycle() {
			var text = roles[ri % roles.length];
			ri += 1;
			var proxy = { n: 0 };
			roleEl.textContent = "";
			gsap.to(proxy, {
				n: text.length,
				duration: Math.max(0.4, text.length * 0.04),
				ease: "none",
				onUpdate: function () { roleEl.textContent = text.slice(0, Math.round(proxy.n)); },
				onComplete: function () {
					gsap.delayedCall(1.35, function () {
						gsap.to(roleEl, {
							y: -18,
							autoAlpha: 0,
							duration: 0.25,
							onComplete: function () {
								gsap.set(roleEl, { y: 16, autoAlpha: 0 });
								gsap.to(roleEl, { y: 0, autoAlpha: 1, duration: 0.25, onComplete: cycle });
							}
						});
					});
				}
			});
		}
		intro.call(cycle, null, countTime + 0.45);
	}

	function reveal(list, vars) {
		gsap.utils.toArray(list).forEach(function (el) {
			gsap.from(el, Object.assign({
				y: 80,
				opacity: 0,
				scale: 0.92,
				duration: 0.85,
				ease: "power3.out",
				immediateRender: false,
				scrollTrigger: { trigger: el, start: "top 90%", once: true },
				clearProps: "opacity,transform"
			}, vars || {}));
			el.addEventListener("focusin", function () {
				gsap.killTweensOf(el);
				gsap.set(el, { clearProps: "opacity,transform,scale" });
			});
		});
	}

	function wireProjectWheel(scroller) {
		scroller.addEventListener("wheel", function (event) {
			var max = scroller.scrollWidth - scroller.clientWidth;
			if (max <= 8) return;
			if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
			var next = scroller.scrollLeft + event.deltaY;
			if ((event.deltaY > 0 && scroller.scrollLeft >= max - 1) || (event.deltaY < 0 && scroller.scrollLeft <= 0)) return;
			scroller.scrollLeft = Math.max(0, Math.min(max, next));
			event.preventDefault();
		}, { passive: false });
	}

	function beginScrollMotion() {
		if (started) return;
		started = true;
		root.classList.remove("is-loading");
		if (loader && loader.parentNode) loader.remove();

		var bar = document.createElement("div");
		bar.id = "scroll-progress";
		bar.setAttribute("aria-hidden", "true");
		document.body.appendChild(bar);
		gsap.set(bar, { scaleX: 0, transformOrigin: "0 50%" });
		gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

		document.querySelectorAll("main h2").forEach(maskHeading);
		reveal(".role", { x: -36, y: 70 });
		reveal(".edu li", { y: 40, scale: 0.98 });
		reveal(".stat", { y: 50, scale: 0.94 });

		var chipList = document.querySelector("#skills .skills");
		if (chipList) {
			gsap.from(chipList.children, {
				y: 24,
				scale: 0.7,
				opacity: 0,
				duration: 0.45,
				stagger: 0.03,
				ease: "back.out(1.7)",
				immediateRender: false,
				scrollTrigger: { trigger: chipList, start: "top 85%", once: true },
				clearProps: "opacity,transform"
			});
		}

		var timeline = document.querySelector(".timeline");
		if (timeline && !timeline.querySelector(".timeline-line")) {
			var line = document.createElement("span");
			line.className = "timeline-line";
			line.setAttribute("aria-hidden", "true");
			timeline.prepend(line);
			gsap.fromTo(line, { scaleY: 0 }, {
				scaleY: 1,
				ease: "none",
				scrollTrigger: { trigger: timeline, start: "top 75%", end: "bottom 55%", scrub: 0.35 }
			});
		}

		document.querySelectorAll("[data-count]").forEach(function (el) {
			var target = Number(el.getAttribute("data-count"));
			var prefix = el.getAttribute("data-prefix") || "";
			var suffix = el.getAttribute("data-suffix") || "";
			var finalText = el.textContent;
			var obj = { n: 0 };
			el.textContent = prefix + "0" + suffix;
			gsap.to(obj, {
				n: target,
				duration: 1.3,
				ease: "power2.out",
				scrollTrigger: { trigger: el, start: "top 88%", once: true },
				onUpdate: function () {
					el.textContent = prefix + Math.round(obj.n).toLocaleString("en-US") + suffix;
				},
				onComplete: function () { el.textContent = finalText; }
			});
		});

		var scroller = document.querySelector(".project-hscroll");
		if (scroller) wireProjectWheel(scroller);

		var mm = gsap.matchMedia();
		mm.add("(min-width: 900px)", function () {
			document.querySelectorAll(".orb").forEach(function (orb, i) {
				gsap.to(orb, {
					yPercent: 18 + i * 10,
					ease: "none",
					scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
				});
			});
			if (document.querySelector(".portrait-wrap")) {
				gsap.to(".portrait-wrap", {
					yPercent: -10,
					ease: "none",
					scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
				});
			}

			var pin = document.querySelector(".project-pin");
			if (scroller && pin) {
				root.classList.add("hscroll-ready");
				window.ScrollTrigger.create({
					trigger: pin,
					start: "top 72px",
					end: function () {
						return "+=" + Math.max(scroller.scrollWidth - scroller.clientWidth, 1);
					},
					pin: true,
					scrub: 0.45,
					anticipatePin: 1,
					invalidateOnRefresh: true,
					onUpdate: function (self) {
						var max = scroller.scrollWidth - scroller.clientWidth;
						if (max > 0) scroller.scrollLeft = max * self.progress;
					}
				});
			}

			var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
			if (!safari && fine && window.Lenis) {
				var lenis = new window.Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true, syncTouch: false });
				lenis.on("scroll", window.ScrollTrigger.update);
				gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
				gsap.ticker.lagSmoothing(0);
				root.style.scrollBehavior = "auto";
				document.querySelectorAll('a[href^="#"]').forEach(function (link) {
					link.addEventListener("click", function (event) {
						var id = link.getAttribute("href");
						if (!id || id.length < 2) return;
						var target = document.querySelector(id);
						if (!target) return;
						event.preventDefault();
						lenis.scrollTo(target, { offset: -72 });
					}, true);
				});
			}
			if (fine) {
				var dot = document.createElement("div");
				dot.id = "cursor-dot";
				dot.setAttribute("aria-hidden", "true");
				document.body.appendChild(dot);
				gsap.set(dot, { xPercent: -50, yPercent: -50 });
				window.addEventListener("pointermove", function (event) {
					gsap.to(dot, { x: event.clientX, y: event.clientY, duration: 0.25, ease: "power3.out", overwrite: true });
				}, { passive: true });
			}
			return function () { root.classList.remove("hscroll-ready"); };
		});

		var refresh = function () { window.ScrollTrigger.refresh(); };
		refresh();
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
		window.addEventListener("load", refresh);
	}

	window.setTimeout(function () {
		if (!started) beginScrollMotion();
	}, 4000);
})();
