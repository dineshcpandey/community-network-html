import React from 'react';
import { Handle, Position } from 'reactflow';

const FamilyNode = ({ data }) => {
    const nodeClass = `family-node ${data.gender === 'M' ? 'male' : 'female'} ${data.selected ? 'selected' : ''}`;

    return (
        <div className={nodeClass}>
            <Handle type="target" position={Position.Top} />

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

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default FamilyNode;