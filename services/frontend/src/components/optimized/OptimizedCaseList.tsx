import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';

// Einfacher Performance-Monitor für Frontend
const frontendPerformanceMonitor = {
  trackComponentRender: (componentName: string, renderTime: number) => {
    console.log(`[PERFORMANCE] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
  }
};

interface Case {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface CaseListProps {
  cases: Case[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const OptimizedCaseList = ({
  cases,
  loading,
  onLoadMore,
  hasMore
}: CaseListProps) => {
  // Verwende Performance-Optimierung
  const { 
    data: optimizedCases,
    isLoaded,
    metrics,
    measureRenderTime,
    useDebounce
  } = usePerformanceOptimization(cases, {
    debounceDelay: 300,
    memoize: true
    // lazyLoad entfernt, da es Probleme verursacht
  });

  // Zustand für Filter und Suche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Debounced Suche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Gefilterte und gefundene Fälle
  const filteredCases = useMemo(() => {
    return optimizedCases.filter(caseItem => {
      const matchesSearch = debouncedSearchTerm
        ? caseItem.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        : true;
      
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [optimizedCases, debouncedSearchTerm, statusFilter, priorityFilter]);

  // Performance-Messung
  useEffect(() => {
    if (isLoaded) {
      frontendPerformanceMonitor.trackComponentRender('OptimizedCaseList', metrics.renderTime);
    }
  }, [isLoaded, metrics.renderTime]);

  // Scroll-Handler
  const handleScroll = useCallback((e: any) => {
    // Unendliches Scrollen
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Fall-Komponente
  const CaseItem = ({ caseItem }: { caseItem: Case }) => {
    return (
      <div className="case-item" style={{ height: 60 }}>
        <div className="case-title">{caseItem.title}</div>
        <div className="case-meta">
          <span className={`status ${caseItem.status.toLowerCase()}`}>
            {caseItem.status}
          </span>
          <span className={`priority ${caseItem.priority.toLowerCase()}`}>
            {caseItem.priority}
          </span>
          {caseItem.category && (
            <span className="category">{caseItem.category}</span>
          )}
        </div>
        <div className="case-date">
          Erstellt: {new Date(caseItem.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  // Ladeanzeige
  if (loading && optimizedCases.length === 0) {
    return (
      <div className="case-list-loading">
        <div className="spinner"></div>
        <p>Fälle werden geladen...</p>
      </div>
    );
  }

  // Leere Liste
  if (filteredCases.length === 0 && !loading) {
    return (
      <div className="case-list-empty">
        <p>Keine Fälle gefunden</p>
      </div>
    );
  }

  return (
    <div className="optimized-case-list">
      {/* Filter und Suchleiste */}
      <div className="case-list-filters">
        <input
          type="text"
          placeholder="Fälle durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Alle Status</option>
          <option value="open">Offen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="closed">Geschlossen</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Alle Prioritäten</option>
          <option value="low">Niedrig</option>
          <option value="medium">Mittel</option>
          <option value="high">Hoch</option>
        </select>
      </div>

      {/* Fall-Liste mit einfacher Scrolling-Implementierung */}
      <div
        className="case-list-container"
        style={{ height: 400, overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        <div className="case-list-content">
          {filteredCases.map((caseItem) => (
            <div key={caseItem.id}>
              <CaseItem caseItem={caseItem} />
            </div>
          ))}
        </div>
      </div>

      {/* Ladeanzeige für weitere Daten */}
      {loading && hasMore && (
        <div className="load-more-loading">
          <div className="spinner"></div>
          <p>Weitere Fälle werden geladen...</p>
        </div>
      )}

      {/* Performance-Metriken */}
      <div className="performance-metrics">
        <small>
          Renderzeit: {metrics.renderTime.toFixed(2)}ms | 
          Komponenten: {metrics.componentCount} |
          Re-renders: {metrics.reRenderCount}
        </small>
      </div>
    </div>
  );
};