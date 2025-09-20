import React from "react";

type ChoiceMap = Record<string, string | undefined>; // subjectId -> lecturer

const Ctx = React.createContext<{
  choices: ChoiceMap;
  setChoice: (subjectId: string, value: string) => void;
}>({ choices: {}, setChoice: () => {} });

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 год

// --- cookie utils ---
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : undefined;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export default function LecturersProvider({
  initial,
  cookieKeys,
  children,
}: {
  /** initial defaults: subjectId -> lecturer */
  initial: ChoiceMap;
  /** mapping предмета к имени cookie, например: { history: 'tab_history-lecturers' } */
  cookieKeys: Record<string, string>;
  children: React.ReactNode;
}) {
  const [choices, setChoices] = React.useState<ChoiceMap>(initial);

  // load once from cookies (если есть) поверх дефолтов
  React.useEffect(() => {
    const fromCookies: ChoiceMap = {};
    Object.entries(cookieKeys).forEach(([subjectId, cookieName]) => {
      const v = readCookie(cookieName);
      if (v) fromCookies[subjectId] = v;
    });
    setChoices((cur) => ({ ...cur, ...fromCookies }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // один раз

  // persist each subject to its cookie
  React.useEffect(() => {
    Object.entries(cookieKeys).forEach(([subjectId, cookieName]) => {
      const v = choices[subjectId];
      if (v) writeCookie(cookieName, v);
    });
  }, [choices, cookieKeys]);

  const setChoice = (subjectId: string, value: string) =>
    setChoices((c) => ({ ...c, [subjectId]: value }));

  return <Ctx.Provider value={{ choices, setChoice }}>{children}</Ctx.Provider>;
}

export function useLecturer(subjectId: string, fallback?: string) {
  const { choices } = React.useContext(Ctx);
  return choices[subjectId] ?? fallback;
}
export function useSetLecturer() {
  return React.useContext(Ctx).setChoice;
}
