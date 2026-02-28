import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { cn } from '@/lib/utils';

// Register all Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * GSDS DataTable Wrapper
 * Applies institutional styling to AG Grid using the v33+ Theming API
 */
export function DataTable({
  rowData,
  columnDefs,
  className,
  ...props
}) {
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    filter: true,
    sortable: true,
    resizable: true,
  }), []);

  // Use the Theming API to customize the grid
  const greenSchoolTheme = themeQuartz.withParams({
    backgroundColor: 'var(--neutral-50)',
    headerBackgroundColor: 'var(--neutral-100)',
    headerTextColor: 'var(--neutral-900)',
    dataColor: 'var(--neutral-900)',
    oddRowBackgroundColor: 'var(--bg-card)',
    rowHoverColor: 'var(--neutral-100)',
    selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
    borderColor: 'var(--neutral-200)',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    headerFontWeight: '700',
    gridSize: 8,
  });

  return (
    <div
      className={cn(
        "gsds-grid-wrapper w-full h-[400px] border rounded-lg overflow-hidden shadow-sm",
        className
      )}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        pagination={true}
        paginationPageSize={10}
        theme={greenSchoolTheme}
        {...props}
      />

      <style>{`
        .gsds-grid-wrapper .ag-header-cell-label {
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-size: 11px;
          color: var(--neutral-500);
        }

        .gsds-grid-wrapper .ag-row {
          transition: background-color 0.1s ease;
        }

        .gsds-grid-wrapper .ag-cell {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
