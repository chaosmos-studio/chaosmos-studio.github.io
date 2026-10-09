// The gate on the web build, the same file in every Chaosmos game. The web build is there for iPhone and iPad,
// which have no app yet, so only they get the game. On any other device the loading screen points to the
// game on Google Play, or to its page until the listing is public, and the engine never downloads. Where each
// game stands comes from the studio site's games.json, so a launch there opens every gate at once. `?play`
// lets the game through anywhere, for testing. The shell starts the engine when window.chaosmosGate settles.
window.chaosmosGate = (function () {
	const name = document.currentScript.dataset.game;
	const ua = navigator.userAgent;
	const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
	if (ios || new URLSearchParams(location.search).has('play')) {
		return Promise.resolve();
	}

	const WORDS = {
		live: [`${name} is on Google Play.`, 'Get it on Google Play'],
		preregister: [`${name} is coming to Google Play. Pre-register, and it installs itself on launch day.`, 'Pre-register on Google Play'],
		soon: [`${name} is coming soon to Google Play.`, `More about ${name}`],
	};

	function hold(game) {
		const status = document.getElementById('status');
		const progress = document.getElementById('status-progress');
		if (status) {
			const style = document.createElement('style');
			style.textContent = `
#gate { display: flex; flex-direction: column; align-items: center; gap: 14px; width: min(340px, 86vw); text-align: center; }
#gate p { margin: 0; color: var(--muted); font-size: 18px; line-height: 1.45; }
#gate a { display: block; width: 100%; padding: 16px 20px; border-radius: 99px; background: var(--accent, var(--coral));
	color: #141414; font-size: 20px; text-decoration: none; }
#gate a.more { padding: 10px; background: none; color: var(--ink); font-size: 17px; text-decoration: underline;
	text-underline-offset: 4px; opacity: 0.8; }`;
			document.head.appendChild(style);
			const [line, label] = WORDS[game.play] || WORDS.soon;
			const gate = document.createElement('div');
			gate.id = 'gate';
			const why = document.createElement('p');
			why.textContent = line;
			const go = document.createElement('a');
			go.href = game.store || game.page;
			go.textContent = label;
			gate.append(why, go);
			if (game.store) {
				const more = document.createElement('a');
				more.className = 'more';
				more.href = game.page;
				more.textContent = `More about ${name}`;
				gate.append(more);
			}
			if (progress) {
				progress.style.display = 'none';
			}
			status.appendChild(gate);
		}
		return new Promise(() => {});
	}

	const fallback = { play: 'soon', store: null, page: `/${name.toLowerCase()}/` };
	return fetch('/games.json', { cache: 'no-cache' })
		.then((response) => (response.ok ? response.json() : []))
		.then((games) => hold(games.find((g) => g.name === name) || fallback))
		.catch(() => hold(fallback));
}());
