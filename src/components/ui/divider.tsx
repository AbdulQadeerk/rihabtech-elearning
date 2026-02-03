interface DividerProps {
    className?: string;
}

export default function Divider({ className = '' }: DividerProps) {
    return (
        <div
            className={`inline-block w-px h-[18px] bg-neutral-300 ${className}`}
        ></div>
    );
}