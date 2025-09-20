import React, {useEffect, useState} from 'react';
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import PropTypes from 'prop-types';


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

function stripLecturerFromName(name, filters) {
  if (!filters || filters.length === 0) return name;

  let cleaned = name;
  filters.forEach(f => {
    Object.values(f.aliases || {}).forEach(aliasList => {
      aliasList.forEach(alias => {
        // ищем "(Пригодич)" или "(пригодич)" без учёта регистра
        //const regex = new RegExp(`\\(\\s*${alias}\\s*\\)`, 'i');
        //cleaned = cleaned.replace(regex, '').trim();
      });
    });
  });
  //cleaned = cleaned.replace(/\s+([:;,.!?])/g, '$1');
  return cleaned.trim();
}

const formatDeadline = (deadline, lecturerFilters) => {
    const {siteConfig} = useDocusaurusContext();

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
    deadlineName = deadlineName.replace("[Экзамен]", "🤓").replace("[экзамен]", "🤓");
    deadlineName = deadlineName.replace("[Консультация]", "👞").replace("[консультация]", "👞");
    deadlineName = stripLecturerFromName(deadlineName, lecturerFilters);


    const formattedTime = formatUnixTimeIntoGCalTime(unixTimeDeadline);
    const description = "Дедлайн добавлен с сайта m3208.nawinds.dev";
    const link = deadline.url;
    const gcalLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(deadlineName)}&dates=${formattedTime}/${formattedTime}&details=${encodeURIComponent(description)}&color=6`;

    let text = "";
    if (link) {
        text += `<b style="padding-left: 5px; border-left: 2px solid rgba(157,128,218,0.5);"><a href=\"${link}\" target=\"_blank\" title="Открыть ${deadlineName}" style=\"text-decoration: none; color: inherit;\" onmouseover=\"this.style.opacity='0.8'\" onmouseout=\"this.style.opacity='1'\">${deadlineName}</a></b>`;
    } else {
        text += `<b>${deadlineName}</b>`;
    }

    text += ` &#8212; <a href="${gcalLink}" target="_blank" title="Добавить в Google Календарь" style="text-decoration: none; color: inherit;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">`;

    if (deltaDays < 1) {
        text += `${Math.floor(deltaHoursSDays)}ч ${Math.floor(deltaMinutesSDays)}м`;
    } else if (deltaDays < 3) {
        text += `${Math.floor(deltaDays)} ${Math.floor(deltaDays) === 1 ? "день" : "дня"} ${Math.floor(deltaHoursSDays)}ч ${Math.floor(deltaMinutesSDays)}м`;
    } else {
        text += `${Math.floor(deltaDays)} ${Math.floor(deltaDays) === 3 || Math.floor(deltaDays) === 4 ? "дня" : "дней"}`;
    }
    const options = {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short'};
    text += ` (${new Date(unixTimeDeadline).toLocaleDateString('ru-RU', options)}) </a>`;
    return text;
};

function readCookie(name) {
    if (typeof document === 'undefined') return undefined;
    const m = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return m ? decodeURIComponent(m[1]) : undefined;
}

function cookieSignature(filters) {
    if (!filters || filters.length === 0) return '';
    return filters
        .map(f => `${f.cookie}=${readCookie(f.cookie) || ''}`)
        .join('|');
}


function isDeadlineRelevantByLecturer(deadlineName, filters) {
    if (!filters || filters.length === 0) return true; // без фильтра — показываем всё
    const name = String(deadlineName || '').toLowerCase();

    for (const f of filters) {
        const isSubject = (f.keywords || []).some(k => name.includes(String(k).toLowerCase()));
        if (!isSubject) continue;

        const selected = readCookie(f.cookie); // напр. 'prigodich'
        if (!selected) return true; // выбора нет — не фильтруем

        const aliasesByLect = f.aliases || {};
        let mentioned = null;
        for (const [lect, aliasList] of Object.entries(aliasesByLect)) {
            if ((aliasList || []).some(a => name.includes(String(a).toLowerCase()))) {
                mentioned = lect;
                break;
            }
        }
        if (mentioned && mentioned !== selected) return false; // фамилия указана и не совпала
    }
    return true; // предмет не распознали или фамилии нет
}


const Deadlines = ({lecturerFilters}) => {
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDeadlines = async () => {
            try {
                const data = await fetchDeadlines();
                const sortedDeadlines = data.deadlines.sort(compareDeadlines);
                const filtered = sortedDeadlines.filter(d =>
                    isDeadlineRelevantByLecturer(d.name, lecturerFilters)
                );
                setDeadlines(filtered);
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

            let lastSig = cookieSignature(lecturerFilters);
            const checkCookies = () => {
                const sig = cookieSignature(lecturerFilters);
                if (sig !== lastSig) {
                    lastSig = sig;
                    loadDeadlines(); // куки поменялись — перезагрузить список
                }
            };

            const cookieTimer = setInterval(checkCookies, 1500);
            window.addEventListener('focus', checkCookies);
            document.addEventListener('visibilitychange', checkCookies);

        };

        loadDeadlines();
        updateInterval();
    }, [lecturerFilters]);

    if (loading) {
        return <p>Загрузка дедлайнов...</p>;
    }
    if (error) {
        console.error(error);
        return <p>Не удалось загрузить дедлайны.</p>;
    }
    return (
        <div id="deadlinesBlock" style={{marginBottom: '20px'}}>
            <h2>Дедлайны</h2>
            {deadlines.length === 0 ? (
                <p>Нет предстоящих дедлайнов.</p>
            ) : (
                <p dangerouslySetInnerHTML={{__html: deadlines.map(d => formatDeadline(d, lecturerFilters)).filter(Boolean).join('<br>')}}
                   style={{lineHeight: "1.8em"}}/>
            )}
            <a href="/deadlines-editing-instructions">Добавить дедлайн</a>
        </div>
    );
};

Deadlines.propTypes = {
    lecturerFilters: PropTypes.arrayOf(
        PropTypes.shape({
            cookie: PropTypes.string.isRequired,
            keywords: PropTypes.arrayOf(PropTypes.string).isRequired,
            aliases: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
        })
    ),
};

export default Deadlines;
