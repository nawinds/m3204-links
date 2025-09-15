import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

// Кастомный TabItem с обработчиком клика
export const PersistentTabItem = ({ value, label, children, onTabClick, isActive }) => {
  return (
    <div
      role="tab"
      aria-selected={isActive}
      data-value={value}
      onClick={() => onTabClick(value)}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: isActive ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        color: isActive ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)'
      }}
    >
      {label}
    </div>
  );
};

// Главный компонент табов
const PersistentTabs = ({ children, groupId = 'default', defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const [isClient, setIsClient] = useState(false);

  // Загрузка сохраненной вкладки
  useEffect(() => {
    setIsClient(true);
    const savedTab = Cookies.get(`tab_${groupId}`);
    console.log('Загружена вкладка из куков:', savedTab);
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, [groupId]);

  // Обработчик клика по вкладке
  const handleTabClick = (value) => {
    console.log('Клик по вкладке:', value);
    setActiveTab(value);
    Cookies.set(`tab_${groupId}`, value, {
      expires: 365,
      sameSite: 'Lax'
    });
    console.log('Сохранено в куки:', value);
  };

  if (!isClient) {
    return <div>Загрузка...</div>;
  }

  // Находим активный контент
  const activeContent = React.Children.toArray(children).find(
    child => child.props.value === activeTab
  );

  return (
    <div>
      {/* Панель вкладок */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--ifm-color-emphasis-300)',
          marginBottom: '1rem'
        }}
      >
        {React.Children.map(children, (child) => (
          <PersistentTabItem
            key={child.props.value}
            value={child.props.value}
            label={child.props.label}
            isActive={child.props.value === activeTab}
            onTabClick={handleTabClick}
          />
        ))}
      </div>

      {/* Контент активной вкладки */}
      <div>
        {activeContent ? activeContent.props.children : 'Контент не найден'}
      </div>
    </div>
  );
};

export default PersistentTabs;