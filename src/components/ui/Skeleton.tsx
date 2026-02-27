import React from 'react';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-shimmer rounded-xl bg-white/5 ${className}`} />
    );
};

export default Skeleton;
