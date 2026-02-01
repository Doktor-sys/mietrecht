import React, { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  userRole: string;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
}

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extraLarge';
}

interface AdaptiveComponentProps {
  children: React.ReactNode;
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  roles?: string[];
  deviceInfo?: DeviceInfo;
  userPreferences?: UserPreferences;
  accessibilitySettings?: AccessibilitySettings;
}

export const AdaptiveContainer: React.FC<AdaptiveComponentProps> = ({ 
  children,
  breakpoints = { mobile: 768, tablet: 1024, desktop: 1200 },
  roles = [],
  deviceInfo,
  userPreferences,
  accessibilitySettings
}) => {
  // Wenn keine Props übergeben werden, verwenden wir Standardwerte
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<DeviceInfo>(() => {
    if (deviceInfo) return deviceInfo;
    
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return {
      isMobile: width <= (breakpoints.mobile || 768),
      isTablet: width > (breakpoints.mobile || 768) && width <= (breakpoints.tablet || 1024),
      isDesktop: width > (breakpoints.tablet || 1024),
      screenWidth: width
    };
  });
  
  const [currentUserPrefs, setCurrentUserPrefs] = useState<UserPreferences>(() => 
    userPreferences || { theme: 'light', userRole: 'USER', fontSize: 'medium' }
  );
  
  const [currentAccessibility, setCurrentAccessibility] = useState<AccessibilitySettings>(() => 
    accessibilitySettings || { highContrast: false, fontSize: 'medium' }
  );
  
  const [currentLayout, setCurrentLayout] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [componentStyles, setComponentStyles] = useState<React.CSSProperties>({});
  
  // Erkenne Bildschirmgröße und passe Layout an
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width <= (breakpoints.mobile || 768)) {
        setCurrentLayout('mobile');
      } else if (width <= (breakpoints.tablet || 1024)) {
        setCurrentLayout('tablet');
      } else {
        setCurrentLayout('desktop');
      }
      
      // Aktualisiere DeviceInfo
      setCurrentDeviceInfo({
        isMobile: width <= (breakpoints.mobile || 768),
        isTablet: width > (breakpoints.mobile || 768) && width <= (breakpoints.tablet || 1024),
        isDesktop: width > (breakpoints.tablet || 1024),
        screenWidth: width
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);
  
  // Aktualisiere Stil basierend auf Einstellungen
  useEffect(() => {
    const styles: React.CSSProperties = {};
    
    // Farbmodus
    if (currentUserPrefs.theme === 'dark') {
      styles.backgroundColor = '#1a1a1a';
      styles.color = '#ffffff';
    } else {
      styles.backgroundColor = '#ffffff';
      styles.color = '#000000';
    }
    
    // Schriftgröße basierend auf Barrierefreiheit
    if (currentAccessibility.fontSize === 'large') {
      styles.fontSize = '1.2em';
    } else if (currentAccessibility.fontSize === 'extraLarge') {
      styles.fontSize = '1.5em';
    }
    
    // Kontrast basierend auf Barrierefreiheit
    if (currentAccessibility.highContrast) {
      styles.border = '2px solid yellow';
    }
    
    // Layout-spezifische Anpassungen
    switch (currentLayout) {
      case 'mobile':
        styles.padding = '10px';
        styles.flexDirection = 'column';
        break;
      case 'tablet':
        styles.padding = '15px';
        styles.flexDirection = 'row';
        break;
      case 'desktop':
        styles.padding = '20px';
        styles.flexDirection = 'row';
        break;
    }
    
    setComponentStyles(styles);
  }, [currentUserPrefs, currentAccessibility, currentLayout, breakpoints]);
  
  // Prüfe ob Benutzerrolle erlaubt ist
  if (roles.length > 0 && !roles.includes(currentUserPrefs.userRole)) {
    return null;
  }
  
  return React.createElement(
    'div',
    {
      className: `adaptive-container adaptive-container--${currentLayout}`,
      style: componentStyles
    },
    children
  );
};

// Adaptive Karte-Komponente
interface AdaptiveCardProps {
  title: string;
  children: React.ReactNode;
  priority?: 'low' | 'medium' | 'high';
  collapsible?: boolean;
  isMobile?: boolean;
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({ 
  title, 
  children, 
  priority = 'medium',
  collapsible = false,
  isMobile = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Auf mobilen Geräten standardmäßig einklappen, wenn collapsible
  useEffect(() => {
    if (collapsible && isMobile) {
      setIsCollapsed(true);
    }
  }, [collapsible, isMobile]);
  
  const getPriorityClass = () => {
    switch (priority) {
      case 'high': return 'card--high-priority';
      case 'low': return 'card--low-priority';
      default: return 'card--medium-priority';
    }
  };
  
  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  return React.createElement(
    'div',
    { className: `adaptive-card ${getPriorityClass()} ${isCollapsed ? 'card--collapsed' : ''}` },
    React.createElement(
      'div',
      { className: 'card-header', onClick: toggleCollapse },
      React.createElement('h3', { className: 'card-title' }, title),
      collapsible && React.createElement(
        'button',
        { className: 'collapse-toggle', 'aria-label': isCollapsed ? 'Expandieren' : 'Einklappen' },
        isCollapsed ? '▼' : '▲'
      )
    ),
    !isCollapsed && React.createElement(
      'div',
      { className: 'card-content' },
      children
    )
  );
};

// Adaptive Navigation
interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  roles: string[];
}

interface AdaptiveNavigationProps {
  isMobile?: boolean;
  userRole?: string;
}

export const AdaptiveNavigation: React.FC<AdaptiveNavigationProps> = ({ 
  isMobile = false,
  userRole = 'USER'
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Auf mobilen Geräten Menü standardmäßig einklappen
  useEffect(() => {
    if (isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);
  
  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['USER', 'LAWYER', 'ADMIN'] },
    { id: 'cases', label: 'Fälle', icon: '📁', roles: ['USER', 'LAWYER', 'ADMIN'] },
    { id: 'documents', label: 'Dokumente', icon: '📄', roles: ['USER', 'LAWYER', 'ADMIN'] },
    { id: 'calendar', label: 'Kalender', icon: '📅', roles: ['USER', 'LAWYER', 'ADMIN'] },
    { id: 'settings', label: 'Einstellungen', icon: '⚙️', roles: ['USER', 'LAWYER', 'ADMIN'] },
    { id: 'admin', label: 'Administration', icon: '🛡️', roles: ['ADMIN'] }
  ];
  
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );
  
  if (isMobile) {
    return React.createElement(
      'nav',
      { className: 'adaptive-nav mobile-nav' },
      React.createElement(
        'button',
        {
          className: 'menu-toggle',
          onClick: () => setIsMenuOpen(!isMenuOpen),
          'aria-label': 'Menü umschalten'
        },
        '☰'
      ),
      isMenuOpen && React.createElement(
        'ul',
        { className: 'nav-menu' },
        filteredItems.map(item => 
          React.createElement(
            'li',
            { key: item.id, className: 'nav-item' },
            React.createElement(
              'a',
              { href: `#${item.id}`, className: 'nav-link' },
              React.createElement('span', { className: 'nav-icon' }, item.icon),
              React.createElement('span', { className: 'nav-label' }, item.label)
            )
          )
        )
      )
    );
  }
  
  return React.createElement(
    'nav',
    { className: 'adaptive-nav desktop-nav' },
    React.createElement(
      'ul',
      { className: 'nav-menu' },
      filteredItems.map(item =>
        React.createElement(
          'li',
          { key: item.id, className: 'nav-item' },
          React.createElement(
            'a',
            { href: `#${item.id}`, className: 'nav-link' },
            React.createElement('span', { className: 'nav-icon' }, item.icon),
            React.createElement('span', { className: 'nav-label' }, item.label)
          )
        )
      )
    )
  );
};

// Adaptive Formularkomponente
interface AdaptiveFormProps {
  onSubmit: (data: any) => void;
  children: React.ReactNode;
  submitLabel?: string;
  fontSize?: 'small' | 'medium' | 'large' | 'extraLarge';
}

export const AdaptiveForm: React.FC<AdaptiveFormProps> = ({ 
  onSubmit, 
  children, 
  submitLabel = 'Speichern',
  fontSize = 'medium'
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Formulardaten sammeln und übergeben
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    onSubmit(data);
  };
  
  const getFontSize = () => {
    switch (fontSize) {
      case 'large': return '1.2em';
      case 'extraLarge': return '1.5em';
      default: return '1em';
    }
  };
  
  return React.createElement(
    'form',
    {
      onSubmit: handleSubmit,
      className: `adaptive-form ${isMobile ? 'form-mobile' : 'form-desktop'}`
    },
    React.createElement('div', { className: 'form-fields' }, children),
    React.createElement(
      'div',
      { className: 'form-actions' },
      React.createElement(
        'button',
        {
          type: 'submit',
          className: 'submit-button',
          style: { fontSize: getFontSize() }
        },
        submitLabel
      )
    )
  );
};

// Adaptive Datentabelle
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface AdaptiveTableProps {
  columns: TableColumn[];
  data: any[];
  onRowClick?: (row: any) => void;
  isMobile?: boolean;
}

export const AdaptiveTable: React.FC<AdaptiveTableProps> = ({ 
  columns, 
  data, 
  onRowClick,
  isMobile = false
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);
  
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  if (isMobile) {
    // Auf mobilen Geräten als Liste anzeigen
    return React.createElement(
      'div',
      { className: 'adaptive-table mobile-table' },
      sortedData.map((row, index) =>
        React.createElement(
          'div',
          {
            key: index,
            className: 'table-row-mobile',
            onClick: () => onRowClick?.(row)
          },
          columns.map(column =>
            React.createElement(
              'div',
              { key: column.key, className: 'row-item' },
              React.createElement('strong', null, `${column.label}:`),
              ' ',
              row[column.key]
            )
          )
        )
      )
    );
  }
  
  // Auf Desktop als Tabelle anzeigen
  return React.createElement(
    'table',
    { className: 'adaptive-table desktop-table' },
    React.createElement(
      'thead',
      null,
      React.createElement(
        'tr',
        null,
        columns.map(column =>
          React.createElement(
            'th',
            {
              key: column.key,
              onClick: () => column.sortable && handleSort(column.key),
              className: column.sortable ? 'sortable' : ''
            },
            column.label,
            sortConfig?.key === column.key && React.createElement(
              'span',
              null,
              sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
            )
          )
        )
      )
    ),
    React.createElement(
      'tbody',
      null,
      sortedData.map((row, index) =>
        React.createElement(
          'tr',
          {
            key: index,
            onClick: () => onRowClick?.(row),
            className: onRowClick ? 'clickable' : ''
          },
          columns.map(column =>
            React.createElement('td', { key: column.key }, row[column.key])
          )
        )
      )
    )
  );
};