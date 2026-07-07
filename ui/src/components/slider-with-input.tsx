import { Slider, InputNumber } from "antd";

interface SliderWithInputProps {
	value?: number;
	onChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	marks?: Record<number, string>;
	disabled?: boolean;
	precision?: number;
}

export default function SliderWithInput({
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	marks,
	disabled,
	precision,
}: SliderWithInputProps) {
	const hasMarks = marks && Object.keys(marks).length > 0;

	return (
		<div className="flex items-center gap-4">
			<div className="flex-1">
				<Slider
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={onChange}
					disabled={disabled}
				/>
				{hasMarks && (
					<div className="relative h-5 mt-1 select-none">
						{Object.entries(marks).map(([k, label]) => {
							const pct = ((Number(k) - min) / (max - min)) * 100;
							return (
								<span
									key={k}
									className="absolute cursor-pointer text-[10px] leading-5 whitespace-nowrap text-gray-500 hover:text-gray-700"
									style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
									onClick={() => !disabled && onChange?.(Number(k))}
								>
									{label}
								</span>
							);
						})}
					</div>
				)}
			</div>
			<InputNumber
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(v) => onChange?.(v ?? min)}
				disabled={disabled}
				precision={precision}
				size="small"
				className="w-16 text-xs"
			/>
		</div>
	);
}
