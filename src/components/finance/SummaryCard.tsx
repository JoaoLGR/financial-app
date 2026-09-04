export function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: 'income' }) { return <div><span>{label}</span><strong className={tone}>{value}</strong></div>; }
