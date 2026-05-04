/**
 * Generate a CSV string from column definitions and row data.
 */
export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function generateCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.header)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escape(c.accessor(row))).join(','),
  );

  return [header, ...body].join('\n');
}

/**
 * Generate a descriptive filename for a report CSV.
 */
export function reportFilename(reportName: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `ssh-${reportName}-${date}.csv`;
}
