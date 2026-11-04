/*
	Cinematic motion for the static portfolio.
	GSAP, ScrollTrigger, and Lenis come from a CDN.
	Reduced motion, or a missing library, leaves every fact readable.
*/
(function () {
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	var wide = window.matchMedia("(min-width: 981px)").matches;
	var loader = document.getElementById("loader");
	var root = document.documentElement;

	function unlock() {
		root.classList.remove("is-loading");
		document.querySelectorAll("[data-held]").forEach(function (el) { el.inert = false; });
	}
	function dropLoader() {
		unlock();
		if (loader && loader.parentNode) loader.remove();
	}

	if (reduce || !window.gsap || !window.ScrollTrigger) {
		var slot = document.querySelector("[data-rotate]");
		if (slot) slot.textContent = "BI Engineer";
		dropLoader();
		return;
	}

	var gsap = window.gsap;
	gsap.registerPlugin(window.ScrollTrigger);
	root.classList.add("is-loading");
	document.querySelectorAll("body > *:not(#loader)").forEach(function (el) {
		el.setAttribute("data-held", "");
		el.inert = true;
	});
	window.setTimeout(dropLoader, 6000);

	function splitChars(el) {
		var text = el.textContent;
		el.setAttribute("aria-label", text.trim());
		el.textContent = "";
		text.split(" ").forEach(function (word, wi, words) {
			var mask = document.createElement("span");
			mask.className = "word-mask";
			mask.style.display = "inline-block";
			mask.style.overflow = "hidden";
			mask.style.verticalAlign = "bottom";
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
			yPercent: 130,
			duration: 1,
			ease: "power4.out",
			scrollTrigger: { trigger: el, start: "top 86%", once: true }
		});
	}

	document.querySelectorAll("[data-split='chars']").forEach(splitChars);
	document.querySelectorAll("main h2").forEach(maskHeading);

	var pctEl = document.getElementById("loader-pct");
	var barEl = document.getElementById("loader-bar");
	var count = { n: 0 };
	var countTime = wide ? 1.35 : 0.9;
	var intro = gsap.timeline({
		onComplete: function () {
			dropLoader();
			window.ScrollTrigger.refresh();
		}
	});
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
	intro.to(loader, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, countTime);

	var chars = document.querySelectorAll(".name .char");
	if (chars.length) {
		gsap.set(chars, { yPercent: 130 });
		intro.to(chars, {
			yPercent: 0,
			duration: 0.9,
			stagger: 0.035,
			ease: "power4.out"
		}, countTime + 0.08);
	}
	intro.from(".kicker, .lede, .cta-row .btn, .scroll-cue", {
		y: 36,
		autoAlpha: 0,
		duration: 0.7,
		stagger: 0.08,
		ease: "power3.out",
		immediateRender: true
	}, countTime + 0.35);
	intro.from(".portrait-wrap", {
		scale: 0.82,
		autoAlpha: 0,
		duration: 1.1,
		ease: "power3.out",
		immediateRender: true
	}, countTime + 0.05);

	var roleEl = document.querySelector("[data-rotate]");
	if (roleEl) {
		var roles = (roleEl.getAttribute("data-rotate") || "").split("|").map(function (s) { return s.trim(); }).filter(Boolean);
		var mask = roleEl.parentElement;
		if (mask) mask.style.overflow = "hidden";
		var ri = 0;
		function cycle() {
			var text = roles[ri % roles.length];
			ri += 1;
			roleEl.textContent = "";
			var proxy = { n: 0 };
			gsap.to(proxy, {
				n: text.length,
				duration: Math.max(0.45, text.length * 0.045),
				ease: "none",
				onUpdate: function () {
					roleEl.textContent = text.slice(0, Math.round(proxy.n));
				},
				onComplete: function () {
					gsap.delayedCall(1.5, function () {
						gsap.to(roleEl, {
							yPercent: -40,
							autoAlpha: 0,
							duration: 0.28,
							onComplete: function () {
								gsap.set(roleEl, { yPercent: 30, autoAlpha: 0 });
								gsap.to(roleEl, { yPercent: 0, autoAlpha: 1, duration: 0.28, onComplete: cycle });
							}
						});
					});
				}
			});
		}
		intro.call(cycle, null, countTime + 0.5);
	}

	var bar = document.createElement("div");
	bar.id = "scroll-progress";
	bar.setAttribute("aria-hidden", "true");
	document.body.appendChild(bar);
	gsap.set(bar, { scaleX: 0, transformOrigin: "0 50%" });
	gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

	document.querySelectorAll("[data-count]").forEach(function (el) {
		var target = Number(el.getAttribute("data-count"));
		var prefix = el.getAttribute("data-prefix") || "";
		var suffix = el.getAttribute("data-suffix") || "";
		var obj = { n: 0 };
		gsap.to(obj, {
			n: target,
			duration: 1.4,
			ease: "power2.out",
			scrollTrigger: { trigger: el, start: "top 85%", once: true },
			onUpdate: function () {
				el.textContent = prefix + Math.round(obj.n).toLocaleString("en-US") + suffix;
			}
		});
	});

	function reveal(selector, vars) {
		gsap.utils.toArray(selector).forEach(function (el) {
			gsap.from(el, Object.assign({
				y: 90,
				opacity: 0,
				scale: 0.9,
				duration: 0.9,
				ease: "power3.out",
				scrollTrigger: { trigger: el, start: "top 88%", once: true },
				clearProps: "opacity,transform"
			}, vars || {}));
			el.addEventListener("focusin", function () {
				gsap.killTweensOf(el);
				gsap.set(el, { clearProps: "opacity,transform" });
			});
		});
	}
	reveal(".role", { x: -40, y: 80 });
	reveal(".edu li", { y: 50, scale: 0.96 });
	reveal(".stat", { y: 60, scale: 0.92 });

	if (document.querySelector(".skills")) {
		gsap.from(".skills li", {
			y: 28,
			scale: 0.6,
			opacity: 0,
			duration: 0.5,
			stagger: 0.035,
			ease: "back.out(1.8)",
			scrollTrigger: { trigger: ".skills", start: "top 82%", once: true },
			clearProps: "opacity,transform"
		});
	}

	var timeline = document.querySelector(".timeline");
	if (timeline) {
		var line = document.createElement("span");
		line.className = "timeline-line";
		line.setAttribute("aria-hidden", "true");
		timeline.prepend(line);
		gsap.fromTo(line, { scaleY: 0 }, {
			scaleY: 1,
			ease: "none",
			scrollTrigger: { trigger: timeline, start: "top 70%", end: "bottom 60%", scrub: 0.4 }
		});
	}

	if (wide) {
		document.querySelectorAll(".orb").forEach(function (orb, i) {
			gsap.to(orb, {
				yPercent: 20 + i * 12,
				ease: "none",
				scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
			});
		});
		var photo = document.querySelector(".portrait-wrap");
		if (photo) {
			gsap.to(photo, {
				yPercent: -12,
				ease: "none",
				scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
			});
		}
		var scroller = document.querySelector(".project-hscroll");
		var pin = document.querySelector(".project-pin");
		if (scroller && pin) {
			root.classList.add("hscroll-ready");
			window.ScrollTrigger.create({
				trigger: pin,
				start: "top 70px",
				end: function () {
					return "+=" + Math.max(scroller.scrollWidth - scroller.clientWidth, 1);
				},
				pin: true,
				scrub: 0.55,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				onUpdate: function (self) {
					var max = scroller.scrollWidth - scroller.clientWidth;
					if (max > 0) scroller.scrollLeft = max * self.progress;
				}
			});
		}
		if (fine && window.Lenis) {
			var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
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
					lenis.scrollTo(target, { offset: -70 });
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
				gsap.to(dot, { x: event.clientX, y: event.clientY, duration: 0.28, ease: "power3.out", overwrite: true });
			}, { passive: true });
		}
	}

	window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
})();
