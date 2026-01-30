/**
 * Minimal top toolbar (sidepanel only).
 *
 * User feedback:
 * - Remove verbose title/stats ("ChatGPT Graph", branch counts, QA counts)
 * - Keep it clean: buttons only
 * - Must be responsive at narrow widths (no clipped buttons)
 */

import React from 'react';

export default function Header({
  onRefresh,
  isLoading,
  viewMode = 'graph',
  onViewModeChange
}) {
  return (
    <header className="header header-toolbar" aria-label="ChatGPT Graph Toolbar">
      <div className="header-toolbar-left">
        <div className="view-toggle" role="tablist" aria-label="View mode">
          <button
            className={'view-toggle-btn' + (viewMode === 'graph' ? ' active' : '')}
            onClick={() => onViewModeChange?.('graph')}
            title="Graph"
            aria-label="Graph"
            type="button"
          >
            🗺️
          </button>
          <button
            className={'view-toggle-btn' + (viewMode === 'tree' ? ' active' : '')}
            onClick={() => onViewModeChange?.('tree')}
            title="Tree"
            aria-label="Tree"
            type="button"
          >
            🌿
          </button>
        </div>
      </div>

      <div className="header-toolbar-right">
        <button
          className="refresh-btn icon-btn"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh"
          aria-label="Refresh"
          type="button"
        >
          <span className={isLoading ? 'spinning' : ''}>🔄</span>
        </button>
      </div>
    </header>
  );
}
