import React from "react";
import {useLecturer, useSetLecturer} from "@site/src/components/lecturers/LecturersProvider";
import styles from "@site/src/components/lecturers/LecturerMatrixButton.module.css";

export default function LecturerMatrixButton({subjects}: { subjects: Subject[] }) {
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);

    // закрытие по клику вне
    React.useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!open) return;
            const el = e.target as HTMLElement;
            if (!btnRef.current) return;
            const pop = document.getElementById("lecturer-matrix-popover");
            if (pop && (pop.contains(el) || btnRef.current.contains(el))) return;
            setOpen(false);
        }

        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    return (
        <div style={{margin: '0 0 16px 0'}}>
            <div className={styles.wrap}>
                <button
                    ref={btnRef}
                    className={styles.button}
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    aria-controls="lecturer-matrix-popover"
                >
                    Потоки • {subjects.length}
                    <span className={styles.chev} aria-hidden>▾</span>
                </button>

                {open && (
                    <Popover subjects={subjects} onClose={() => setOpen(false)}/>
                )}
            </div>
        </div>
    );
}

export type Subject = {
    id: string;            // "history"
    title: string;         // "История"
    options: { value: string; label: string }[];
    onAdd?: (subjectId: string) => void; // (опционально) обработчик клика
};

function Popover({subjects, onClose}: { subjects: Subject[]; onClose: () => void }) {
    const setLecturer = useSetLecturer();
    const popRef = React.useRef<HTMLDivElement | null>(null);
    const btn = document.querySelector<HTMLButtonElement>('[aria-controls="lecturer-matrix-popover"]');

    // состояние позиции
    const [style, setStyle] = React.useState<React.CSSProperties>({left: 0, top: 0, minWidth: 320});

    // расчёт позиции под/над кнопкой с учётом краёв экрана
    const place = React.useCallback(() => {
        if (!btn) return;
        const br = btn.getBoundingClientRect();
        const margin = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // измерим поповер (если уже отрендерен)
        const popEl = popRef.current;
        const pad = 12; // внутренние отступы поповера в CSS (для запаса)
        const desiredMin = 320;                // комфортный минимум
        const desiredMax = Math.min(600, vw * 0.92); // ограничение, чтобы не «во всю»
        const minWidth = Math.min(Math.max(desiredMin, vw * 0.6), desiredMax);

        let width = popEl ? Math.min(Math.max(popEl.offsetWidth, minWidth), desiredMax) : minWidth;

        // базовое выравнивание по левому краю кнопки
        let left = br.left;
        // если вылезаем вправо — прижимаем
        if (left + width > vw - margin) left = Math.max(margin, vw - margin - width);
        // если вылезаем влево — прижимаем к краю
        if (left < margin) left = margin;

        // пытаемся поставить СНИЗУ
        let top = br.bottom + margin;
        let height = popEl?.offsetHeight ?? 0;
        if (height === 0 && popEl) {
            // грубая оценка высоты до первого измерения
            height = 300;
        }

        // если снизу не влезаем — флип ВВЕРХ
        if (top + height + pad > vh && br.top - margin - height > margin) {
            top = Math.max(margin, br.top - margin - height);
        }

        setStyle({
            left,
            top,
            minWidth,
            maxWidth: desiredMax, // важно: не на всю ширину даже на планшете
        });
    }, [btn]);

    // первичное позиционирование и пересчёт при скролле/resize/ориеентации
    React.useLayoutEffect(() => {
        place();
        const ro = new ResizeObserver(place);
        popRef.current && ro.observe(popRef.current);
        const on = () => place();
        window.addEventListener("scroll", on, true);
        window.addEventListener("resize", on);
        window.addEventListener("orientationchange", on);
        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", on, true);
            window.removeEventListener("resize", on);
            window.removeEventListener("orientationchange", on);
        };
    }, [place]);

    return (
        <div
            id="lecturer-matrix-popover"
            ref={popRef}
            className={styles.popover}
            style={style}
            role="dialog"
            aria-label="Выбор потока"
        >
            <div
                className={styles.columns}
                style={{['--cols' as any]: subjects.length}}
            >
                {subjects.map((s) => {
                    const current = useLecturer(s.id, s.options[0]?.value);
                    return (
                        <div key={s.id} className={styles.col}>
                            <div className={styles.colTitle}>{s.title}</div>

                            <div className={styles.list}>
                                {s.options.map((o) => (
                                    <label key={o.value} className={styles.item}>
                                        <input
                                            type="radio"
                                            name={`sel-${s.id}`}
                                            checked={current === o.value}
                                            onChange={() => setLecturer(s.id, o.value)}
                                            aria-label={`${s.title}: ${o.label}`}
                                        />
                                        <span>{o.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <button className={styles.close} onClick={onClose}>Готово</button>
            </div>
        </div>
    );
}
