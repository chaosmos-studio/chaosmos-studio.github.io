// The Google Play gate for the browser version, the same file in every Chaosmos game. On an Android phone,
// once the game is live on Google Play, the loading screen offers the app first, with the browser a tap
// away. Everyone else, and anyone who picks the browser, gets the game as before. Whether a game is live
// comes from the studio site's games.json, so adding its Play link there opens every gate at once. The shell
// starts the engine when window.chaosmosGate settles, so a visitor who installs never downloads it.
window.chaosmosGate = (function () {
	const name = document.currentScript.dataset.game;
	const key = 'chaosmos-browser';

	function offer(store) {
		const status = document.getElementById('status');
		const progress = document.getElementById('status-progress');
		if (!status) {
			return undefined;
		}
		const style = document.createElement('style');
		style.textContent = `
#gate { display: flex; flex-direction: column; align-items: center; gap: 14px; width: min(340px, 86vw); text-align: center; }
#gate p { margin: 0; color: var(--muted); font-size: 18px; line-height: 1.45; }
#gate a { display: block; width: 100%; padding: 16px 20px; border-radius: 99px; background: var(--accent, var(--coral));
	color: #141414; font-size: 20px; text-decoration: none; }
#gate button { border: 0; padding: 10px; background: none; color: var(--ink); font: inherit; font-size: 17px;
	text-decoration: underline; text-underline-offset: 4px; opacity: 0.8; }`;
		document.head.appendChild(style);
		const gate = document.createElement('div');
		gate.id = 'gate';
		const why = document.createElement('p');
		why.textContent = `${name} is on Google Play. The app starts faster and plays offline.`;
		const install = document.createElement('a');
		install.href = store;
		install.textContent = 'Get it on Google Play';
		const browser = document.createElement('button');
		browser.type = 'button';
		browser.textContent = 'Play in the browser instead';
		gate.append(why, install, browser);
		progress.style.display = 'none';
		status.appendChild(gate);
		return new Promise((resolve) => {
			browser.addEventListener('click', () => {
				try {
					sessionStorage.setItem(key, name);
				} catch (e) {}
				gate.remove();
				resolve();
			});
		});
	}

	if (!/Android/i.test(navigator.userAgent)) {
		return Promise.resolve();
	}
	try {
		if (sessionStorage.getItem(key) === name) {
			return Promise.resolve();
		}
	} catch (e) {}
	return fetch('/games.json', { cache: 'no-cache' })
		.then((response) => (response.ok ? response.json() : []))
		.then((games) => {
			const game = games.find((g) => g.name === name);
			return game && game.googlePlay ? offer(game.googlePlay) : undefined;
		})
		.catch(() => undefined);
}());
