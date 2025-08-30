import React, {useEffect} from "react";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AnchorShortcuts = () => {
    // Map of single-letter shortcuts to anchor IDs
    const {siteConfig} = useDocusaurusContext();
    const organizationName = siteConfig.organizationName;
    const repoName = siteConfig.projectName;
    const ym_counter = siteConfig.customFields.ymCounter;

    const keyToActionMap = {
        // Anchor shortcuts
        d: { type: "anchor", target: "дополнительные-главы-высшей-математики", },
        t: { type: "anchor", target: "теория-вероятности" },
        f: { type: "anchor", target: "физика" },
        b: { type: "anchor", target: "базы-данных" },
        o: { type: "anchor", target: "объектно-ориентированное-программирование" },

        l: { type: "anchor", target: "дополнительные-главы-высшей-математики", },
        n: { type: "anchor", target: "теория-вероятности" },
        a: { type: "anchor", target: "физика" },
        ",": { type: "anchor", target: "базы-данных" },
        j: { type: "anchor", target: "объектно-ориентированное-программирование" },

        // URL shortcuts
        q: { type: "url", target: "javascript:history.back()" },
        h: { type: "url", target: "/" },
        v: { type: "url", target: "/table-grades" },
        p: { type: "url", target: "/point-distribution" },

        y: { type: "url", target: "javascript:history.back()" }, // н - назад
        u: { type: "url", target: "/" },   // г - главная
        g: { type: "url", target: "/point-distribution" }, // п - правила оценивания

        // service shortcuts
        1: { type: "ext-url", target: `https://github.com/${organizationName}/${repoName}/edit/master/src/pages/index.mdx` },
        2: { type: "ext-url", target: `https://github.com/${organizationName}/${repoName}/edit/master/static/DEADLINES.json` },
        3: { type: "ext-url", target: `https://github.com/${organizationName}/${repoName}/edit/master/src/pages/lecture-recordings.mdx` }, // page doesn't exist yet
    };

    const russianKeyboardMap = {
        q: "й",
        w: "ц",
        e: "у",
        r: "к",
        t: "е",
        y: "н",
        u: "г",
        i: "ш",
        o: "щ",
        p: "з",
        a: "ф",
        s: "ы",
        d: "в",
        f: "а",
        g: "п",
        h: "р",
        j: "о",
        k: "л",
        l: "д",
        z: "я",
        x: "ч",
        c: "с",
        v: "м",
        b: "и",
        n: "т",
        m: "ь",
        ',': "б",
    };

    // Automatically extend the keyToActionMap with Russian equivalents
    for (const [engKey, action] of Object.entries(keyToActionMap)) {
        const rusKey = russianKeyboardMap[engKey];
        if (rusKey && !keyToActionMap[rusKey]) {
            keyToActionMap[rusKey] = action;
        }
    }

    const smoothScrollTo = (targetElement, duration = 300, offset = 60) => {
        const start = window.scrollY;
        const end = targetElement.getBoundingClientRect().top + start - offset;
        const distance = end - start;
        const startTime = performance.now();

        const scroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1); // Ensure progress is capped at 1
            const easing = progress < 0.5
                ? 4 * progress ** 3 // Cubic easing-in-out for smooth acceleration/deceleration
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, start + distance * easing);

            if (elapsed < duration) {
                requestAnimationFrame(scroll);
            }
        };

        requestAnimationFrame(scroll);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
                return;
            }

            const pressedKey = event.key.toLowerCase();
            const action = keyToActionMap[pressedKey];

            if (action) {
                event.preventDefault();

                if (action.type === "anchor") {
                    if (location.pathname !== "/table-grades") {
                        const anchorElement = document.getElementById(action.target);
                        if (anchorElement) {
                            anchorElement.scrollIntoView({behavior: "instant", block: "start"});
                        }
                    }
                } else if (action.type === "url") {
                    if (action.target.startsWith("javascript:")) {
                        // Execute JS directly for history.back()
                        window.location = action.target;
                    } else {
                        window.location.href = action.target;
                    }
                } else if (action.type === "ext-url") {
                    window.open(action.target, "_blank");
                }

                ym(ym_counter, 'reachGoal', 'hotkey');
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
};

export default AnchorShortcuts;
