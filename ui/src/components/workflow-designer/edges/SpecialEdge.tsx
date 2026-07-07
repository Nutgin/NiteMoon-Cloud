import { memo } from "react";
import {
	getBezierPath,
	EdgeProps,
	getMarkerEnd,
} from "reactflow";

const SpecialEdge = memo(
	({
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		style = {},
		arrowHeadType,
		markerEndId,
	}: EdgeProps) => {
		const [edgePath] = getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		});

		const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

		return (
			<>
				<path
					id={id}
					className="react-flow__edge-path"
					d={edgePath}
					markerEnd={markerEnd}
					style={{ ...style, strokeWidth: 1.5, stroke: "#1890ff" }}
				/>
				<path
					d={edgePath}
					fill="none"
					stroke="transparent"
					strokeWidth={20}
					className="react-flow__edge-interaction"
				/>
			</>
		);
	}
);

SpecialEdge.displayName = "SpecialEdge";

export default SpecialEdge;
