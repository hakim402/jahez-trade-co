export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
};

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  enableSelection?: boolean;
  enableExport?: boolean;
  actions?: (row: T) => React.ReactNode;
}