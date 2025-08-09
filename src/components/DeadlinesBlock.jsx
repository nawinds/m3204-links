import React, { useEffect, useState } from 'react';
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import {useLocation} from "@docusaurus/router";

const DEADLINES_URL = "/DEADLINES.json";

const fetchDeadlines = async () => {
    const response = await fetch(DEADLINES_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch deadlines");
    }
    return response.json();
};

const compareDeadlines = (a, b) => {
    return Date.parse(a.time) - Date.parse(b.time);
};

const formatUnixTimeIntoGCalTime = (unixTimeDeadline) => {
    const date = new Date(unixTimeDeadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timeZoneOffset = -date.getTimezoneOffset();
    const sign = timeZoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.floor(Math.abs(timeZoneOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(timeZoneOffset) % 60).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}${sign}${offsetHours}${offsetMinutes}`;
};

const formatDeadline = (deadline) => {
    const {siteConfig} = useDocusaurusContext();
    const ym_counter = siteConfig.customFields.ymCounter;

    // A/B experiment
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const deadlineStyle = searchParams.get('deadlineStyle');

    const unixTimeDeadline = Date.parse(deadline.time);
    const unixTimeNow = Date.now();
    if (unixTimeDeadline <= unixTimeNow) return null;

    const delta = unixTimeDeadline - unixTimeNow;
    const deltaMinutes = delta / 60000;
    const deltaHours = deltaMinutes / 60;
    const deltaDays = deltaHours / 24;

    const deltaHoursSDays = deltaHours - 24 * Math.floor(deltaDays);
    const deltaMinutesSDays = deltaMinutes - 60 * Math.floor(deltaHours);

    let deadlineName = deadline.name.replace("[Тест]", "📚").replace("[тест]", "📚");
    deadlineName = deadlineName.replace("[Лекция]", "👨‍🏫").replace("[лекция]", "👨‍🏫");
    deadlineName = deadlineName.replace("[Защита]", "🛡").replace("[защита]", "🛡");
    const formattedTime = formatUnixTimeIntoGCalTime(unixTimeDeadline);
    const description = "Дедлайн добавлен с сайта m3204.nawinds.dev";
    const link = deadline.url;
    const gcalLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(deadlineName)}&dates=${formattedTime}/${formattedTime}&details=${encodeURIComponent(description)}&color=6`;

    let text = "";
    if (link) {
        // A/B experiment
        if (deadlineStyle === "new") {
            text += `<b style="position: relative; display: inline-block;"><a href="${link}" target="_blank" title="Открыть ${deadlineName}" style="text-decoration: none; color: inherit; position: relative; z-index: 1;" onmouseover="this.parentNode.querySelector('span').style.height='2px'" onmouseout="this.parentNode.querySelector('span').style.height='1px'" onclick="ym(${ym_counter}, 'reachGoal', 'deadline_click'); return true;">${deadlineName}</a>
                 <span style="position: absolute; bottom: 2px; left: 0; right: 0; height: 1px; background: rgba(157,128,218,0.6); z-index: 0; transition: height 0.1s ease;"></span></b>`;

        } else {
            text += `<b style="padding-left: 5px; border-left: 2px solid rgba(157,128,218,0.5);"><a href=\"${link}\" target=\"_blank\" title="Открыть ${deadlineName}" style=\"text-decoration: none; color: inherit;\" onmouseover=\"this.style.opacity='0.8'\" onmouseout=\"this.style.opacity='1'\" onclick="ym(${ym_counter}, 'reachGoal', 'deadline_click'); return true;">${deadlineName}</a></b>`;
        }
    } else {
        text += `<b style="padding-left: 7px;">${deadlineName}</b>`;
    }

    text += ` &#8212; <a href="${gcalLink}" target="_blank" title="Добавить в Google Календарь" style="text-decoration: none; color: inherit;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="ym(${ym_counter}, 'reachGoal', 'deadline_time_click'); return true;">`;

    if (deltaDays < 1) {
        text += `${Math.floor(deltaHoursSDays)}ч ${Math.floor(deltaMinutesSDays)}м`;
    } else if (deltaDays < 3) {
        text += `${Math.floor(deltaDays)} ${Math.floor(deltaDays) === 1 ? "день" : "дня"} ${Math.floor(deltaHoursSDays)}ч ${Math.floor(deltaMinutesSDays)}м`;
    } else {
        text += `${Math.floor(deltaDays)} ${Math.floor(deltaDays) === 3 || Math.floor(deltaDays) === 4 ? "дня" : "дней"}`;
    }
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' };
    text += ` (${new Date(unixTimeDeadline).toLocaleDateString('ru-RU', options)}) </a>`;
    return text;
};

const Deadlines = () => {
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDeadlines = async () => {
            try {
                const data = await fetchDeadlines();
                const sortedDeadlines = data.deadlines.sort(compareDeadlines);
                setDeadlines(sortedDeadlines);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const updateInterval = () => {
            const now = new Date();
            const nextMinute = new Date(now);
            nextMinute.setSeconds(0, 0);
            nextMinute.setMinutes(now.getMinutes() + 1);
            const delay = nextMinute - now;
            setTimeout(() => {
                loadDeadlines();
                setInterval(loadDeadlines, 60000); // Every 60 seconds
            }, delay);
        };

        loadDeadlines();
        updateInterval();
    }, []);

    if (loading) {
        return <p>Загрузка дедлайнов...</p>;
    }
    if (error) {
        console.error(error);
        return <p>Не удалось загрузить дедлайны.</p>;
    }
    return (
        <div id="deadlinesBlock" style={{ marginBottom: '20px' }}>
            <h2>Дедлайны</h2>
            {deadlines.length === 0 ? (
                <p>Нет предстоящих дедлайнов.</p>
            ) : (
                <p dangerouslySetInnerHTML={{ __html: deadlines.map(formatDeadline).filter(Boolean).join('<br>') }} style={{ lineHeight: "1.8em" }} />
            )}
            <a href="/deadlines-editing-instructions">Добавить дедлайн</a>
        </div>
    );
};

export default Deadlines;
