import { cn } from "@/lib/utils";

interface GlassTableProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassTable({ children, className }: GlassTableProps) {
    return (
        <div className={cn("overflow-x-auto", className)}>
            <table className="w-full">
                {children}
            </table>
        </div>
    );
}

interface GlassTableHeaderProps {
    children: React.ReactNode;
}

export function GlassTableHeader({ children }: GlassTableHeaderProps) {
    return (
        <thead className="border-b border-white/10">
            {children}
        </thead>
    );
}

interface GlassTableBodyProps {
    children: React.ReactNode;
}

export function GlassTableBody({ children }: GlassTableBodyProps) {
    return (
        <tbody className="divide-y divide-white/5">
            {children}
        </tbody>
    );
}

interface GlassTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: React.ReactNode;
    className?: string;
}

export function GlassTableRow({ children, className, ...props }: GlassTableRowProps) {
    return (
        <tr className={cn("hover:bg-white/5 transition-colors", className)} {...props}>
            {children}
        </tr>
    );
}

interface GlassTableHeadProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassTableHead({ children, className }: GlassTableHeadProps) {
    return (
        <th className={cn("px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider", className)}>
            {children}
        </th>
    );
}

interface GlassTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children: React.ReactNode;
    className?: string;
}

export function GlassTableCell({ children, className, ...props }: GlassTableCellProps) {
    return (
        <td className={cn("px-4 py-3 text-sm text-slate-300", className)} {...props}>
            {children}
        </td>
    );
}
