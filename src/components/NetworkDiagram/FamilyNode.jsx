import React from 'react';
import { Handle, Position } from 'reactflow';

const FamilyNode = ({ data, isConnectable }) => {
    const nodeClass = `family-node ${data.gender === 'M' ? 'male' : 'female'} ${data.selected ? 'selected' : ''}`;

    return (
        <div className={nodeClass}>
            {/* Handles for hierarchical connections */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                isConnectable={isConnectable}
                style={{ zIndex: 10 }}
            />

            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                isConnectable={isConnectable}
                style={{ zIndex: 10 }}
            />

            {/* Handles for spouse connections */}
            <Handle
                type="source"
                position={Position.Right}
                id="middle-right"
                style={{ top: '50%', zIndex: 10 }}
                isConnectable={isConnectable}
            />

            <Handle
                type="target"
                position={Position.Left}
                id="middle-left"
                style={{ top: '50%', zIndex: 10 }}
                isConnectable={isConnectable}
            />

            {/* Rank badge */}
            <div className="node-rank-badge">
                Rank: {data.rank || 'N/A'}
            </div>

            <div className="node-avatar">
                <img src={data.avatar} alt={data.name} />
            </div>

            <div className="node-content">
                <div className="node-name">{data.name}</div>

                {data.location && (
                    <div className="node-detail">
                        <span className="detail-label">Location:</span> {data.location}
                    </div>
                )}

                {data.work && (
                    <div className="node-detail">
                        <span className="detail-label">Work:</span> {data.work}
                    </div>
                )}

                {!data.expanded && (
                    <button
                        className="expand-node-btn"
                        onClick={data.onExpand}
                    >
                        Expand Network
                    </button>
                )}
            </div>
        </div>
    );
};

export default FamilyNode;